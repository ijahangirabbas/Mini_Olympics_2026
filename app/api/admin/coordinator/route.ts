import { NextRequest, NextResponse } from 'next/server';
import { sql, runTransaction } from '@/lib/db';
import { ensureAuthAndPermissionsSchema, getAdminSession, hasPagePermission, parseAssignedGames } from '@/lib/auth';
import { seededShuffle } from '@/lib/matching';
import { toGameSlug } from '@/lib/games-sync';
import { sendMail } from '@/lib/email';
import { logAudit, getClientIp } from '@/lib/audit';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

function parseJsonField<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return val as T;
}

function isHocOverride(session: NonNullable<Awaited<ReturnType<typeof getAdminSession>>>): boolean {
  return session.role === 'super_admin' || hasPagePermission(session, '/admin/hoc', 'edit');
}

function isWithinCoordinatorScope(
  session: NonNullable<Awaited<ReturnType<typeof getAdminSession>>>,
  gameName: string,
  gender: string
): boolean {
  if (isHocOverride(session)) {
    return true;
  }
  if (session.role !== 'coordinator' && session.assignedGames.length === 0) {
    return true;
  }
  const gameOk =
    session.assignedGames.length > 0 &&
    session.assignedGames.some((g) => g.toLowerCase() === gameName.toLowerCase());
  const genderOk =
    session.assignedGender === 'both' || session.assignedGender === gender;
  return gameOk && genderOk;
}

function buildScheduleBounds(
  scheduledDate: string | null,
  scheduledTime: string | null,
  explicitStartAt?: string | null,
  explicitEndAt?: string | null
): { startIso: string | null; endIso: string | null } {
  if (explicitStartAt) {
    const startDt = new Date(explicitStartAt);
    if (!Number.isNaN(startDt.getTime())) {
      const endDt = explicitEndAt ? new Date(explicitEndAt) : new Date(startDt.getTime() + 45 * 60_000);
      return {
        startIso: startDt.toISOString(),
        endIso: Number.isNaN(endDt.getTime()) ? new Date(startDt.getTime() + 45 * 60_000).toISOString() : endDt.toISOString(),
      };
    }
  }
  if (scheduledDate && scheduledTime) {
    const normalizedTime = scheduledTime.trim().slice(0, 5);
    const startDt = new Date(`${scheduledDate.trim()}T${normalizedTime}:00`);
    if (!Number.isNaN(startDt.getTime())) {
      const endDt = new Date(startDt.getTime() + 45 * 60_000);
      return { startIso: startDt.toISOString(), endIso: endDt.toISOString() };
    }
  }
  return { startIso: null, endIso: null };
}

async function detectScheduleConflicts(params: {
  excludeMatchId?: string;
  startIso: string | null;
  endIso: string | null;
  venue: string | null;
  player1RegId: string | null;
  player2RegId: string | null;
}) {
  const { excludeMatchId, startIso, endIso, venue, player1RegId, player2RegId } = params;
  if (!startIso || !endIso) return [];

  const overlaps = (await sql`
    SELECT id, game_name, round_name, match_number, player1_name, player2_name,
           player1_reg_id, player2_reg_id, venue, scheduled_start_at, scheduled_end_at
    FROM coordinator_matches
    WHERE status IN ('scheduled', 'in_progress')
      AND scheduled_start_at IS NOT NULL
      AND scheduled_end_at IS NOT NULL
      AND (${excludeMatchId || null}::text IS NULL OR id <> ${excludeMatchId || ''})
      AND scheduled_start_at < ${endIso}::timestamptz
      AND scheduled_end_at > ${startIso}::timestamptz
  `) as any[];

  const conflicts: string[] = [];
  const regIds = [player1RegId, player2RegId].filter(Boolean) as string[];

  for (const m of overlaps) {
    if (venue && m.venue && String(m.venue).trim().toLowerCase() === venue.trim().toLowerCase()) {
      conflicts.push(
        `Venue "${venue}" already booked by ${m.game_name} (${m.player1_name} vs ${m.player2_name})`
      );
    }
    if (regIds.length > 0 && (regIds.includes(m.player1_reg_id) || regIds.includes(m.player2_reg_id))) {
      conflicts.push(
        `Player already has overlapping match in ${m.game_name} (${m.player1_name} vs ${m.player2_name})`
      );
    }
  }

  return conflicts;
}

