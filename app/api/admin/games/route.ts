import { NextRequest, NextResponse } from 'next/server';
import { sql, runTransaction } from '@/lib/db';
import { requireAdminPermission } from '@/lib/auth';
import { ensureGamesSchema, toGameSlug } from '@/lib/games-sync';
import { gamesPricing } from '@/lib/games-pricing';
import { logAudit, getClientIp } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET - Fetch all games pricing (requires /admin/settings view)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/settings', 'view');
    if (auth.error) return auth.error;

    await ensureGamesSchema();

    const includeInactive = request.nextUrl.searchParams.get('includeInactive') !== 'false';

    const games = await sql`
      SELECT gp.id, gp.game_id, gp.game_name, gp.gender, gp.price, gp.players, gp.category,
             COALESCE(gp.is_active, true) AS is_active,
             COALESCE(gp.coupon_eligible, g.coupon_eligible, true) AS coupon_eligible,
             COALESCE(gp.currency, 'PKR') AS currency,
             gp.created_at, gp.updated_at
      FROM games_pricing gp
      LEFT JOIN games g ON g.id = gp.game_id OR LOWER(g.name) = LOWER(gp.game_name)
      WHERE ${includeInactive} = true OR (COALESCE(gp.is_active, true) = true AND COALESCE(g.is_active, true) = true)
      ORDER BY gp.game_name ASC, gp.gender ASC
    `;

    return NextResponse.json({ success: true, data: games });
  } catch (error: any) {
    console.error('Fetch games error:', error);
    return NextResponse.json({ error: 'Failed to fetch games', details: error.message }, { status: 500 });
  }
}

async function renameGameEverywhere(oldName: string, newName: string, newSlug: string) {
  await runTransaction((txn) => [
    txn`UPDATE games SET name = ${newName}, slug = ${newSlug}, updated_at = NOW() WHERE name = ${oldName}`,
    txn`UPDATE games_pricing SET game_name = ${newName}, updated_at = NOW() WHERE game_name = ${oldName}`,
    txn`UPDATE sport_groups SET game_name = ${newName} WHERE game_name = ${oldName}`,
    txn`UPDATE coordinator_matches SET game_name = ${newName}, game_id = COALESCE(game_id, ${newSlug}) WHERE game_name = ${oldName}`,
    txn`UPDATE match_schedules SET game_name = ${newName} WHERE game_name = ${oldName}`,
    txn`UPDATE coordinator_game_assignments SET game_name = ${newName} WHERE game_name = ${oldName}`,
    txn`UPDATE registration_items SET game_name = ${newName} WHERE game_name = ${oldName}`,
  ]);

  // Also update coordinator_player_assignments, admin_users.assigned_games, and registrations JSON
  try {
    await sql`UPDATE coordinator_player_assignments SET game_name = ${newName} WHERE game_name = ${oldName}`;
  } catch {}

  try {
    const affectedUsers = (await sql`
      SELECT id, assigned_games FROM admin_users
      WHERE assigned_games IS NOT NULL AND assigned_games ILIKE ${'%' + oldName + '%'}
    `) as any[];
    for (const u of affectedUsers) {
      let arr: string[] = [];
      try {
        const parsed = JSON.parse(String(u.assigned_games));
        arr = Array.isArray(parsed) ? parsed.map(String) : String(u.assigned_games).split(',').map((s) => s.trim());
      } catch {
        arr = String(u.assigned_games).split(',').map((s) => s.trim());
      }
      const updated = arr.map((g) => (g.toLowerCase() === oldName.toLowerCase() ? newName : g));
      await sql`UPDATE admin_users SET assigned_games = ${JSON.stringify(updated)} WHERE id = ${u.id}`;
    }
  } catch {}

  try {
    const affectedRegs = (await sql`
      SELECT id, selected_games, team_members FROM registrations
      WHERE selected_games::text ILIKE ${'%"' + oldName + '"%'}
    `) as any[];
    for (const r of affectedRegs) {
      let gamesArr: string[] = [];
      try {
        gamesArr = Array.isArray(r.selected_games) ? r.selected_games : JSON.parse(String(r.selected_games || '[]'));
      } catch {
        gamesArr = [];
      }
      const nextGames = gamesArr.map((g) => (String(g).toLowerCase() === oldName.toLowerCase() ? newName : g));

      let teamMembers = r.team_members;
      if (teamMembers) {
        try {
          const obj = typeof teamMembers === 'string' ? JSON.parse(teamMembers) : { ...teamMembers };
          if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
            for (const key of Object.keys(obj)) {
              if (key.toLowerCase() === oldName.toLowerCase() && key !== newName) {
                obj[newName] = obj[key];
                delete obj[key];
              }
            }
            teamMembers = JSON.stringify(obj);
          }
        } catch {}
      }

      await sql`
        UPDATE registrations
        SET selected_games = ${JSON.stringify(nextGames)},
            team_members = ${teamMembers ? (typeof teamMembers === 'string' ? teamMembers : JSON.stringify(teamMembers)) : null}
        WHERE id = ${r.id}
      `;
    }
  } catch {}
}

