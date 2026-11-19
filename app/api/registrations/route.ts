import { NextRequest, NextResponse } from 'next/server';
import { sql, runTransaction } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { z } from 'zod';
import { sendRegistrationSubmittedEmail, sendPaymentReceivedEmail, sendPaymentNotReceivedEmail } from '@/lib/email';
import { ensureAuthAndPermissionsSchema, requireAdminPermission } from '@/lib/auth';
import { ensureGamesSchema, isEsportsWindowOpen, toGameSlug } from '@/lib/games-sync';
import { resolvePricingName, GAMES_DATA } from '@/lib/games-data';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAudit, getClientIp } from '@/lib/audit';

function generateSlipId(prefix: 'CASH' | 'ONLINE'): string {
  const token = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MO26-${prefix}-${token}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const registrationCreateSchema = z.object({
  email: z.string().trim().email('Valid email address is required').max(180),
  name: z.string().trim().min(2, 'Full name is required').max(120),
  rollNumber: z.string().trim().min(3, 'Roll number is required').max(40),
  contactNumber: z.string().trim().min(7, 'Valid contact number is required').max(25),
  alternativeContactNumber: z.string().trim().max(25).optional().nullable(),
  gender: z.enum(['boys', 'girls']),
  teamName: z.string().trim().min(2, 'Team name is required').max(80),
  selectedGames: z.array(z.string().trim().min(1)).min(1, 'Select at least one game').max(30),
  teamMembers: z.record(z.any()).optional().nullable(),
  paymentMethod: z.enum(['cash', 'online']),
  transactionId: z.string().trim().max(120).optional().nullable(),
  screenshotUrl: z.string().max(3_500_000, 'Payment screenshot exceeds maximum size').optional().nullable(),
  couponCode: z.string().trim().max(60).optional().nullable(),
});

// POST - Create new registration
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`reg-create:${ip}`, 15, 10 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please wait a few minutes before trying again.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      );
    }

    await ensureAuthAndPermissionsSchema();
    await ensureGamesSchema();

    const rawBody = await request.json();
    const parsed = registrationCreateSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || 'Invalid registration data', field: firstIssue?.path?.[0] },
        { status: 400 }
      );
    }

    const {
      email,
      name,
      rollNumber,
      contactNumber,
      alternativeContactNumber,
      gender,
      teamName,
      teamMembers,
      paymentMethod,
      transactionId,
      screenshotUrl,
      couponCode,
    } = parsed.data;

    // Deduplicate selected games preserving order
    const selectedGames = Array.from(new Set(parsed.data.selectedGames));

    // Read runtime settings (registrations_open & cash_payment_enabled)
    const settingsRows = (await sql`
      SELECT key, value FROM system_settings
      WHERE key IN ('registrations_open', 'cash_payment_enabled')
    `) as any[];
    const settingsMap = new Map(settingsRows.map((r) => [String(r.key), String(r.value)]));

    const regOpenValue = settingsMap.get('registrations_open');
    if (regOpenValue === 'false' || regOpenValue === '0') {
      return NextResponse.json(
        {
          error: 'Registrations are currently closed. For any questions, please contact sports.oc@pucit.edu.pk',
          code: 'REGISTRATIONS_CLOSED',
        },
        { status: 503 }
      );
    }

    const dbCashVal = settingsMap.get('cash_payment_enabled');
    const envCashVal = process.env.CASH_PAYMENT_ENABLED ?? process.env.NEXT_PUBLIC_CASH_PAYMENT_ENABLED;
    const cashEnabled =
      dbCashVal !== undefined
        ? dbCashVal !== 'false' && dbCashVal !== '0'
        : envCashVal !== 'false' && envCashVal !== '0';

    if (paymentMethod === 'cash' && !cashEnabled) {
      return NextResponse.json(
        { error: 'Cash payment is currently disabled. Please use online payment.', field: 'paymentMethod' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'online' && !transactionId && !screenshotUrl) {
      return NextResponse.json(
        { error: 'Online payment requires either a Transaction ID or payment screenshot.', field: 'transactionId' },
        { status: 400 }
      );
    }

    // Authoritative server-side price & status lookup from active DB games_pricing + games
    const priceRows = (await sql`
      SELECT gp.id, gp.game_id, gp.game_name, gp.price, gp.players,
             COALESCE(gp.category, g.category) AS category,
             COALESCE(gp.currency, 'PKR') AS currency,
             COALESCE(gp.coupon_eligible, g.coupon_eligible, true) AS coupon_eligible
      FROM games_pricing gp
      LEFT JOIN games g ON g.id = gp.game_id OR LOWER(g.name) = LOWER(gp.game_name)
      WHERE gp.gender = ${gender}
        AND COALESCE(gp.is_active, true) = true
        AND COALESCE(g.is_active, true) = true
    `) as any[];

    const priceByName = new Map<string, any>();
    for (const r of priceRows) {
      priceByName.set(String(r.game_name).trim().toLowerCase(), r);
    }

    const resolvedItems: Array<{
      gameId: string;
      gameName: string;
      unitPrice: number;
      currency: string;
      playersCount: number;
      category: string | null;
      couponEligible: boolean;
    }> = [];

    const availableDbGameNames = priceRows.map((r) => String(r.game_name));
    for (const rawGame of selectedGames) {
      const canonical = resolvePricingName(rawGame, availableDbGameNames) || rawGame;
      const row =
        priceByName.get(rawGame.toLowerCase()) ||
        priceByName.get(canonical.toLowerCase());
      if (!row) {
        return NextResponse.json(
          { error: `Selected game "${rawGame}" is unavailable or inactive for ${gender}.`, field: 'selectedGames' },
          { status: 400 }
        );
      }
      const unitPrice = Number(row.price);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return NextResponse.json(
          { error: `Pricing configuration invalid for "${row.game_name}". Please contact admin.` },
          { status: 500 }
        );
      }
      resolvedItems.push({
        gameId: row.game_id || toGameSlug(row.game_name),
        gameName: String(row.game_name),
        unitPrice,
        currency: String(row.currency || 'PKR'),
        playersCount: Number(row.players) || 1,
        category: row.category || GAMES_DATA.find((g) => g.name.toLowerCase() === String(row.game_name).toLowerCase())?.category || null,
        couponEligible: Boolean(row.coupon_eligible),
      });
    }

    // Enforce esports_settings window when any Esports game is selected
    const hasEsports = resolvedItems.some((item) => String(item.category || '').toLowerCase() === 'esports');
    if (hasEsports) {
      const esRows = (await sql`SELECT * FROM esports_settings WHERE id = '1' LIMIT 1`) as any[];
      const es = esRows[0] || null;
      if (es && !isEsportsWindowOpen(es)) {
        return NextResponse.json(
          {
            error: es.announcement || 'Esports registrations are currently closed.',
            code: 'ESPORTS_CLOSED',
            field: 'selectedGames',
          },
          { status: 403 }
        );
      }
    }

    const canonicalSelectedGames = resolvedItems.map((i) => i.gameName);
    const totalAmountNum = resolvedItems.reduce((sum, i) => sum + i.unitPrice, 0);

    // Server-side coupon discount calculation excluding Swimming / non-coupon-eligible games
    let discountNum = 0;
    let couponCodeToStore: string | null = null;
    if (couponCode && couponCode.trim()) {
      const code = couponCode.trim().toUpperCase();
      const couponRows = (await sql`
        SELECT id, discount_percent, is_active FROM coupons
        WHERE UPPER(TRIM(code)) = ${code} AND is_active = true
        LIMIT 1
      `) as any[];

      if (!couponRows || couponRows.length === 0) {
        return NextResponse.json(
          { error: 'The coupon code you used is no longer valid. Please remove it or use a different code.', field: 'couponCode' },
          { status: 400 }
        );
      }

      const pct = Number(couponRows[0].discount_percent) || 0;
      if (pct > 0 && pct <= 100) {
        const amountEligibleNum = resolvedItems
          .filter(
            (i) =>
              i.couponEligible &&
              i.gameName.toLowerCase() !== 'swimming' &&
              i.gameName.toLowerCase() !== 'swimming sprint'
          )
          .reduce((sum, i) => sum + i.unitPrice, 0);
        discountNum = Math.round(((amountEligibleNum * pct) / 100) * 100) / 100;
        couponCodeToStore = code;
      }
    }
    if (discountNum < 0) discountNum = 0;
    if (discountNum > totalAmountNum) discountNum = totalAmountNum;

    // Pre-check team name uniqueness for fast user feedback (unique index enforces atomically)
    const existingTeam = (await sql`
      SELECT id FROM registrations WHERE LOWER(team_name) = LOWER(${teamName}) LIMIT 1
    `) as any[];
    if (existingTeam.length > 0) {
      return NextResponse.json(
        { error: 'Team name already exists. Please choose a unique team name.', field: 'teamName' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const status = paymentMethod === 'cash' ? 'pending_cash' : 'pending_online';
    const selectedGamesJson = JSON.stringify(canonicalSelectedGames);
    const teamMembersJson = teamMembers ? JSON.stringify(teamMembers) : null;

    let slipId = '';
    let registrationNumber: number | null = null;

    // Atomic transaction with retry on rare slip_id collision
    for (let attempt = 0; attempt < 3; attempt++) {
      slipId = generateSlipId(paymentMethod === 'cash' ? 'CASH' : 'ONLINE');
      try {
        const txResults = await runTransaction((txn) => [
          txn`
            INSERT INTO registrations (
              id, email, name, roll_number, contact_number, alternative_contact_number,
              gender, team_name, selected_games, team_members, total_amount, discount,
              coupon_code, payment_method, slip_id, transaction_id, screenshot_url,
              status, created_at, updated_at
            ) VALUES (
              ${id}, ${email}, ${name}, ${rollNumber}, ${contactNumber}, ${alternativeContactNumber || null},
              ${gender}, ${teamName}, ${selectedGamesJson}, ${teamMembersJson}, ${totalAmountNum}, ${discountNum},
              ${couponCodeToStore}, ${paymentMethod}, ${slipId}, ${transactionId || null}, ${screenshotUrl || null},
              ${status}, NOW(), NOW()
            )
            RETURNING registration_number
          `,
          ...resolvedItems.map((item) => {
            const itemMembers =
              teamMembers && teamMembers[item.gameName]
                ? JSON.stringify(teamMembers[item.gameName])
                : null;
            return txn`
              INSERT INTO registration_items (
                id, registration_id, game_id, game_name, gender, unit_price, currency, players_count, team_members_json, created_at
              ) VALUES (
                ${uuidv4()}, ${id}, ${item.gameId}, ${item.gameName}, ${gender}, ${item.unitPrice}, ${item.currency}, ${item.playersCount}, ${itemMembers}, NOW()
              )
            `;
          }),
        ]);
        registrationNumber = (txResults[0] as any[])?.[0]?.registration_number ?? null;
        break;
      } catch (err: any) {
        if (err?.code === '23505') {
          const msg = String(err?.message || '') + ' ' + String(err?.constraint || '');
          if (msg.toLowerCase().includes('team_name')) {
            return NextResponse.json(
              { error: 'Team name already exists. Please choose a unique team name.', field: 'teamName' },
              { status: 400 }
            );
          }
          if (msg.toLowerCase().includes('slip_id') && attempt < 2) {
            continue;
          }
        }
        throw err;
      }
    }

    // Send "registration submitted" email (best-effort)
    try {
      const gamesListHtml = canonicalSelectedGames.map((g: string) => `<li>${escapeHtml(g)}</li>`).join('');
      await sendRegistrationSubmittedEmail({
        to: email,
        name,
        regNum: registrationNumber ?? '',
        slipId,
        paymentMethod,
        teamName,
        gamesList: gamesListHtml,
      });
    } catch (emailErr: any) {
      console.error('Registration submitted email failed:', emailErr?.message || emailErr);
    }

    return NextResponse.json({
      success: true,
      registrationId: id,
      registrationNumber,
      slipId,
      status,
      totalAmount: totalAmountNum,
      discount: discountNum,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create registration', details: error.message, code: error.code },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch paginated registrations (admin only; omits raw base64 screenshot_url in list payload)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/registrations', 'view');
    if (auth.error) return auth.error;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const gender = searchParams.get('gender');
    const game = searchParams.get('game');
    const search = searchParams.get('search')?.trim();
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const limit = Math.min(500, Math.max(1, Number(limitParam) || 100));
    const offset = Math.max(0, Number(offsetParam) || 0);

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
    }
    if (paymentMethod && paymentMethod !== 'all') {
      params.push(paymentMethod);
      whereClauses.push(`payment_method = $${params.length}`);
    }
    if (gender && gender !== 'all') {
      params.push(gender);
      whereClauses.push(`gender = $${params.length}`);
    }
    if (startDate) {
      params.push(startDate);
      whereClauses.push(`created_date >= $${params.length}`);
    }
    if (endDate) {
      params.push(endDate);
      whereClauses.push(`created_date <= $${params.length}`);
    }
    if (game && game !== 'all') {
      params.push(`%"${game}"%`);
      whereClauses.push(`selected_games::text ILIKE $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      whereClauses.push(
        `(name ILIKE $${idx} OR email ILIKE $${idx} OR roll_number ILIKE $${idx} OR slip_id ILIKE $${idx} OR COALESCE(team_name, '') ILIKE $${idx} OR CAST(registration_number AS TEXT) ILIKE $${idx})`
      );
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRows = (await sql(
      `SELECT COUNT(*)::int AS total FROM registrations ${whereSql}`,
      params
    )) as any[];
    const total = Number(countRows[0]?.total) || 0;

    // Also identify roll numbers appearing more than once for duplicate detection badge
    const dupRows = (await sql`
      SELECT LOWER(TRIM(roll_number)) AS rn FROM registrations
      GROUP BY LOWER(TRIM(roll_number))
      HAVING COUNT(*) > 1
    `) as any[];
    const duplicateRollSet = new Set(dupRows.map((d) => String(d.rn)));

    const listParams = [...params, limit, offset];
    const registrations = (await sql(
      `SELECT id, registration_number, email, name, roll_number, contact_number,
              alternative_contact_number, gender, team_name, selected_games, team_members,
              total_amount, discount, coupon_code, payment_method, slip_id, transaction_id,
              status, created_at, updated_at,
              (screenshot_url IS NOT NULL AND screenshot_url <> '') AS has_screenshot
       FROM registrations
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      listParams
    )) as any[];

    const parsedRegistrations = registrations.map((reg: any) => {
      let selectedGames: string[] = [];
      try {
        if (typeof reg.selected_games === 'string') {
          selectedGames = JSON.parse(reg.selected_games);
        } else if (Array.isArray(reg.selected_games)) {
          selectedGames = reg.selected_games;
        }
      } catch {
        selectedGames = [];
      }
      return {
        ...reg,
        selected_games: selectedGames,
        is_duplicate_roll: duplicateRollSet.has(String(reg.roll_number || '').trim().toLowerCase()),
      };
    });

    return NextResponse.json({
      success: true,
      data: parsedRegistrations,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Fetch registrations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Bulk status update (approve/reject pending registrations)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/registrations', 'edit');
    if (auth.error) return auth.error;
    const { session } = auth;

    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? body.ids.map((id: any) => String(id).trim()).filter(Boolean) : [];
    const targetStatus = body?.status as string;

    if (ids.length === 0 || ids.length > 100) {
      return NextResponse.json({ error: 'Provide between 1 and 100 registration IDs' }, { status: 400 });
    }
    if (!['paid', 'rejected'].includes(targetStatus)) {
      return NextResponse.json({ error: 'Bulk status must be paid or rejected' }, { status: 400 });
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const id of ids) {
      const existing = (await sql`SELECT * FROM registrations WHERE id = ${id} LIMIT 1`) as any[];
      if (existing.length === 0) {
        skippedCount++;
        continue;
      }
      const reg = existing[0];
      if (!['pending_cash', 'pending_online', 'rejected'].includes(reg.status)) {
        skippedCount++;
        continue;
      }
      if (reg.status === targetStatus) {
        skippedCount++;
        continue;
      }

      const updatedRows = (await sql`
        UPDATE registrations
        SET status = ${targetStatus}, updated_at = NOW()
        WHERE id = ${id} AND status = ${reg.status}
        RETURNING *
      `) as any[];

      if (updatedRows.length === 0) {
        skippedCount++;
        continue;
      }
      const updated = updatedRows[0];
      updatedCount++;

      if (targetStatus === 'paid') {
        const finalAmount = Math.max(0, Number(updated.total_amount) - (Number(updated.discount) || 0));
        const payMethod = updated.payment_method === 'cash' ? 'cash' : 'bank_transfer';
        await sql`
          INSERT INTO finance_records (
            id, record_type, category, amount, description,
            reference_id, reference_type, payment_method, recorded_by,
            record_date, created_at, updated_at
          ) VALUES (
            ${uuidv4()}, 'income', 'registration', ${finalAmount},
            ${'Registration #' + updated.registration_number + ' - ' + updated.name},
            ${id}, 'registration', ${payMethod}, ${session.username},
            ${new Date().toISOString().split('T')[0]}, NOW(), NOW()
          )
          ON CONFLICT (reference_id, reference_type) WHERE reference_id IS NOT NULL DO NOTHING
        `;
      }

      try {
        if (targetStatus === 'paid') {
          await sendPaymentReceivedEmail({
            to: updated.email,
            name: updated.name || 'Participant',
            regNum: updated.registration_number,
            slipId: updated.slip_id || '',
          });
        } else {
          await sendPaymentNotReceivedEmail({
            to: updated.email,
            name: updated.name || 'Participant',
            regNum: updated.registration_number,
            slipId: updated.slip_id || '',
            paymentMethod: updated.payment_method === 'online' ? 'online' : 'cash',
          });
        }
      } catch {}
    }

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'registration.bulk_status',
      targetType: 'registration',
      after: { idsCount: ids.length, targetStatus, updatedCount, skippedCount },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, updatedCount, skippedCount });
  } catch (error: any) {
    console.error('Bulk registration update error:', error);
    return NextResponse.json({ error: 'Failed to bulk update registrations', details: error.message }, { status: 500 });
  }
}
