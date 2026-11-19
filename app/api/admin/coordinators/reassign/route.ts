import { NextRequest, NextResponse } from 'next/server';
import { sql, runTransaction } from '@/lib/db';
import { ensureAuthAndPermissionsSchema, requireAdminPermission } from '@/lib/auth';
import { logAudit, getClientIp } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// POST - Reassign scheduled matches & player assignments from one coordinator to another
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/hoc', 'edit');
    if (auth.error) return auth.error;
    const { session } = auth;

    await ensureAuthAndPermissionsSchema();

    const body = await request.json();
    const fromCoordinatorId = String(body?.fromCoordinatorId || '').trim();
    const toCoordinatorId = String(body?.toCoordinatorId || '').trim();
    const gameName = body?.gameName ? String(body.gameName).trim() : null;

    if (!fromCoordinatorId || !toCoordinatorId) {
      return NextResponse.json(
        { error: 'fromCoordinatorId and toCoordinatorId are required' },
        { status: 400 }
      );
    }
    if (fromCoordinatorId === toCoordinatorId) {
      return NextResponse.json({ error: 'Source and target coordinator must differ' }, { status: 400 });
    }

    const toRows = (await sql`
      SELECT id, username, is_active FROM admin_users WHERE id = ${toCoordinatorId} LIMIT 1
    `) as any[];
    if (toRows.length === 0 || toRows[0].is_active === false) {
      return NextResponse.json({ error: 'Target active coordinator not found' }, { status: 404 });
    }
    const targetUsername = toRows[0].username;

    const results = await runTransaction((txn) =>
      gameName
        ? [
            txn`
              UPDATE coordinator_matches
              SET coordinator_id = ${toCoordinatorId},
                  coordinator_username = ${targetUsername},
                  updated_at = NOW()
              WHERE coordinator_id = ${fromCoordinatorId}
                AND LOWER(game_name) = LOWER(${gameName})
                AND status IN ('scheduled', 'in_progress')
              RETURNING id
            `,
            txn`
              UPDATE coordinator_player_assignments
              SET coordinator_user_id = ${toCoordinatorId},
                  assigned_by = ${session.username}
              WHERE coordinator_user_id = ${fromCoordinatorId}
                AND LOWER(COALESCE(game_name, '')) = LOWER(${gameName})
              RETURNING id
            `,
          ]
        : [
            txn`
              UPDATE coordinator_matches
              SET coordinator_id = ${toCoordinatorId},
                  coordinator_username = ${targetUsername},
                  updated_at = NOW()
              WHERE coordinator_id = ${fromCoordinatorId}
                AND status IN ('scheduled', 'in_progress')
              RETURNING id
            `,
            txn`
              UPDATE coordinator_player_assignments
              SET coordinator_user_id = ${toCoordinatorId},
                  assigned_by = ${session.username}
              WHERE coordinator_user_id = ${fromCoordinatorId}
              RETURNING id
            `,
          ]
    );
    const movedMatches = (results[0] as any[])?.length || 0;
    const movedPlayers = (results[1] as any[])?.length || 0;

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'coordinator.reassign',
      targetType: 'coordinator_matches',
      targetId: toCoordinatorId,
      before: { fromCoordinatorId, gameName },
      after: { toCoordinatorId, targetUsername, movedMatches, movedPlayers },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      movedMatches,
      movedPlayers,
      targetUsername,
    });
  } catch (error: any) {
    console.error('Reassign coordinator error:', error);
    return NextResponse.json({ error: 'Failed to reassign coordinator duties', details: error.message }, { status: 500 });
  }
}