async function isGameReferenced(gameName: string, gameId: string | null): Promise<boolean> {
  const regItemRows = (await sql`
    SELECT 1 FROM registration_items WHERE LOWER(game_name) = LOWER(${gameName}) LIMIT 1
  `) as any[];
  if (regItemRows.length > 0) return true;

  const regRows = (await sql`
    SELECT 1 FROM registrations WHERE selected_games::text ILIKE ${'%' + gameName + '%'} LIMIT 1
  `) as any[];
  if (regRows.length > 0) return true;

  const matchRows = (await sql`
    SELECT 1 FROM coordinator_matches
    WHERE LOWER(game_name) = LOWER(${gameName}) OR (${gameId}::text IS NOT NULL AND game_id = ${gameId})
    LIMIT 1
  `) as any[];
  if (matchRows.length > 0) return true;

  const groupRows = (await sql`
    SELECT 1 FROM sport_groups WHERE LOWER(game_name) = LOWER(${gameName}) LIMIT 1
  `) as any[];
  return groupRows.length > 0;
}

// POST - Add, update, toggle_active, rename, or sync official PDF games pricing
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/settings', 'edit');
    if (auth.error) return auth.error;
    const { session } = auth;

    await ensureGamesSchema();

    const body = await request.json();

    // Sync official PDF games & prices
    if (body?.action === 'sync_pdf_defaults') {
      const replaceAll = Boolean(body?.replaceAll);
      if (replaceAll) {
        const officialNames = gamesPricing.map((g) => g.name);
        const existing = (await sql`SELECT DISTINCT game_name, game_id FROM games_pricing`) as any[];
        for (const row of existing) {
          if (!officialNames.includes(row.game_name)) {
            const referenced = await isGameReferenced(row.game_name, row.game_id || null);
            if (referenced) {
              await sql`UPDATE games_pricing SET is_active = false, updated_at = NOW() WHERE game_name = ${row.game_name}`;
              await sql`UPDATE games SET is_active = false, updated_at = NOW() WHERE name = ${row.game_name}`;
            } else {
              await sql`DELETE FROM games_pricing WHERE game_name = ${row.game_name}`;
              await sql`DELETE FROM games WHERE name = ${row.game_name}`;
            }
          }
        }
      }

      for (const item of gamesPricing) {
        const slug = toGameSlug(item.name);
        const couponEligible = item.name.toLowerCase() !== 'swimming sprint';
        await sql`
          INSERT INTO games (id, slug, name, category, is_active, coupon_eligible, created_at, updated_at)
          VALUES (${slug}, ${slug}, ${item.name}, ${item.category ?? null}, true, ${couponEligible}, NOW(), NOW())
          ON CONFLICT (name) DO UPDATE SET
            slug = COALESCE(games.slug, EXCLUDED.slug),
            category = COALESCE(EXCLUDED.category, games.category),
            is_active = true,
            updated_at = NOW()
        `;
        if (item.boys !== null) {
          await sql`
            INSERT INTO games_pricing (game_id, game_name, gender, price, players, category, is_active, coupon_eligible, currency, created_at, updated_at)
            VALUES (${slug}, ${item.name}, 'boys', ${item.boys}, ${item.boysPlayers ?? 1}, ${item.category ?? null}, true, ${couponEligible}, 'PKR', NOW(), NOW())
            ON CONFLICT (game_name, gender) DO UPDATE SET
              game_id = COALESCE(games_pricing.game_id, EXCLUDED.game_id),
              price = EXCLUDED.price,
              players = EXCLUDED.players,
              is_active = true,
              coupon_eligible = EXCLUDED.coupon_eligible,
              category = COALESCE(EXCLUDED.category, games_pricing.category),
              updated_at = NOW()
          `;
        }
        if (item.girls !== null) {
          await sql`
            INSERT INTO games_pricing (game_id, game_name, gender, price, players, category, is_active, coupon_eligible, currency, created_at, updated_at)
            VALUES (${slug}, ${item.name}, 'girls', ${item.girls}, ${item.girlsPlayers ?? 1}, ${item.category ?? null}, true, ${couponEligible}, 'PKR', NOW(), NOW())
            ON CONFLICT (game_name, gender) DO UPDATE SET
              game_id = COALESCE(games_pricing.game_id, EXCLUDED.game_id),
              price = EXCLUDED.price,
              players = EXCLUDED.players,
              is_active = true,
              coupon_eligible = EXCLUDED.coupon_eligible,
              category = COALESCE(EXCLUDED.category, games_pricing.category),
              updated_at = NOW()
          `;
        }
      }

      await logAudit({
        actorUserId: session.adminUserId,
        actorUsername: session.username,
        action: 'games.sync_defaults',
        targetType: 'games_pricing',
        after: { replaceAll, syncedCount: gamesPricing.length },
        ip: getClientIp(request),
      });

      return NextResponse.json({ success: true, syncedCount: gamesPricing.length });
    }

    // Activate/deactivate game or single gender variant without breaking history
    if (body?.action === 'toggle_active') {
      const nextActive = Boolean(body?.is_active);
      const id = body?.id ? Number(body.id) : null;
      const gName = typeof body?.game_name === 'string' ? body.game_name.trim() : '';

      if (id) {
        await sql`UPDATE games_pricing SET is_active = ${nextActive}, updated_at = NOW() WHERE id = ${id}`;
      } else if (gName) {
        await sql`UPDATE games SET is_active = ${nextActive}, updated_at = NOW() WHERE name = ${gName}`;
        await sql`UPDATE games_pricing SET is_active = ${nextActive}, updated_at = NOW() WHERE game_name = ${gName}`;
      } else {
        return NextResponse.json({ error: 'id or game_name is required' }, { status: 400 });
      }

      await logAudit({
        actorUserId: session.adminUserId,
        actorUsername: session.username,
        action: 'games.toggle_active',
        targetType: 'game',
        targetId: String(id || gName),
        after: { is_active: nextActive },
        ip: getClientIp(request),
      });

      return NextResponse.json({ success: true });
    }

    const { game_name, original_game_name, gender, price, players, category, coupon_eligible, is_active } = body;
    const trimmedName = typeof game_name === 'string' ? game_name.trim() : '';
    const trimmedOriginal = typeof original_game_name === 'string' ? original_game_name.trim() : '';

    if (trimmedOriginal && trimmedName && trimmedOriginal !== trimmedName) {
      await renameGameEverywhere(trimmedOriginal, trimmedName, toGameSlug(trimmedName));
    }

    const parsedPrice = Number(price);
    if (!trimmedName || !['boys', 'girls'].includes(gender) || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: 'Valid game_name, gender (boys|girls), and non-negative numeric price are required' },
        { status: 400 }
      );
    }

    const parsedPlayers = players !== undefined && players !== null && players !== '' ? Number(players) : null;
    if (parsedPlayers !== null && (!Number.isInteger(parsedPlayers) || parsedPlayers <= 0)) {
      return NextResponse.json({ error: 'players must be a positive integer' }, { status: 400 });
    }

    const slug = toGameSlug(trimmedName);
    const couponEligible =
      typeof coupon_eligible === 'boolean'
        ? coupon_eligible
        : trimmedName.toLowerCase() !== 'swimming sprint';
    const nextActive = typeof is_active === 'boolean' ? is_active : true;

    await runTransaction((txn) => [
      txn`
        INSERT INTO games (id, slug, name, category, is_active, coupon_eligible, created_at, updated_at)
        VALUES (${slug}, ${slug}, ${trimmedName}, ${category || null}, ${nextActive}, ${couponEligible}, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET
          slug = COALESCE(games.slug, EXCLUDED.slug),
          category = COALESCE(${category || null}, games.category),
          is_active = COALESCE(${typeof is_active === 'boolean' ? is_active : null}, games.is_active),
          coupon_eligible = ${couponEligible},
          updated_at = NOW()
      `,
      txn`
        INSERT INTO games_pricing (game_id, game_name, gender, price, players, category, is_active, coupon_eligible, currency, created_at, updated_at)
        VALUES (${slug}, ${trimmedName}, ${gender}, ${parsedPrice}, ${parsedPlayers}, ${category || null}, ${nextActive}, ${couponEligible}, 'PKR', NOW(), NOW())
        ON CONFLICT (game_name, gender) DO UPDATE SET
          game_id = COALESCE(games_pricing.game_id, ${slug}),
          price = ${parsedPrice},
          players = ${parsedPlayers},
          is_active = ${nextActive},
          coupon_eligible = ${couponEligible},
          category = COALESCE(${category || null}, games_pricing.category),
          updated_at = NOW()
      `,
    ]);

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'games.upsert',
      targetType: 'game',
      targetId: `${trimmedName}:${gender}`,
      after: {
        original_game_name: trimmedOriginal || null,
        game_name: trimmedName,
        gender,
        price: parsedPrice,
        players: parsedPlayers,
        category,
        coupon_eligible: couponEligible,
        is_active: nextActive,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Add/update game error:', error);
    return NextResponse.json({ error: 'Failed to save game', details: error.message }, { status: 500 });
  }
}

