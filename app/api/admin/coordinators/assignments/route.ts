import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureAuthAndPermissionsSchema, requireAdminPermission, getAdminSession, hasPagePermission } from '@/lib/auth';
import { toGameSlug } from '@/lib/games-sync';
import { logAudit, getClientIp } from '@/lib/audit';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// GET - List player and game assignments (HOC/SuperAdmin sees all; Coordinator sees own)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getAdminSession(cookieStore.get('admin_session')?.value);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManage =
      session.role === 'super_admin' || hasPagePermission(session, '/admin/hoc', 'view');
    const canViewCoord = hasPagePermission(session, '/admin/coordinator', 'view');

    if (!canManage && !canViewCoord) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ensureAuthAndPermissionsSchema();

    const coordinatorId = request.nextUrl.searchParams.get('coordinatorId');

    let playerAssignments: any[];
    let gameAssignments: any[];

    if (!canManage && session.adminUserId) {
      playerAssignments = (await sql`
        SELECT cpa.*, r.registration_number, r.name AS player_name, r.team_name, r.roll_number, r.gender, r.status AS reg_status,
               au.username AS coordinator_username, au.display_name AS coordinator_display_name
        FROM coordinator_player_assignments cpa
        JOIN registrations r ON r.id = cpa.registration_id
        JOIN admin_users au ON au.id = cpa.coordinator_user_id
        WHERE cpa.coordinator_user_id = ${session.adminUserId}
        ORDER BY cpa.created_at DESC
      `) as any[];

      gameAssignments = (await sql`
        SELECT cga.*, au.username AS coordinator_username
        FROM coordinator_game_assignments cga
        JOIN admin_users au ON au.id = cga.user_id
        WHERE cga.user_id = ${session.adminUserId}
        ORDER BY cga.game_name ASC
      `) as any[];
    } else if (coordinatorId) {
      playerAssignments = (await sql`
        SELECT cpa.*, r.registration_number, r.name AS player_name, r.team_name, r.roll_number, r.gender, r.status AS reg_status,
               au.username AS coordinator_username, au.display_name AS coordinator_display_name
        FROM coordinator_player_assignments cpa
        JOIN registrations r ON r.id = cpa.registration_id
        JOIN admin_users au ON au.id = cpa.coordinator_user_id
        WHERE cpa.coordinator_user_id = ${coordinatorId}
        ORDER BY cpa.created_at DESC
      `) as any[];

      gameAssignments = (await sql`
        SELECT cga.*, au.username AS coordinator_username
        FROM coordinator_game_assignments cga
        JOIN admin_users au ON au.id = cga.user_id
        WHERE cga.user_id = ${coordinatorId}
        ORDER BY cga.game_name ASC
      `) as any[];
    } else {
      playerAssignments = (await sql`
        SELECT cpa.*, r.registration_number, r.name AS player_name, r.team_name, r.roll_number, r.gender, r.status AS reg_status,
               au.username AS coordinator_username, au.display_name AS coordinator_display_name
        FROM coordinator_player_assignments cpa
        JOIN registrations r ON r.id = cpa.registration_id
        JOIN admin_users au ON au.id = cpa.coordinator_user_id
        ORDER BY cpa.created_at DESC
      `) as any[];

      gameAssignments = (await sql`
        SELECT cga.*, au.username AS coordinator_username
        FROM coordinator_game_assignments cga
        JOIN admin_users au ON au.id = cga.user_id
        ORDER BY au.username ASC, cga.game_name ASC
      `) as any[];
    }

    return NextResponse.json({
      success: true,
      playerAssignments,
      gameAssignments,
    });
  } catch (error: any) {
    console.error('Fetch assignments error:', error);
    return NextResponse.json({ error: 'Failed to load coordinator assignments', details: error.message }, { status: 500 });
  }
}

// POST - Assign one or many players (registrations) to a coordinator
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/hoc', 'edit');
    if (auth.error) return auth.error;
    const { session } = auth;

    await ensureAuthAndPermissionsSchema();

    const body = await request.json();
    const coordinatorUserId = String(body?.coordinatorUserId || '').trim();
    const registrationIds: string[] = Array.isArray(body?.registrationIds)
      ? body.registrationIds.map((id: any) => String(id).trim()).filter(Boolean)
      : body?.registrationId
        ? [String(body.registrationId).trim()]
        : [];
    const gameName = body?.gameName ? String(body.gameName).trim() : '';
    const notes = body?.notes ? String(body.notes).trim() : null;

    if (!coordinatorUserId || registrationIds.length === 0) {
      return NextResponse.json(
        { error: 'coordinatorUserId and at least one registrationId are required' },
        { status: 400 }
      );
    }

    const coordRows = (await sql`
      SELECT id, username, is_active FROM admin_users WHERE id = ${coordinatorUserId} LIMIT 1
    `) as any[];
    if (coordRows.length === 0 || coordRows[0].is_active === false) {
      return NextResponse.json({ error: 'Active coordinator account not found' }, { status: 404 });
    }

    const gameId = gameName ? toGameSlug(gameName) : null;
    let assignedCount = 0;

    for (const regId of registrationIds) {
      const regRows = (await sql`
        SELECT id, status FROM registrations WHERE id = ${regId} LIMIT 1
      `) as any[];
      if (regRows.length === 0 || regRows[0].status === 'rejected') continue;

      await sql`
        INSERT INTO coordinator_player_assignments (
          id, coordinator_user_id, registration_id, game_id, game_name, assigned_by, notes, created_at
        ) VALUES (
          ${uuidv4()}, ${coordinatorUserId}, ${regId}, ${gameId}, ${gameName || null}, ${session.username}, ${notes}, NOW()
        )
        ON CONFLICT (coordinator_user_id, registration_id, game_name) DO UPDATE SET
          assigned_by = EXCLUDED.assigned_by,
          notes = COALESCE(EXCLUDED.notes, coordinator_player_assignments.notes)
      `;
      assignedCount++;
    }

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'coordinator.assign_players',
      targetType: 'coordinator_player_assignments',
      targetId: coordinatorUserId,
      after: {
        coordinatorUsername: coordRows[0].username,
        registrationIds,
        gameName: gameName || null,
        assignedCount,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, assignedCount });
  } catch (error: any) {
    console.error('Assign players error:', error);
    return NextResponse.json({ error: 'Failed to assign players', details: error.message }, { status: 500 });
  }
}

// DELETE - Remove a player or game assignment
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/hoc', 'edit');
    if (auth.error) return auth.error;
    const { session } = auth;

    const id = request.nextUrl.searchParams.get('id');
    const type = request.nextUrl.searchParams.get('type') || 'player';
    if (!id) {
      return NextResponse.json({ error: 'Assignment id is required' }, { status: 400 });
    }

    if (type === 'game') {
      await sql`DELETE FROM coordinator_game_assignments WHERE id = ${id}`;
    } else {
      await sql`DELETE FROM coordinator_player_assignments WHERE id = ${id}`;
    }

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: `coordinator.unassign_${type}`,
      targetType: type === 'game' ? 'coordinator_game_assignments' : 'coordinator_player_assignments',
      targetId: id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete assignment error:', error);
    return NextResponse.json({ error: 'Failed to remove assignment', details: error.message }, { status: 500 });
  }
}