const MATCH_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['in_progress', 'completed', 'cancelled', 'walkover'],
  in_progress: ['completed', 'cancelled', 'walkover'],
  completed: [],
  walkover: [],
  cancelled: ['scheduled'],
};

// GET - Fetch scoped players/teams and unified coordinator_matches
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canAccessCoordinator =
      hasPagePermission(session, '/admin/coordinator', 'view') ||
      hasPagePermission(session, '/admin/hoc', 'view');

    if (!canAccessCoordinator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ensureAuthAndPermissionsSchema();

    const { searchParams } = new URL(request.url);
    const filterGame = searchParams.get('game');
    const filterGender = searchParams.get('gender');
    const filterStatus = searchParams.get('status');
    const filterCoordinatorId = searchParams.get('coordinatorId');
    const filterDate = searchParams.get('date');

    const isScopedCoordinator =
      session.role === 'coordinator' ||
      (session.assignedGames.length > 0 &&
        !hasPagePermission(session, '/admin/hoc', 'view') &&
        session.role !== 'super_admin');

    const gamesRows = (await sql`
      SELECT DISTINCT game_name FROM games_pricing WHERE COALESCE(is_active, true) = true ORDER BY game_name ASC
    `) as any[];
    const allDbGames = gamesRows.map((g) => String(g.game_name));

    const allowedGames = isScopedCoordinator ? session.assignedGames : allDbGames;

    // Explicit player assignments for scoped coordinators (optional granular scope)
    let explicitAssignedRegIds: string[] = [];
    let hasExplicitPlayerAssignments = false;
    if (isScopedCoordinator && session.adminUserId) {
      const paRows = (await sql`
        SELECT DISTINCT registration_id FROM coordinator_player_assignments
        WHERE coordinator_user_id = ${session.adminUserId}
      `) as any[];
      explicitAssignedRegIds = paRows.map((r) => String(r.registration_id));
      hasExplicitPlayerAssignments = explicitAssignedRegIds.length > 0;
    }

    if (isScopedCoordinator && allowedGames.length === 0 && !hasExplicitPlayerAssignments) {
      return NextResponse.json({
        success: true,
        isScopedCoordinator: true,
        hasExplicitPlayerAssignments: false,
        assignedGames: [],
        assignedGender: session.assignedGender,
        games: [],
        players: [],
        matches: [],
        coordinators: [],
      });
    }

    // SQL-filtered registration query
    const regConditions: string[] = [`status != 'rejected'`];
    const regParams: any[] = [];

    if (isScopedCoordinator) {
      const scopeClauses: string[] = [];
      if (hasExplicitPlayerAssignments) {
        regParams.push(explicitAssignedRegIds);
        scopeClauses.push(`id = ANY($${regParams.length}::text[])`);
      }
      if (allowedGames.length > 0) {
        const gameScopeParts: string[] = [];
        if (session.assignedGender !== 'both') {
          regParams.push(session.assignedGender);
          gameScopeParts.push(`gender = $${regParams.length}`);
        }
        const gameLikes = allowedGames.map((g) => {
          regParams.push(`%"${g}"%`);
          return `selected_games::text ILIKE $${regParams.length}`;
        });
        gameScopeParts.push(`(${gameLikes.join(' OR ')})`);
        scopeClauses.push(`(${gameScopeParts.join(' AND ')})`);
      }
      if (scopeClauses.length > 0) {
        regConditions.push(`(${scopeClauses.join(' OR ')})`);
      }
    }

    if (filterGender && filterGender !== 'all') {
      regParams.push(filterGender);
      regConditions.push(`gender = $${regParams.length}`);
    }
    if (filterGame && filterGame !== 'all') {
      regParams.push(`%"${filterGame}"%`);
      regConditions.push(`selected_games::text ILIKE $${regParams.length}`);
    }

    const regRows = (await sql(
      `SELECT id, registration_number, name, roll_number, contact_number, alternative_contact_number,
              email, gender, team_name, selected_games, team_members, status, created_at
       FROM registrations
       WHERE ${regConditions.join(' AND ')}
       ORDER BY registration_number ASC, created_at DESC`,
      regParams
    )) as any[];

    const allowedGamesLower = new Set(allowedGames.map((g) => g.toLowerCase()));

    const players = regRows.map((r) => {
      const rawSelectedGames = parseJsonField<string[]>(r.selected_games, []);
      const rawTeamMembers = parseJsonField<Record<string, any[]>>(r.team_members, {});

      // Strip unassigned games & unrelated team rosters for scoped coordinators
      const selectedGames = isScopedCoordinator
        ? rawSelectedGames.filter((g) => allowedGamesLower.has(g.toLowerCase()))
        : rawSelectedGames;

      const teamMembers: Record<string, any[]> = {};
      for (const g of selectedGames) {
        if (rawTeamMembers && rawTeamMembers[g]) {
          teamMembers[g] = rawTeamMembers[g];
        }
      }

      return {
        id: r.id,
        registrationNumber: r.registration_number,
        name: r.name,
        rollNumber: r.roll_number,
        contactNumber: r.contact_number,
        alternativeContactNumber: r.alternative_contact_number,
        email: r.email,
        gender: r.gender as 'boys' | 'girls',
        teamName: r.team_name || r.name,
        selectedGames,
        teamMembers,
        status: r.status,
        createdAt: r.created_at,
      };
    });

    // SQL-filtered coordinator_matches query
    const matchConditions: string[] = [];
    const matchParams: any[] = [];

    if (isScopedCoordinator) {
      if (hasExplicitPlayerAssignments) {
        matchParams.push(explicitAssignedRegIds);
        const regIdx = matchParams.length;
        matchParams.push(session.adminUserId || '');
        const userIdx = matchParams.length;
        matchConditions.push(
          `(coordinator_id = $${userIdx} OR player1_reg_id = ANY($${regIdx}::text[]) OR player2_reg_id = ANY($${regIdx}::text[]))`
        );
      } else {
        if (session.assignedGender !== 'both') {
          matchParams.push(session.assignedGender);
          matchConditions.push(`gender = $${matchParams.length}`);
        }
        const gameLowerList = allowedGames.map((g) => g.toLowerCase());
        matchParams.push(gameLowerList);
        matchConditions.push(`LOWER(game_name) = ANY($${matchParams.length}::text[])`);
      }
    }

    if (filterGame && filterGame !== 'all') {
      matchParams.push(filterGame.toLowerCase());
      matchConditions.push(`LOWER(game_name) = $${matchParams.length}`);
    }
    if (filterGender && filterGender !== 'all') {
      matchParams.push(filterGender);
      matchConditions.push(`gender = $${matchParams.length}`);
    }
    if (filterStatus && filterStatus !== 'all') {
      matchParams.push(filterStatus);
      matchConditions.push(`status = $${matchParams.length}`);
    }
    if (!isScopedCoordinator && filterCoordinatorId && filterCoordinatorId !== 'all') {
      matchParams.push(filterCoordinatorId);
      matchConditions.push(`coordinator_id = $${matchParams.length}`);
    }
    if (filterDate) {
      matchParams.push(filterDate);
      matchConditions.push(`scheduled_date = $${matchParams.length}`);
    }

    const matchWhere = matchConditions.length > 0 ? `WHERE ${matchConditions.join(' AND ')}` : '';
    const matches = (await sql(
      `SELECT * FROM coordinator_matches ${matchWhere} ORDER BY COALESCE(scheduled_start_at, created_at) DESC`,
      matchParams
    )) as any[];

    let coordinators: any[] = [];
    if (!isScopedCoordinator) {
      const coordRows = (await sql`
        SELECT id, username, display_name, assigned_games, assigned_gender, is_active
        FROM admin_users
        WHERE role = 'coordinator'
        ORDER BY username ASC
      `) as any[];
      coordinators = coordRows.map((c) => ({
        id: c.id,
        username: c.username,
        displayName: c.display_name || c.username,
        assignedGames: parseAssignedGames(c.assigned_games),
        assignedGender: c.assigned_gender || 'both',
        isActive: c.is_active !== false,
      }));
    }

    return NextResponse.json({
      success: true,
      isScopedCoordinator,
      hasExplicitPlayerAssignments,
      assignedGames: session.assignedGames,
      assignedGender: session.assignedGender,
      games: allowedGames,
      players,
      matches,
      coordinators,
    });
  } catch (error: any) {
    console.error('Coordinator GET error:', error);
    return NextResponse.json({ error: 'Failed to load coordinator data', details: error.message }, { status: 500 });
  }
}