// PUT - Unified transactional save for a game (rename + boys + girls in one request)
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/settings', 'edit');
    if (auth.error) return auth.error;
    const { session } = auth;

    await ensureGamesSchema();

    const body = await request.json();
    const gameName = String(body?.game_name || '').trim();
    const originalName = String(body?.original_game_name || gameName).trim();
    const category = body?.category ? String(body.category).trim() : null;
    const isActive = typeof body?.is_active === 'boolean' ? body.is_active : true;
    const couponEligible =
      typeof body?.coupon_eligible === 'boolean'
        ? body.coupon_eligible
        : gameName.toLowerCase() !== 'swimming sprint';

    if (!gameName) {
      return NextResponse.json({ error: 'game_name is required' }, { status: 400 });
    }

    const slug = toGameSlug(gameName);
    if (originalName && originalName !== gameName) {
      await renameGameEverywhere(originalName, gameName, slug);
    }

    const boys = body?.boys as { enabled?: boolean; price?: number | string; players?: number | string } | undefined;
    const girls = body?.girls as { enabled?: boolean; price?: number | string; players?: number | string } | undefined;

    const genderOps: Array<{ genderKey: 'boys' | 'girls'; enabled: boolean; p?: number; pl?: number }> = [];
    for (const [genderKey, cfg] of [
      ['boys', boys],
      ['girls', girls],
    ] as const) {
      if (!cfg) continue;
      if (cfg.enabled) {
        const p = Number(cfg.price);
        if (Number.isNaN(p) || p < 0) {
          return NextResponse.json({ error: `Invalid ${genderKey} price` }, { status: 400 });
        }
        const pl = cfg.players !== undefined && cfg.players !== '' ? Number(cfg.players) : 1;
        genderOps.push({ genderKey, enabled: true, p, pl });
      } else {
        genderOps.push({ genderKey, enabled: false });
      }
    }

    await runTransaction((txn) => [
      txn`
        INSERT INTO games (id, slug, name, category, is_active, coupon_eligible, created_at, updated_at)
        VALUES (${slug}, ${slug}, ${gameName}, ${category}, ${isActive}, ${couponEligible}, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET
          slug = COALESCE(games.slug, EXCLUDED.slug),
          category = COALESCE(${category}, games.category),
          is_active = ${isActive},
          coupon_eligible = ${couponEligible},
          updated_at = NOW()
      `,
      ...genderOps.map((op) =>
        op.enabled
          ? txn`
              INSERT INTO games_pricing (game_id, game_name, gender, price, players, category, is_active, coupon_eligible, currency, created_at, updated_at)
              VALUES (${slug}, ${gameName}, ${op.genderKey}, ${op.p}, ${op.pl}, ${category}, ${isActive}, ${couponEligible}, 'PKR', NOW(), NOW())
              ON CONFLICT (game_name, gender) DO UPDATE SET
                game_id = COALESCE(games_pricing.game_id, ${slug}),
                price = ${op.p},
                players = ${op.pl},
                category = COALESCE(${category}, games_pricing.category),
                is_active = ${isActive},
                coupon_eligible = ${couponEligible},
                updated_at = NOW()
            `
          : txn`
              UPDATE games_pricing SET is_active = false, updated_at = NOW()
              WHERE game_name = ${gameName} AND gender = ${op.genderKey}
            `
      ),
    ]);

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'games.save_unified',
      targetType: 'game',
      targetId: gameName,
      after: { originalName, gameName, category, isActive, couponEligible, boys, girls },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unified game update error:', error);
    return NextResponse.json({ error: 'Failed to update game', details: error.message }, { status: 500 });
  }
}

