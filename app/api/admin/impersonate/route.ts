import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { ensureAuthAndPermissionsSchema, getAdminSession, normalizeRole, resolveUserPermissions } from '@/lib/auth';
import { logAudit, getClientIp } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// POST - Start or stop super_admin impersonation of a staff account
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);

    if (!session || !sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureAuthAndPermissionsSchema();

    const body = await request.json();
    const targetUserId = body?.targetUserId ? String(body.targetUserId).trim() : '';

    // Stop impersonation and return to original super_admin
    if (body?.stop === true) {
      if (!session.impersonatedBy) {
        return NextResponse.json({ error: 'Not currently impersonating' }, { status: 400 });
      }

      const origRows = (await sql`
        SELECT id, username, role FROM admin_users WHERE username = ${session.impersonatedBy} AND is_active = true LIMIT 1
      `) as any[];

      const origRole = origRows.length > 0 ? normalizeRole(origRows[0].role) : 'super_admin';
      const origUserId = origRows.length > 0 ? origRows[0].id : null;

      await sql`
        UPDATE admin_sessions
        SET admin_user_id = ${origUserId},
            role = ${origRole},
            impersonated_by = NULL
        WHERE session_token = ${sessionId}
      `;

      await logAudit({
        actorUserId: origUserId,
        actorUsername: session.impersonatedBy,
        action: 'impersonate.stop',
        targetType: 'admin_user',
        targetId: session.adminUserId,
        before: { impersonatedUsername: session.username },
        ip: getClientIp(request),
      });

      const resolvedOrig = await resolveUserPermissions(origUserId, origRole);
      return NextResponse.json({
        success: true,
        username: session.impersonatedBy,
        role: origRole,
        defaultPage: resolvedOrig.defaultPage,
      });
    }

    // Only non-impersonated super_admin may start impersonation
    if (session.role !== 'super_admin' || session.impersonatedBy) {
      return NextResponse.json(
        { error: 'Only an active Super Admin may impersonate another user' },
        { status: 403 }
      );
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    const targetRows = (await sql`
      SELECT id, username, role, is_active FROM admin_users WHERE id = ${targetUserId} LIMIT 1
    `) as any[];

    if (targetRows.length === 0) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const target = targetRows[0];
    if (target.is_active === false) {
      return NextResponse.json({ error: 'Cannot impersonate a disabled account' }, { status: 400 });
    }

    const targetRole = normalizeRole(target.role);
    if (targetRole === 'super_admin') {
      return NextResponse.json({ error: 'Cannot impersonate another Super Admin' }, { status: 403 });
    }

    await sql`
      UPDATE admin_sessions
      SET admin_user_id = ${target.id},
          role = ${targetRole},
          impersonated_by = ${session.username}
      WHERE session_token = ${sessionId}
    `;

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'impersonate.start',
      targetType: 'admin_user',
      targetId: target.id,
      after: { targetUsername: target.username, targetRole },
      ip: getClientIp(request),
    });

    const resolvedTarget = await resolveUserPermissions(String(target.id), targetRole);
    return NextResponse.json({
      success: true,
      username: target.username,
      role: targetRole,
      impersonatedBy: session.username,
      defaultPage: resolvedTarget.defaultPage,
    });
  } catch (error: any) {
    console.error('Impersonation error:', error);
    return NextResponse.json({ error: 'Impersonation failed', details: error.message }, { status: 500 });
  }
}
