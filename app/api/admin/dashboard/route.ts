import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hasPagePermission, requireAdminPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Aggregate KPIs, match status overview & system health for /admin/dashboard
 * without exposing row-level PII or finance ledgers unless the user holds those permissions.
 */
export async function GET() {
  try {
    const auth = await requireAdminPermission('/admin/dashboard', 'view');
    if (auth.error) return auth.error;
    const { session } = auth;

    const regRows = (await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'paid')::int AS paid,
        COUNT(*) FILTER (WHERE status = 'pending_online')::int AS pending_online,
        COUNT(*) FILTER (WHERE status = 'pending_cash')::int AS pending_cash,
        COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(gender, '')) = 'boys')::int AS boys,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(gender, '')) = 'girls')::int AS girls
      FROM registrations
    `) as any[];

    const reg = regRows[0] || {};
    const registrations = {
      total: Number(reg.total) || 0,
      paid: Number(reg.paid) || 0,
      pendingOnline: Number(reg.pending_online) || 0,
      pendingCash: Number(reg.pending_cash) || 0,
      rejected: Number(reg.rejected) || 0,
      boys: Number(reg.boys) || 0,
      girls: Number(reg.girls) || 0,
    };

    // Compute Top Registered Games
    let topGames: Array<{ name: string; count: number }> = [];
    try {
      const gameRows = (await sql`
        SELECT selected_games
        FROM registrations
        WHERE status != 'rejected' AND selected_games IS NOT NULL
      `) as any[];
      const counts = new Map<string, number>();
      for (const r of gameRows) {
        let games: string[] = [];
        try {
          games = Array.isArray(r.selected_games)
            ? r.selected_games
            : JSON.parse(String(r.selected_games || '[]'));
        } catch {
          games = [];
        }
        for (const g of games) {
          const name = String(g || '').trim();
          if (!name) continue;
          counts.set(name, (counts.get(name) || 0) + 1);
        }
      }
      topGames = Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    } catch {
      topGames = [];
    }

    let finance: { income: number; expense: number; balance: number } | null = null;
    if (hasPagePermission(session, '/admin/finance', 'view')) {
      const finRows = (await sql`
        SELECT record_type, COALESCE(SUM(amount), 0)::float AS total
        FROM finance_records
        GROUP BY record_type
      `) as any[];
      let income = 0;
      let expense = 0;
      for (const r of finRows) {
        if (r.record_type === 'income') income = Number(r.total) || 0;
        if (r.record_type === 'expense') expense = Number(r.total) || 0;
      }
      finance = { income, expense, balance: income - expense };
    }

    let inventory: { totalItems: number; totalStock: number; lowStock: number } | null = null;
    if (hasPagePermission(session, '/admin/inventory', 'view')) {
      try {
        const [invRow] = (await sql`
          SELECT
            COUNT(*)::int AS total_items,
            COALESCE(SUM(quantity), 0)::int AS total_stock,
            COUNT(*) FILTER (WHERE quantity <= COALESCE(min_quantity, 0))::int AS low_stock
          FROM inventory_items
          WHERE COALESCE(is_active, true) = true
        `) as any[];
        inventory = {
          totalItems: Number(invRow?.total_items) || 0,
          totalStock: Number(invRow?.total_stock) || 0,
          lowStock: Number(invRow?.low_stock) || 0,
        };
      } catch {
        inventory = { totalItems: 0, totalStock: 0, lowStock: 0 };
      }
    }

    // Match overview for Super Admin or users with Coordinator/HOC view access
    let matches: { total: number; scheduled: number; inProgress: number; completed: number } | null = null;
    let recentMatches: any[] = [];
    const canSeeMatches =
      session.role === 'super_admin' ||
      hasPagePermission(session, '/admin/coordinator', 'view') ||
      hasPagePermission(session, '/admin/hoc', 'view');

    if (canSeeMatches) {
      try {
        const [mRow] = (await sql`
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled,
            COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
            COUNT(*) FILTER (WHERE status IN ('completed', 'walkover'))::int AS completed
          FROM coordinator_matches
        `) as any[];
        matches = {
          total: Number(mRow?.total) || 0,
          scheduled: Number(mRow?.scheduled) || 0,
          inProgress: Number(mRow?.in_progress) || 0,
          completed: Number(mRow?.completed) || 0,
        };

        recentMatches = (await sql`
          SELECT
            id, game_name, gender, round_name, match_number,
            player1_name, player2_name, scheduled_date, scheduled_time,
            venue, status, winner_name, score_summary, coordinator_username
          FROM coordinator_matches
          ORDER BY
            CASE status
              WHEN 'in_progress' THEN 1
              WHEN 'scheduled' THEN 2
              WHEN 'completed' THEN 3
              ELSE 4
            END,
            updated_at DESC
          LIMIT 8
        `) as any[];
      } catch {
        matches = { total: 0, scheduled: 0, inProgress: 0, completed: 0 };
        recentMatches = [];
      }
    }

    let systemHealth: {
      status: string;
      activeUsers: number;
      activeSessions: number;
      totalMatches: number;
      unsyncedPaidRegistrations: number;
    } | null = null;

    if (session.role === 'super_admin') {
      const [sess] = (await sql`
        SELECT COUNT(*) FILTER (WHERE expires_at > NOW())::int AS active_sessions
        FROM admin_sessions
      `) as any[];
      const [usersRow] = (await sql`
        SELECT COUNT(*)::int AS active_users
        FROM admin_users
        WHERE is_active = true
      `) as any[];
      const [unsynced] = (await sql`
        SELECT COUNT(*)::int AS cnt
        FROM registrations r
        LEFT JOIN finance_records f ON f.reference_id = r.id AND f.reference_type = 'registration'
        WHERE r.status = 'paid' AND f.id IS NULL
      `) as any[];

      systemHealth = {
        status: 'OPERATIONAL',
        activeUsers: Number(usersRow?.active_users) || 0,
        activeSessions: Number(sess?.active_sessions) || 0,
        totalMatches: matches?.total || 0,
        unsyncedPaidRegistrations: Number(unsynced?.cnt) || 0,
      };
    }

    return NextResponse.json({
      success: true,
      registrations,
      finance,
      inventory,
      topGames,
      matches,
      recentMatches,
      systemHealth,
    });
  } catch (error: any) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
