import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureAuthAndPermissionsSchema, requireAdminPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Paginated audit logs (super_admin or permissions:view)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/permissions', 'view');
    if (auth.error) return auth.error;

    await ensureAuthAndPermissionsSchema();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 50));
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0);
    const actionFilter = searchParams.get('action')?.trim() || '';
    const actorFilter = searchParams.get('actor')?.trim() || '';
    const targetTypeFilter = searchParams.get('targetType')?.trim() || '';

    const conditions: string[] = [];
    const params: any[] = [];

    if (actionFilter) {
      params.push(`%${actionFilter}%`);
      conditions.push(`action ILIKE $${params.length}`);
    }
    if (actorFilter) {
      params.push(`%${actorFilter}%`);
      conditions.push(`actor_username ILIKE $${params.length}`);
    }
    if (targetTypeFilter) {
      params.push(targetTypeFilter);
      conditions.push(`target_type = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRows = (await sql(`SELECT COUNT(*)::int AS total FROM audit_logs ${whereClause}`, params)) as any[];
    const total = Number(countRows[0]?.total) || 0;

    const queryParams = [...params, limit, offset];
    const rows = (await sql(
      `SELECT id, actor_user_id, actor_username, action, target_type, target_id,
              before_json, after_json, ip_address, created_at
       FROM audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      queryParams
    )) as any[];

    return NextResponse.json({
      success: true,
      data: rows,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Fetch audit logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs', details: error.message }, { status: 500 });
  }
}
