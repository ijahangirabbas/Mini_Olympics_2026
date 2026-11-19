import { NextRequest, NextResponse } from 'next/server';
import { sql, runTransaction } from '@/lib/db';
import { ensureAuthAndPermissionsSchema, requireAdminPermission } from '@/lib/auth';
import { generateDeterministicSchedule, BracketTeamInput } from '@/lib/matching';
import { toGameSlug } from '@/lib/games-sync';
import { logAudit, getClientIp } from '@/lib/audit';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// GET - Fetch match schedules and verified paid teams
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/hoc', 'view');
    if (auth.error) return auth.error;

    await ensureAuthAndPermissionsSchema();

    const { searchParams } = new URL(request.url);
    const game = searchParams.get('game');
    const gender = searchParams.get('gender');

    let teamsQuery = `
      SELECT id, registration_number, team_name, name, roll_number, contact_number, email, gender, selected_games
      FROM registrations
      WHERE status = 'paid'
    `;
    const teamsParams: any[] = [];

    if (gender && gender !== 'all') {
      teamsParams.push(gender);
      teamsQuery += ` AND gender = $${teamsParams.length}`;
    }

    teamsQuery += ' ORDER BY COALESCE(NULLIF(team_name, \'\'), name) ASC';
    const rawTeams = (await sql(teamsQuery, teamsParams)) as any[];

    const teams = game
      ? rawTeams.filter((t) => {
          try {
            const sg = typeof t.selected_games === 'string' ? JSON.parse(t.selected_games) : t.selected_games;
            return Array.isArray(sg) && sg.some((g: string) => g.toLowerCase() === game.toLowerCase());
          } catch {
            return false;
          }
        })
      : rawTeams;

    let schedules: any[] = [];
    try {
      let schedulesQuery = 'SELECT * FROM match_schedules';
      const schedulesParams: any[] = [];
      const schedulesConditions: string[] = [];

      if (game) {
        schedulesParams.push(game);
        schedulesConditions.push(`LOWER(game_name) = LOWER($${schedulesParams.length})`);
      }
      if (gender && gender !== 'all') {
        schedulesParams.push(gender);
        schedulesConditions.push(`gender = $${schedulesParams.length}`);
      }

      if (schedulesConditions.length > 0) {
        schedulesQuery += ' WHERE ' + schedulesConditions.join(' AND ');
      }
      schedulesQuery += ' ORDER BY created_at DESC';

      schedules = (await sql(schedulesQuery, schedulesParams)) as any[];
    } catch (schedErr: any) {
      if (schedErr?.code !== '42P01' && !schedErr?.message?.includes('match_schedules')) {
        throw schedErr;
      }
    }

    return NextResponse.json({
      success: true,
      teams,
      schedules,
    });
  } catch (error: any) {
    console.error('Fetch matches error:', error);
    return NextResponse.json({ error: 'Failed to fetch data', details: error.message }, { status: 500 });
  }
}