// POST - Create a verified match or deterministic seeded auto_pair Round 1 fixtures
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canEdit =
      hasPagePermission(session, '/admin/coordinator', 'edit') ||
      hasPagePermission(session, '/admin/hoc', 'edit');

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden - Edit permission required' }, { status: 403 });
    }

    await ensureAuthAndPermissionsSchema();

    const body = await request.json();

    // Auto-pair Round 1 fixtures strictly using DB-verified paid registrations & deterministic seed
    if (body?.action === 'auto_pair') {
      const gameName = String(body?.gameName || '').trim();
      const gender = body?.gender === 'girls' ? 'girls' : 'boys';
      const roundName = String(body?.roundName || 'Round 1').trim();
      const venue = body?.venue ? String(body.venue).trim() : '';
      const scheduledDate = body?.scheduledDate ? String(body.scheduledDate).trim() : '';
      const scheduledTime = body?.scheduledTime ? String(body.scheduledTime).trim() : '';
      const rawPlayers = Array.isArray(body?.players) ? body.players : [];
      const playerIds = Array.isArray(body?.playerIds)
        ? body.playerIds.map((x: any) => String(x).trim()).filter(Boolean)
        : rawPlayers.map((p: any) => String(p?.id || '').trim()).filter(Boolean);

      if (!gameName || playerIds.length < 2) {
        return NextResponse.json(
          { error: 'Select a game and at least 2 verified paid players to auto-pair' },
          { status: 400 }
        );
      }

      if (!isWithinCoordinatorScope(session, gameName, gender)) {
        return NextResponse.json(
          { error: 'Forbidden - Game/Gender is outside your assigned coordinator scope' },
          { status: 403 }
        );
      }

      // Fetch authoritative paid registrations from DB
      const paidRows = (await sql`
        SELECT id, name, team_name, roll_number, contact_number, email, gender, selected_games, status
        FROM registrations
        WHERE id = ANY(${playerIds}::text[])
          AND status = 'paid'
          AND gender = ${gender}
      `) as any[];

      const verifiedPlayers = paidRows.filter((r) => {
        const sg = parseJsonField<string[]>(r.selected_games, []);
        return sg.some((g) => g.toLowerCase() === gameName.toLowerCase());
      });

      if (verifiedPlayers.length < 2) {
        return NextResponse.json(
          {
            error: `Only ${verifiedPlayers.length} selected players have verified 'paid' status for ${gameName} (${gender}). Unpaid players cannot be auto-paired.`,
          },
          { status: 400 }
        );
      }

      // If coordinator has explicit player assignments, ensure selected IDs belong to their roster
      if (!isHocOverride(session) && session.adminUserId) {
        const paRows = (await sql`
          SELECT registration_id FROM coordinator_player_assignments WHERE coordinator_user_id = ${session.adminUserId}
        `) as any[];
        if (paRows.length > 0) {
          const allowedSet = new Set(paRows.map((x) => String(x.registration_id)));
          const unauthorized = verifiedPlayers.filter((p) => !allowedSet.has(p.id));
          if (unauthorized.length > 0) {
            return NextResponse.json(
              { error: 'Forbidden - Some selected players are not assigned to your coordinator roster' },
              { status: 403 }
            );
          }
        }
      }

      // Guard against duplicate pairing of players already active in this game + round
      const existingRoundMatches = (await sql`
        SELECT player1_reg_id, player2_reg_id
        FROM coordinator_matches
        WHERE LOWER(game_name) = LOWER(${gameName})
          AND gender = ${gender}
          AND LOWER(round_name) = LOWER(${roundName})
          AND status <> 'cancelled'
      `) as any[];

      const alreadyPaired = new Set<string>();
      for (const em of existingRoundMatches) {
        if (em.player1_reg_id) alreadyPaired.add(String(em.player1_reg_id));
        if (em.player2_reg_id) alreadyPaired.add(String(em.player2_reg_id));
      }

      const eligiblePlayers = verifiedPlayers.filter((p) => !alreadyPaired.has(String(p.id)));
      if (eligiblePlayers.length < 2) {
        return NextResponse.json(
          { error: `All selected players already have active fixtures in ${roundName}.` },
          { status: 409 }
        );
      }

      const seedStr = body?.seed
        ? String(body.seed).trim()
        : `${gameName}:${gender}:${roundName}:${new Date().toISOString().slice(0, 13)}:${eligiblePlayers.length}`;

      const shuffled = seededShuffle(eligiblePlayers, seedStr);
      const gameSlug = toGameSlug(gameName);
      const bounds = buildScheduleBounds(scheduledDate || null, scheduledTime || null);
      const createdMatches: any[] = [];
      const pendingInserts: Array<{
        id: string;
        matchNum: number;
        p1: any;
        p2: any;
        p1Name: string;
        p2Name: string;
        status: string;
        winnerName: string | null;
        pairReason: string;
      }> = [];

      let matchNum = existingRoundMatches.length + 1;
      for (let i = 0; i < shuffled.length; i += 2) {
        const p1 = shuffled[i];
        const p2 = shuffled[i + 1] || null;
        if (p2 && p1.id === p2.id) continue;

        const id = uuidv4();
        const p1Name = p1.team_name || p1.name || 'Player 1';
        const p2Name = p2 ? p2.team_name || p2.name || 'Player 2' : 'BYE';
        const status = p2 ? 'scheduled' : 'completed';
        const winnerName = p2 ? null : p1Name;
        const pairReason = p2
          ? `Seeded Fisher-Yates (seed: ${seedStr}, verified paid pool: ${shuffled.length})`
          : `Automatic BYE (odd entrant count in ${roundName}, seed: ${seedStr})`;

        pendingInserts.push({ id, matchNum, p1, p2, p1Name, p2Name, status, winnerName, pairReason });
        createdMatches.push({ id, matchNumber: matchNum, player1Name: p1Name, player2Name: p2Name, pairReason });
        matchNum++;
      }

      if (pendingInserts.length > 0) {
        await runTransaction((txn) =>
          pendingInserts.map(
            (m) => txn`
              INSERT INTO coordinator_matches (
                id, game_id, game_name, gender, round_name, match_number,
                player1_name, player1_reg_id, player1_roll, player1_contact,
                player2_name, player2_reg_id, player2_roll, player2_contact,
                scheduled_date, scheduled_time, scheduled_start_at, scheduled_end_at,
                venue, status, winner_name, pair_reason, assignment_scope,
                coordinator_id, coordinator_username, created_at, updated_at
              ) VALUES (
                ${m.id}, ${gameSlug}, ${gameName}, ${gender}, ${roundName}, ${m.matchNum},
                ${m.p1Name}, ${m.p1.id}, ${m.p1.roll_number || null}, ${m.p1.contact_number || null},
                ${m.p2Name}, ${m.p2 ? m.p2.id : null}, ${m.p2?.roll_number || null}, ${m.p2?.contact_number || null},
                ${scheduledDate || null}, ${scheduledTime || null}, ${bounds.startIso}::timestamptz, ${bounds.endIso}::timestamptz,
                ${venue || null}, ${m.status}, ${m.winnerName}, ${m.pairReason}, 'auto_pair',
                ${session.adminUserId}, ${session.username}, NOW(), NOW()
              )
            `
          )
        );
      }

      await logAudit({
        actorUserId: session.adminUserId,
        actorUsername: session.username,
        action: 'match.auto_pair',
        targetType: 'coordinator_matches',
        after: { gameName, gender, roundName, seed: seedStr, createdCount: createdMatches.length },
        ip: getClientIp(request),
      });

      return NextResponse.json({
        success: true,
        count: createdMatches.length,
        seed: seedStr,
        matches: createdMatches,
      });
    }

    // Create single match
    const gameName = String(body?.gameName || '').trim();
    const gender = body?.gender === 'girls' ? 'girls' : 'boys';
    const roundName = String(body?.roundName || 'Round 1').trim();
    const matchNumber = Number(body?.matchNumber) || 1;
    const player1Name = String(body?.player1Name || '').trim();
    const player2Name = String(body?.player2Name || '').trim();
    const player1RegId = body?.player1RegId ? String(body.player1RegId).trim() : null;
    const player2RegId = body?.player2RegId ? String(body.player2RegId).trim() : null;

    if (!gameName || !player1Name || !player2Name) {
      return NextResponse.json({ error: 'gameName, player1Name, and player2Name are required' }, { status: 400 });
    }

    if (
      (player1RegId && player2RegId && player1RegId === player2RegId) ||
      (player1Name.toLowerCase() === player2Name.toLowerCase() && player2Name !== 'BYE')
    ) {
      return NextResponse.json({ error: 'A player or team cannot be matched against themselves' }, { status: 400 });
    }

    if (!isWithinCoordinatorScope(session, gameName, gender)) {
      return NextResponse.json(
        { error: 'Forbidden - Game/Gender is outside your assigned coordinator scope' },
        { status: 403 }
      );
    }

    const scheduledDate = body?.scheduledDate ? String(body.scheduledDate).trim() : null;
    const scheduledTime = body?.scheduledTime ? String(body.scheduledTime).trim() : null;
    const venue = body?.venue ? String(body.venue).trim() : null;
    const bounds = buildScheduleBounds(
      scheduledDate,
      scheduledTime,
      body?.scheduledStartAt || null,
      body?.scheduledEndAt || null
    );

    const conflicts = await detectScheduleConflicts({
      startIso: bounds.startIso,
      endIso: bounds.endIso,
      venue,
      player1RegId,
      player2RegId,
    });

    const forceOverride = Boolean(body?.forceOverride) && isHocOverride(session);
    if (conflicts.length > 0 && !forceOverride) {
      return NextResponse.json(
        {
          error: conflicts[0],
          conflicts,
          canOverride: isHocOverride(session),
        },
        { status: 409 }
      );
    }

    const id = uuidv4();
    const gameSlug = toGameSlug(gameName);
    const coordinatorId = (isHocOverride(session) && body?.coordinatorId) ? String(body.coordinatorId) : session.adminUserId;
    const coordinatorUsername = (isHocOverride(session) && body?.coordinatorUsername) ? String(body.coordinatorUsername) : session.username;

    await sql`
      INSERT INTO coordinator_matches (
        id, game_id, game_name, gender, round_name, match_number,
        player1_name, player1_reg_id, player1_roll, player1_contact,
        player2_name, player2_reg_id, player2_roll, player2_contact,
        scheduled_date, scheduled_time, scheduled_start_at, scheduled_end_at,
        venue, status, notes, pair_reason, assignment_scope,
        coordinator_id, coordinator_username, created_at, updated_at
      ) VALUES (
        ${id}, ${gameSlug}, ${gameName}, ${gender}, ${roundName}, ${matchNumber},
        ${player1Name}, ${player1RegId}, ${body?.player1Roll || null}, ${body?.player1Contact || null},
        ${player2Name}, ${player2RegId}, ${body?.player2Roll || null}, ${body?.player2Contact || null},
        ${scheduledDate}, ${scheduledTime}, ${bounds.startIso}::timestamptz, ${bounds.endIso}::timestamptz,
        ${venue}, ${'scheduled'}, ${body?.notes || null}, ${body?.pairReason || 'Manual coordinator pairing'},
        ${'manual'}, ${coordinatorId}, ${coordinatorUsername}, NOW(), NOW()
      )
    `;

    // Optional email notification on match scheduling
    if (body?.notifyPlayers && (player1RegId || player2RegId)) {
      const regIds = [player1RegId, player2RegId].filter(Boolean) as string[];
      try {
        const regEmails = (await sql`
          SELECT email, name FROM registrations WHERE id = ANY(${regIds}::text[])
        `) as any[];
        for (const r of regEmails) {
          if (!r.email) continue;
          await sendMail({
            to: r.email,
            subject: `Mini Olympics 2026 - ${gameName} Match Scheduled (${roundName})`,
            html: `<p>Dear ${r.name || 'Participant'},</p><p>Your <strong>${gameName}</strong> (${roundName}) match between <strong>${player1Name}</strong> and <strong>${player2Name}</strong> has been scheduled${scheduledDate ? ` on <strong>${scheduledDate}</strong>` : ''}${scheduledTime ? ` at <strong>${scheduledTime}</strong>` : ''}${venue ? ` at <strong>${venue}</strong>` : ''}.</p><p>Best regards,<br/>FCIT Sports Society</p>`,
          });
        }
      } catch (e) {
        console.warn('Match schedule notification failed:', e);
      }
    }

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'match.create',
      targetType: 'coordinator_match',
      targetId: id,
      after: { gameName, gender, roundName, player1Name, player2Name, scheduledDate, scheduledTime, venue, forceOverride },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Coordinator POST error:', error);
    return NextResponse.json({ error: 'Failed to create match', details: error.message }, { status: 500 });
  }
}