// DELETE - Remove game pricing (blocks with 409 if referenced in registrations/matches/groups)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/settings', 'edit');
    if (auth.error) return auth.error;
    const { session } = auth;

    await ensureGamesSchema();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const game_name = searchParams.get('game_name');
    const gender = searchParams.get('gender');

    let targetName = game_name || '';
    let targetGameId: string | null = null;

    if (id) {
      const existing = (await sql`SELECT id, game_id, game_name, gender FROM games_pricing WHERE id = ${parseInt(id, 10)} LIMIT 1`) as any[];
      if (existing.length === 0) {
        return NextResponse.json({ error: 'Game pricing entry not found' }, { status: 404 });
      }
      targetName = existing[0].game_name;
      targetGameId = existing[0].game_id || null;
    } else if (game_name && gender) {
      const existing = (await sql`SELECT id, game_id FROM games_pricing WHERE game_name = ${game_name} AND gender = ${gender} LIMIT 1`) as any[];
      targetGameId = existing[0]?.game_id || null;
    } else {
      return NextResponse.json({ error: 'id or (game_name + gender) required' }, { status: 400 });
    }

    const referenced = await isGameReferenced(targetName, targetGameId);
    if (referenced) {
      return NextResponse.json(
        {
          error:
            'This game has existing registrations, matches, or groups. Deactivate it instead of deleting so historical records stay intact.',
        },
        { status: 409 }
      );
    }

    if (id) {
      await sql`DELETE FROM games_pricing WHERE id = ${parseInt(id, 10)}`;
    } else if (game_name && gender) {
      await sql`DELETE FROM games_pricing WHERE game_name = ${game_name} AND gender = ${gender}`;
    }

    // Clean up parent games row if no variants remain
    if (targetName) {
      const remaining = (await sql`SELECT 1 FROM games_pricing WHERE game_name = ${targetName} LIMIT 1`) as any[];
      if (remaining.length === 0) {
        await sql`DELETE FROM games WHERE name = ${targetName}`;
      }
    }

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'games.delete',
      targetType: 'game',
      targetId: String(id || `${game_name}:${gender}`),
      before: { game_name: targetName, gender },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete game error:', error);
    return NextResponse.json({ error: 'Failed to delete game', details: error.message }, { status: 500 });
  }
}
