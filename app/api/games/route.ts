import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureGamesSchema, toGameSlug } from '@/lib/games-sync';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch active games pricing from database (single source of truth; never auto-reseeds deleted games)
export async function GET(request: NextRequest) {
  try {
    await ensureGamesSchema();

    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';

    const games = (await sql`
      SELECT gp.id, gp.game_id, gp.game_name, gp.gender, gp.price, gp.players, gp.category,
             COALESCE(gp.is_active, true) AS row_active,
             COALESCE(gp.coupon_eligible, true) AS row_coupon_eligible,
             COALESCE(gp.currency, 'PKR') AS currency,
             COALESCE(g.is_active, true) AS game_active,
             COALESCE(g.coupon_eligible, gp.coupon_eligible, true) AS coupon_eligible
      FROM games_pricing gp
      LEFT JOIN games g ON g.id = gp.game_id OR LOWER(g.name) = LOWER(gp.game_name)
      ORDER BY gp.id ASC
    `) as any[];

    const gamesMap: Record<
      string,
      {
        id: string;
        name: string;
        boys: number | null;
        girls: number | null;
        boysPlayers?: number;
        girlsPlayers?: number;
        category?: string;
        isActive: boolean;
        couponEligible: boolean;
        currency: string;
      }
    > = {};

    for (const g of games) {
      const active = Boolean(g.row_active) && Boolean(g.game_active);
      if (!includeInactive && !active) continue;

      const name = String(g.game_name).trim();
      const mapKey = name.toLowerCase();
      if (!gamesMap[mapKey]) {
        gamesMap[mapKey] = {
          id: g.game_id || toGameSlug(name),
          name,
          boys: null,
          girls: null,
          category: g.category || undefined,
          isActive: active,
          couponEligible: Boolean(g.coupon_eligible),
          currency: g.currency || 'PKR',
        };
      }
      if (!gamesMap[mapKey].category && g.category) {
        gamesMap[mapKey].category = g.category;
      }
      if (g.gender === 'boys') {
        gamesMap[mapKey].boys = parseFloat(g.price);
        if (g.players) gamesMap[mapKey].boysPlayers = Number(g.players);
      } else if (g.gender === 'girls') {
        gamesMap[mapKey].girls = parseFloat(g.price);
        if (g.players) gamesMap[mapKey].girlsPlayers = Number(g.players);
      }
    }

    const formattedGames = Object.values(gamesMap);

    const response = NextResponse.json({ success: true, data: formattedGames });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error: any) {
    console.error('Fetch games error:', error);
    return NextResponse.json({ error: 'Failed to fetch games', details: error.message }, { status: 500 });
  }
}