// PATCH - Update match time, venue, status, score, or winner with state machine & conflict checks
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canEdit =
      hasPagePermission(session, '/admin/coordinator', 'edit') ||
      hasPagePermission(session, '/admin/hoc', 'edit');

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden - Edit permission required' }, { status: 403 });
    }

    await ensureAuthAndPermissionsSchema();

    const body = await request.json();
    const id = String(body?.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'Match id is required' }, { status: 400 });
    }

    const existingRows = (await sql`SELECT * FROM coordinator_matches WHERE id = ${id} LIMIT 1`) as any[];
    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    const current = existingRows[0];

    if (!isWithinCoordinatorScope(session, current.game_name, current.gender)) {
      return NextResponse.json(
        { error: 'Forbidden - Match is outside your assigned coordinator scope' },
        { status: 403 }
      );
    }

    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'walkover'];
    const requestedStatus = body?.status !== undefined ? String(body.status) : current.status;
    if (!validStatuses.includes(requestedStatus)) {
      return NextResponse.json({ error: 'Invalid match status' }, { status: 400 });
    }

    const hocCanOverride = isHocOverride(session);
    const forceOverride = Boolean(body?.forceOverride) && hocCanOverride;

    if (
      requestedStatus !== current.status &&
      !MATCH_TRANSITIONS[current.status]?.includes(requestedStatus) &&
      !forceOverride
    ) {
      return NextResponse.json(
        {
          error: `Illegal match transition from '${current.status}' to '${requestedStatus}'. HOC/Super Admin override required to reopen finalized matches.`,
          canOverride: hocCanOverride,
        },
        { status: 409 }
      );
    }

    const roundName = body?.roundName !== undefined ? String(body.roundName).trim() : current.round_name;
    const matchNumber = body?.matchNumber !== undefined ? Number(body.matchNumber) || 1 : current.match_number;
    const player1Name = body?.player1Name !== undefined ? String(body.player1Name).trim() : current.player1_name;
    const player2Name = body?.player2Name !== undefined ? String(body.player2Name).trim() : current.player2_name;
    const scheduledDate = body?.scheduledDate !== undefined ? body.scheduledDate || null : current.scheduled_date;
    const scheduledTime = body?.scheduledTime !== undefined ? body.scheduledTime || null : current.scheduled_time;
    const venue = body?.venue !== undefined ? body.venue || null : current.venue;
    const winnerName = body?.winnerName !== undefined ? body.winnerName || null : current.winner_name;
    const scoreSummary = body?.scoreSummary !== undefined ? body.scoreSummary || null : current.score_summary;
    const notes = body?.notes !== undefined ? body.notes || null : current.notes;

    // Validate winner when match is finalized
    if ((requestedStatus === 'completed' || requestedStatus === 'walkover') && winnerName) {
      const wLower = String(winnerName).trim().toLowerCase();
      if (
        wLower !== String(player1Name).trim().toLowerCase() &&
        wLower !== String(player2Name).trim().toLowerCase() &&
        wLower !== 'draw'
      ) {
        return NextResponse.json(
          { error: `Winner "${winnerName}" must match "${player1Name}", "${player2Name}", or "Draw"` },
          { status: 400 }
        );
      }
    }

    const bounds = buildScheduleBounds(
      scheduledDate,
      scheduledTime,
      body?.scheduledStartAt || null,
      body?.scheduledEndAt || null
    );

    if (requestedStatus === 'scheduled' || requestedStatus === 'in_progress') {
      const conflicts = await detectScheduleConflicts({
        excludeMatchId: id,
        startIso: bounds.startIso,
        endIso: bounds.endIso,
        venue,
        player1RegId: current.player1_reg_id,
        player2RegId: current.player2_reg_id,
      });
      if (conflicts.length > 0 && !forceOverride) {
        return NextResponse.json(
          { error: conflicts[0], conflicts, canOverride: hocCanOverride },
          { status: 409 }
        );
      }
    }

    const nextCoordinatorId =
      hocCanOverride && body?.coordinatorId !== undefined ? body.coordinatorId || null : current.coordinator_id;
    const nextCoordinatorUsername =
      hocCanOverride && body?.coordinatorUsername !== undefined
        ? body.coordinatorUsername || null
        : current.coordinator_username;

    await sql`
      UPDATE coordinator_matches
      SET round_name = ${roundName},
          match_number = ${matchNumber},
          player1_name = ${player1Name},
          player2_name = ${player2Name},
          scheduled_date = ${scheduledDate},
          scheduled_time = ${scheduledTime},
          scheduled_start_at = ${bounds.startIso}::timestamptz,
          scheduled_end_at = ${bounds.endIso}::timestamptz,
          venue = ${venue},
          status = ${requestedStatus},
          winner_name = ${winnerName},
          score_summary = ${scoreSummary},
          notes = ${notes},
          coordinator_id = ${nextCoordinatorId},
          coordinator_username = ${nextCoordinatorUsername},
          updated_at = NOW()
      WHERE id = ${id}
    `;

    // Optional notification on schedule change or final result
    if (body?.notifyPlayers && (current.player1_reg_id || current.player2_reg_id)) {
      const regIds = [current.player1_reg_id, current.player2_reg_id].filter(Boolean) as string[];
      try {
        const regEmails = (await sql`
          SELECT email, name FROM registrations WHERE id = ANY(${regIds}::text[])
        `) as any[];
        for (const r of regEmails) {
          if (!r.email) continue;
          const isFinal = requestedStatus === 'completed' || requestedStatus === 'walkover';
          await sendMail({
            to: r.email,
            subject: isFinal
              ? `Mini Olympics 2026 - ${current.game_name} Match Result (${roundName})`
              : `Mini Olympics 2026 - ${current.game_name} Match Schedule Update`,
            html: isFinal
              ? `<p>Dear ${r.name || 'Participant'},</p><p>Result recorded for <strong>${current.game_name}</strong> (${roundName}): <strong>${player1Name} vs ${player2Name}</strong>.</p><p>Winner: <strong>${winnerName || 'TBD'}</strong>${scoreSummary ? ` (${scoreSummary})` : ''}</p>`
              : `<p>Dear ${r.name || 'Participant'},</p><p>Your <strong>${current.game_name}</strong> (${roundName}) match schedule has been updated: <strong>${player1Name} vs ${player2Name}</strong>${scheduledDate ? ` on <strong>${scheduledDate}</strong>` : ''}${scheduledTime ? ` at <strong>${scheduledTime}</strong>` : ''}${venue ? ` at <strong>${venue}</strong>` : ''}.</p>`,
          });
        }
      } catch (e) {
        console.warn('Match update email failed:', e);
      }
    }

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: forceOverride ? 'match.override' : 'match.update',
      targetType: 'coordinator_match',
      targetId: id,
      before: {
        status: current.status,
        winnerName: current.winner_name,
        scheduledDate: current.scheduled_date,
        scheduledTime: current.scheduled_time,
        venue: current.venue,
      },
      after: {
        status: requestedStatus,
        winnerName,
        scoreSummary,
        scheduledDate,
        scheduledTime,
        venue,
        overrideReason: body?.overrideReason || null,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Coordinator PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update match', details: error.message }, { status: 500 });
  }
}