// POST - Deterministically generate tournament fixtures (replaces removed AI generation)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/hoc', 'edit');
    if (auth.error) return auth.error;
    const { session } = auth;

    await ensureAuthAndPermissionsSchema();

    const body = await request.json();
    const game = String(body?.game || '').trim();
    const gender = body?.gender === 'girls' ? 'girls' : 'boys';
    const format = (['knockout', 'round_robin', 'group_stage'].includes(body?.format)
      ? body.format
      : 'knockout') as 'knockout' | 'round_robin' | 'group_stage';
    const matchDate = body?.matchDate ? String(body.matchDate).trim() : null;
    const startTime = body?.startTime ? String(body.startTime).trim() : null;
    const venue = body?.venue ? String(body.venue).trim() : null;
    const breakMinutes = body?.breakMinutes !== undefined ? Number(body.breakMinutes) : 10;
    const matchDurationMinutes = body?.matchDurationMinutes !== undefined ? Number(body.matchDurationMinutes) : 30;
    const syncToMatches = body?.syncToMatches !== false;
    const seed = body?.seed ? String(body.seed).trim() : `${game}:${gender}:${format}:${new Date().toISOString().slice(0, 10)}`;

    if (!game) {
      return NextResponse.json({ error: 'Game is required' }, { status: 400 });
    }

    const paidRows = (await sql`
      SELECT id, registration_number, name, team_name, roll_number, contact_number, email, selected_games
      FROM registrations
      WHERE status = 'paid' AND gender = ${gender}
      ORDER BY registration_number ASC
    `) as any[];

    const dbTeamsByName = new Map<string, BracketTeamInput>();
    for (const r of paidRows) {
      let selected: string[] = [];
      try {
        selected = typeof r.selected_games === 'string' ? JSON.parse(r.selected_games) : r.selected_games || [];
      } catch {}
      if (!selected.some((g) => g.toLowerCase() === game.toLowerCase())) continue;
      const tName = String(r.team_name || r.name).trim();
      dbTeamsByName.set(tName.toLowerCase(), {
        id: r.id,
        teamName: tName,
        rollNumber: r.roll_number,
        contactNumber: r.contact_number,
        email: r.email,
      });
    }

    const requestedTeams: string[] = Array.isArray(body?.teams)
      ? body.teams.map((t: any) => String(t).trim()).filter(Boolean)
      : [];

    let verifiedTeams: BracketTeamInput[];
    if (requestedTeams.length > 0) {
      const seen = new Set<string>();
      verifiedTeams = [];
      for (const name of requestedTeams) {
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const found = dbTeamsByName.get(key);
        if (!found) {
          return NextResponse.json(
            { error: `Team "${name}" is not a verified paid registration for ${game} (${gender}).` },
            { status: 400 }
          );
        }
        verifiedTeams.push(found);
      }
    } else {
      verifiedTeams = Array.from(dbTeamsByName.values());
    }

    if (verifiedTeams.length < 2) {
      return NextResponse.json(
        { error: `At least 2 verified paid entrants are required for ${game} (${gender}). Found ${verifiedTeams.length}.` },
        { status: 400 }
      );
    }

    const scheduleData = generateDeterministicSchedule({
      gameName: game,
      gender,
      teams: verifiedTeams,
      format,
      matchDate,
      startTime,
      venue,
      breakMinutes: Number.isFinite(breakMinutes) ? breakMinutes : 10,
      matchDurationMinutes: Number.isFinite(matchDurationMinutes) ? matchDurationMinutes : 30,
      seed,
    });

    const id = uuidv4();
    const gameSlug = toGameSlug(game);
    await runTransaction((txn) => [
      txn`
        INSERT INTO match_schedules (id, game_name, gender, schedule_data, generated_by, created_at, updated_at)
        VALUES (${id}, ${game}, ${gender}, ${JSON.stringify(scheduleData)}, ${session.username}, NOW(), NOW())
      `,
      ...(syncToMatches
        ? scheduleData.flatMatches.map(
            (slot) => txn`
              INSERT INTO coordinator_matches (
                id, game_id, game_name, gender, round_name, match_number,
                player1_name, player1_reg_id, player1_roll, player1_contact,
                player2_name, player2_reg_id, player2_roll, player2_contact,
                scheduled_date, scheduled_time, scheduled_start_at, scheduled_end_at,
                venue, status, winner_name, pair_reason, assignment_scope,
                coordinator_id, coordinator_username, created_at, updated_at
              ) VALUES (
                ${uuidv4()}, ${gameSlug}, ${game}, ${gender}, ${slot.round}, ${slot.matchNumber},
                ${slot.player1.teamName}, ${slot.player1.id || null}, ${slot.player1.rollNumber || null}, ${slot.player1.contactNumber || null},
                ${slot.player2 ? slot.player2.teamName : 'BYE'}, ${slot.player2?.id || null}, ${slot.player2?.rollNumber || null}, ${slot.player2?.contactNumber || null},
                ${slot.scheduledDate}, ${slot.scheduledTime}, ${slot.scheduledStartAt}::timestamptz, ${slot.scheduledEndAt}::timestamptz,
                ${slot.venue}, ${slot.isBye ? 'completed' : 'scheduled'}, ${slot.isBye ? slot.player1.teamName : null},
                ${slot.pairReason}, 'hoc_bracket',
                ${session.adminUserId}, ${session.username}, NOW(), NOW()
              )
            `
          )
        : []),
    ]);

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'schedule.generate',
      targetType: 'match_schedule',
      targetId: id,
      after: {
        game,
        gender,
        format,
        teamCount: verifiedTeams.length,
        matchCount: scheduleData.flatMatches.length,
        syncToMatches,
        seed,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      id,
      schedule: scheduleData,
      syncedMatchesCount: syncToMatches ? scheduleData.flatMatches.length : 0,
    });
  } catch (error: any) {
    console.error('Generate matches error:', error);
    return NextResponse.json({ error: 'Failed to generate matches', details: error.message }, { status: 500 });
  }
}

// DELETE - Delete a schedule
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/hoc', 'edit');
    if (auth.error) return auth.error;
    const { session } = auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await sql`DELETE FROM match_schedules WHERE id = ${id}`;

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'schedule.delete',
      targetType: 'match_schedule',
      targetId: id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete schedule error:', error);
    return NextResponse.json({ error: 'Failed to delete schedule', details: error.message }, { status: 500 });
  }
}
