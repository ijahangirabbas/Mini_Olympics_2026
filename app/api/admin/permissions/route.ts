import { NextRequest, NextResponse } from 'next/server';
import { sql, runTransaction } from '@/lib/db';
import {
  ADMIN_PAGES,
  ALL_ADMIN_PAGE_KEYS,
  ensureAuthAndPermissionsSchema,
  getAdminSession,
  hasPagePermission,
  normalizeRole,
  parseAssignedGames,
  rolePermissions,
} from '@/lib/auth';
import { logAudit, getClientIp } from '@/lib/audit';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString('base64')}:${derivedKey.toString('base64')}`;
}

type IncomingPermission = {
  pageKey: string;
  canView?: boolean;
  canEdit?: boolean;
  canDelegate?: boolean;
};

function canDelegatePermissions(session: NonNullable<Awaited<ReturnType<typeof getAdminSession>>>): boolean {
  if (session.role === 'super_admin') return true;
  return Boolean(session.permissionDetails?.['/admin/permissions']?.canDelegate);
}

function sanitizeIncomingPermissions(
  rawList: unknown,
  actorSession: NonNullable<Awaited<ReturnType<typeof getAdminSession>>>
): { pageKey: string; canView: boolean; canEdit: boolean; canDelegate: boolean }[] {
  if (!Array.isArray(rawList)) return [];

  const isSuper = actorSession.role === 'super_admin';
  const result: { pageKey: string; canView: boolean; canEdit: boolean; canDelegate: boolean }[] = [];

  for (const item of rawList as IncomingPermission[]) {
    const pageKey = String(item?.pageKey || '').trim();
    if (!ALL_ADMIN_PAGE_KEYS.includes(pageKey)) continue;

    let canView = Boolean(item?.canView);
    let canEdit = canView && Boolean(item?.canEdit);
    let canDelegate = canView && Boolean(item?.canDelegate);

    if (!isSuper) {
      const actorDetail = actorSession.permissionDetails?.[pageKey];
      // Non-super-admin can only grant permissions on pages where they hold canDelegate
      if (!actorDetail?.canView || !actorDetail?.canDelegate) {
        canView = false;
        canEdit = false;
        canDelegate = false;
      } else {
        canEdit = canEdit && actorDetail.canEdit;
        canDelegate = canDelegate && actorDetail.canDelegate;
      }
    }

    result.push({ pageKey, canView, canEdit, canDelegate });
  }

  return result;
}

async function syncCoordinatorGameAssignments(userId: string, gameNames: string[]) {
  await sql`DELETE FROM coordinator_game_assignments WHERE user_id = ${userId}`;
  if (gameNames.length === 0) return;

  const gameRows = (await sql`
    SELECT DISTINCT ON (LOWER(game_name))
      COALESCE(game_id, LOWER(REGEXP_REPLACE(game_name, '[^a-zA-Z0-9]+', '-', 'g'))) AS resolved_game_id,
      game_name
    FROM games_pricing
  `) as any[];

  const idByName = new Map<string, string>();
  for (const g of gameRows) {
    idByName.set(String(g.game_name).toLowerCase(), String(g.resolved_game_id));
  }

  for (const rawName of gameNames) {
    const name = rawName.trim();
    if (!name) continue;
    const gameId =
      idByName.get(name.toLowerCase()) ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await sql`
      INSERT INTO coordinator_game_assignments (id, user_id, game_id, game_name, created_at)
      VALUES (${uuidv4()}, ${userId}, ${gameId}, ${name}, NOW())
      ON CONFLICT (user_id, game_name) DO UPDATE SET game_id = EXCLUDED.game_id
    `;
  }
}

// GET - List users, their permissions, available pages, and games
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPagePermission(session, '/admin/permissions', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ensureAuthAndPermissionsSchema();

    const usersRows = (await sql`
      SELECT id, username, display_name, role, assigned_games, assigned_gender, created_by, is_active, created_at, updated_at
      FROM admin_users
      ORDER BY created_at DESC
    `) as any[];

    const permRows = (await sql`
      SELECT id, user_id, page_key, can_view, can_edit, can_delegate, granted_by, updated_at
      FROM permissions
    `) as any[];

    const permsByUser = new Map<string, any[]>();
    for (const p of permRows) {
      const list = permsByUser.get(p.user_id) || [];
      list.push({
        pageKey: p.page_key,
        canView: Boolean(p.can_view),
        canEdit: Boolean(p.can_edit),
        canDelegate: Boolean(p.can_delegate),
        grantedBy: p.granted_by,
      });
      permsByUser.set(p.user_id, list);
    }

    const users = usersRows.map((u) => {
      const role = normalizeRole(u.role);
      const explicitPerms = permsByUser.get(u.id) || [];
      // Only super_admin gets implicit all-page permissions; sub_admin uses explicit rows only
      const effectivePerms =
        role === 'super_admin'
          ? (rolePermissions.super_admin || []).map((key) => ({
              pageKey: key,
              canView: true,
              canEdit: true,
              canDelegate: true,
              grantedBy: 'role_default',
            }))
          : explicitPerms.length > 0
            ? explicitPerms
            : role === 'sub_admin'
              ? []
              : (rolePermissions[role] || []).map((key) => ({
                  pageKey: key,
                  canView: true,
                  canEdit: true,
                  canDelegate: false,
                  grantedBy: 'role_default',
                }));

      return {
        id: u.id,
        username: u.username,
        displayName: u.display_name || u.username,
        role,
        assignedGames: parseAssignedGames(u.assigned_games),
        assignedGender: (u.assigned_gender || 'both') as 'boys' | 'girls' | 'both',
        createdBy: u.created_by || null,
        isActive: u.is_active !== false,
        createdAt: u.created_at,
        hasExplicitPermissions: explicitPerms.length > 0,
        permissions: effectivePerms,
      };
    });

    const gamesRows = (await sql`
      SELECT DISTINCT game_name FROM games_pricing WHERE COALESCE(is_active, true) = true ORDER BY game_name ASC
    `) as any[];

    return NextResponse.json({
      success: true,
      users,
      pages: ADMIN_PAGES,
      games: gamesRows.map((g) => g.game_name),
      currentUser: {
        userId: session.adminUserId,
        username: session.username,
        role: session.role,
        permissions: session.permissions,
        permissionDetails: session.permissionDetails,
      },
    });
  } catch (error: any) {
    console.error('Fetch permissions error:', error);
    return NextResponse.json({ error: 'Failed to load permissions', details: error.message }, { status: 500 });
  }
}

// POST - Create a new user (sub_admin, coordinator, or role) with explicit page permissions
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPagePermission(session, '/admin/permissions', 'edit') || !canDelegatePermissions(session)) {
      return NextResponse.json({ error: 'Forbidden - Delegation permission required' }, { status: 403 });
    }

    await ensureAuthAndPermissionsSchema();

    const body = await request.json();
    const username = String(body?.username || '').trim();
    const displayName = String(body?.displayName || username).trim();
    const password = String(body?.password || '').trim();
    const requestedRole = normalizeRole(body?.role || 'sub_admin');
    const assignedGames = Array.isArray(body?.assignedGames)
      ? body.assignedGames.map((g: any) => String(g).trim()).filter(Boolean)
      : [];
    const assignedGender = ['boys', 'girls', 'both'].includes(body?.assignedGender)
      ? body.assignedGender
      : 'both';
    const isActive = body?.isActive !== false;

    if (!username || username.length < 2) {
      return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (session.role !== 'super_admin' && !['coordinator', 'sub_admin'].includes(requestedRole)) {
      return NextResponse.json(
        { error: 'Sub-admins may only create coordinator or sub_admin accounts' },
        { status: 403 }
      );
    }

    if (
      session.role !== 'super_admin' &&
      requestedRole === 'coordinator' &&
      !session.permissionDetails?.['/admin/coordinator']?.canDelegate
    ) {
      return NextResponse.json(
        { error: 'You must hold delegate permission for Coordinator Portal to create coordinator accounts' },
        { status: 403 }
      );
    }

    const existing = (await sql`SELECT id FROM admin_users WHERE LOWER(username) = LOWER(${username}) LIMIT 1`) as any[];
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const userId = uuidv4();
    const passwordHash = hashPassword(password);

    await sql`
      INSERT INTO admin_users (
        id, username, display_name, password_hash, role,
        assigned_games, assigned_gender, created_by, is_active, created_at, updated_at
      ) VALUES (
        ${userId}, ${username}, ${displayName}, ${passwordHash}, ${requestedRole},
        ${JSON.stringify(assignedGames)}, ${assignedGender}, ${session.username || 'system'}, ${isActive}, NOW(), NOW()
      )
    `;

    // Store explicit rows in permissions table
    let sanitizedPerms = sanitizeIncomingPermissions(body?.permissions, session);
    if (sanitizedPerms.length === 0 && requestedRole === 'coordinator') {
      sanitizedPerms = [{ pageKey: '/admin/coordinator', canView: true, canEdit: true, canDelegate: false }];
    } else if (sanitizedPerms.length === 0 && requestedRole !== 'super_admin' && requestedRole !== 'sub_admin') {
      sanitizedPerms = (rolePermissions[requestedRole] || []).map((pageKey) => ({
        pageKey,
        canView: true,
        canEdit: true,
        canDelegate: false,
      }));
    }

    for (const perm of sanitizedPerms) {
      if (!perm.canView) continue;
      await sql`
        INSERT INTO permissions (id, user_id, page_key, can_view, can_edit, can_delegate, granted_by, created_at, updated_at)
        VALUES (${uuidv4()}, ${userId}, ${perm.pageKey}, ${perm.canView}, ${perm.canEdit}, ${perm.canDelegate}, ${session.username || 'system'}, NOW(), NOW())
        ON CONFLICT (user_id, page_key) DO UPDATE SET
          can_view = EXCLUDED.can_view,
          can_edit = EXCLUDED.can_edit,
          can_delegate = EXCLUDED.can_delegate,
          granted_by = EXCLUDED.granted_by,
          updated_at = NOW()
      `;
    }

    await syncCoordinatorGameAssignments(userId, assignedGames);

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'user.create',
      targetType: 'admin_user',
      targetId: userId,
      after: {
        username,
        displayName,
        role: requestedRole,
        assignedGames,
        assignedGender,
        isActive,
        permissions: sanitizedPerms.filter((p) => p.canView),
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('Create user/permissions error:', error);
    return NextResponse.json({ error: 'Failed to create user', details: error.message }, { status: 500 });
  }
}

// PUT - Update user details, role, assigned games, and permissions table rows
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPagePermission(session, '/admin/permissions', 'edit') || !canDelegatePermissions(session)) {
      return NextResponse.json({ error: 'Forbidden - Delegation permission required' }, { status: 403 });
    }

    await ensureAuthAndPermissionsSchema();

    const body = await request.json();
    const userId = String(body?.userId || '').trim();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (session.adminUserId && session.adminUserId === userId) {
      return NextResponse.json(
        { error: 'You cannot modify your own role or permissions' },
        { status: 403 }
      );
    }

    const existingRows = (await sql`SELECT * FROM admin_users WHERE id = ${userId} LIMIT 1`) as any[];
    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const targetUser = existingRows[0];
    const targetCurrentRole = normalizeRole(targetUser.role);

    if (targetCurrentRole === 'super_admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only Super Admin can modify a Super Admin account' }, { status: 403 });
    }

    const nextRole = body?.role ? normalizeRole(body.role) : targetCurrentRole;
    if (session.role !== 'super_admin') {
      if (nextRole !== targetCurrentRole && !['coordinator', 'sub_admin'].includes(nextRole)) {
        return NextResponse.json(
          { error: 'Sub-admins cannot assign privileged legacy roles' },
          { status: 403 }
        );
      }
      if (!['coordinator', 'sub_admin'].includes(targetCurrentRole)) {
        return NextResponse.json(
          { error: 'Only Super Admin can modify legacy privileged role accounts' },
          { status: 403 }
        );
      }
    }

    const rawPassword = body?.password !== undefined ? String(body.password).trim() : '';
    if (rawPassword.length > 0 && rawPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const displayName =
      body?.displayName !== undefined ? String(body.displayName).trim() : targetUser.display_name || targetUser.username;
    const assignedGamesArray =
      body?.assignedGames !== undefined && Array.isArray(body.assignedGames)
        ? body.assignedGames.map((g: any) => String(g).trim()).filter(Boolean)
        : parseAssignedGames(targetUser.assigned_games);
    const assignedGamesJson = JSON.stringify(assignedGamesArray);
    const assignedGender =
      body?.assignedGender && ['boys', 'girls', 'both'].includes(body.assignedGender)
        ? body.assignedGender
        : targetUser.assigned_gender || 'both';
    const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : targetUser.is_active !== false;

    const sanitizedPerms = Array.isArray(body?.permissions)
      ? sanitizeIncomingPermissions(body.permissions, session)
      : null;

    await runTransaction((txn) => {
      const queries: any[] = [];
      if (rawPassword.length >= 8) {
        const passwordHash = hashPassword(rawPassword);
        queries.push(txn`
          UPDATE admin_users
          SET display_name = ${displayName},
              role = ${nextRole},
              password_hash = ${passwordHash},
              assigned_games = ${assignedGamesJson},
              assigned_gender = ${assignedGender},
              is_active = ${isActive},
              updated_at = NOW()
          WHERE id = ${userId}
        `);
      } else {
        queries.push(txn`
          UPDATE admin_users
          SET display_name = ${displayName},
              role = ${nextRole},
              assigned_games = ${assignedGamesJson},
              assigned_gender = ${assignedGender},
              is_active = ${isActive},
              updated_at = NOW()
          WHERE id = ${userId}
        `);
      }

      if (sanitizedPerms && nextRole !== 'super_admin') {
        if (session.role === 'super_admin') {
          queries.push(txn`DELETE FROM permissions WHERE user_id = ${userId}`);
        } else {
          for (const p of sanitizedPerms) {
            if (session.permissionDetails?.[p.pageKey]?.canView && session.permissionDetails?.[p.pageKey]?.canDelegate) {
              queries.push(txn`DELETE FROM permissions WHERE user_id = ${userId} AND page_key = ${p.pageKey}`);
            }
          }
        }

        for (const perm of sanitizedPerms) {
          if (!perm.canView) continue;
          queries.push(txn`
            INSERT INTO permissions (id, user_id, page_key, can_view, can_edit, can_delegate, granted_by, created_at, updated_at)
            VALUES (${uuidv4()}, ${userId}, ${perm.pageKey}, ${perm.canView}, ${perm.canEdit}, ${perm.canDelegate}, ${session.username || 'system'}, NOW(), NOW())
            ON CONFLICT (user_id, page_key) DO UPDATE SET
              can_view = EXCLUDED.can_view,
              can_edit = EXCLUDED.can_edit,
              can_delegate = EXCLUDED.can_delegate,
              granted_by = EXCLUDED.granted_by,
              updated_at = NOW()
          `);
        }
      }

      if (!isActive || rawPassword.length >= 8 || nextRole !== targetCurrentRole) {
        queries.push(txn`DELETE FROM admin_sessions WHERE admin_user_id = ${userId}`);
      }
      return queries;
    });

    if (body?.assignedGames !== undefined) {
      await syncCoordinatorGameAssignments(userId, assignedGamesArray);
    }

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'user.update',
      targetType: 'admin_user',
      targetId: userId,
      before: {
        role: targetCurrentRole,
        isActive: targetUser.is_active !== false,
        assignedGender: targetUser.assigned_gender,
      },
      after: {
        displayName,
        role: nextRole,
        isActive,
        assignedGender,
        assignedGames: assignedGamesArray,
        passwordChanged: rawPassword.length >= 8,
        permissionsUpdated: sanitizedPerms ? sanitizedPerms.filter((p) => p.canView).length : 0,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update user/permissions error:', error);
    return NextResponse.json({ error: 'Failed to update user', details: error.message }, { status: 500 });
  }
}

// DELETE - Delete user (cascades permissions rows)
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPagePermission(session, '/admin/permissions', 'edit') || !canDelegatePermissions(session)) {
      return NextResponse.json({ error: 'Forbidden - Delegation permission required' }, { status: 403 });
    }

    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (session.adminUserId === userId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const targetRows = (await sql`SELECT id, username, role FROM admin_users WHERE id = ${userId} LIMIT 1`) as any[];
    if (targetRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetRole = normalizeRole(targetRows[0].role);
    if (targetRole === 'super_admin') {
      if (session.role !== 'super_admin') {
        return NextResponse.json({ error: 'Only Super Admin can delete a Super Admin account' }, { status: 403 });
      }
      const countRes = (await sql`
        SELECT COUNT(*)::int AS cnt FROM admin_users WHERE role IN ('super_admin', 'admin')
      `) as any[];
      if ((Number(countRes[0]?.cnt) || 0) <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last Super Admin account' }, { status: 400 });
      }
    } else if (session.role !== 'super_admin' && !['coordinator', 'sub_admin'].includes(targetRole)) {
      return NextResponse.json({ error: 'Only Super Admin can delete legacy role accounts' }, { status: 403 });
    }

    await runTransaction((txn) => [
      txn`DELETE FROM admin_sessions WHERE admin_user_id = ${userId}`,
      txn`DELETE FROM admin_users WHERE id = ${userId}`,
    ]);

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'user.delete',
      targetType: 'admin_user',
      targetId: userId,
      before: { username: targetRows[0].username, role: targetRole },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user', details: error.message }, { status: 500 });
  }
}