// DELETE - Force unmatch / delete fixture
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canEdit =
      hasPagePermission(session, '/admin/coordinator', 'edit') ||
      hasPagePermission(session, '/admin/hoc', 'edit');

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden - Edit permission required' }, { status: 403 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Match id is required' }, { status: 400 });
    }

    const existingRows = (await sql`
      SELECT id, game_name, gender, status, player1_name, player2_name FROM coordinator_matches WHERE id = ${id} LIMIT 1
    `) as any[];
    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const match = existingRows[0];
    if (!isWithinCoordinatorScope(session, match.game_name, match.gender)) {
      return NextResponse.json(
        { error: 'Forbidden - Match is outside your assigned coordinator scope' },
        { status: 403 }
      );
    }

    if ((match.status === 'completed' || match.status === 'walkover') && !isHocOverride(session)) {
      return NextResponse.json(
        { error: 'Only HOC or Super Admin can delete a completed match' },
        { status: 403 }
      );
    }

    await sql`DELETE FROM coordinator_matches WHERE id = ${id}`;

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'match.delete',
      targetType: 'coordinator_match',
      targetId: id,
      before: {
        gameName: match.game_name,
        status: match.status,
        player1Name: match.player1_name,
        player2Name: match.player2_name,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Coordinator DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete match', details: error.message }, { status: 500 });
  }
}
