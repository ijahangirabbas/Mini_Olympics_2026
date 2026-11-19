import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdminPermission } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET - Lookup registration for cash/slip verification (authenticated staff only)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission('/admin/registrations', 'view');
    if (auth.error) return auth.error;

    const ip = getClientIp(request);
    const rl = checkRateLimit(`verify-lookup:${auth.session.adminUserId || ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many verification lookups. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const regNumRaw = searchParams.get('regNum')?.trim() || '';
    const slipIdRaw = searchParams.get('slipId')?.trim() || '';

    if (!regNumRaw && !slipIdRaw) {
      return NextResponse.json(
        { error: 'Registration number or slip ID is required' },
        { status: 400 }
      );
    }

    let rows: any[] = [];
    if (regNumRaw) {
      const regNum = Number(regNumRaw);
      if (!Number.isInteger(regNum) || regNum <= 0) {
        return NextResponse.json({ error: 'Invalid registration number' }, { status: 400 });
      }
      rows = (await sql`
        SELECT id, registration_number, email, name, roll_number, contact_number,
               alternative_contact_number, gender, selected_games, team_name, team_members,
               total_amount, discount, coupon_code, payment_method, slip_id, status, created_at
        FROM registrations
        WHERE registration_number = ${regNum}
        LIMIT 1
      `) as any[];
    } else {
      rows = (await sql`
        SELECT id, registration_number, email, name, roll_number, contact_number,
               alternative_contact_number, gender, selected_games, team_name, team_members,
               total_amount, discount, coupon_code, payment_method, slip_id, status, created_at
        FROM registrations
        WHERE LOWER(slip_id) = LOWER(${slipIdRaw})
        LIMIT 1
      `) as any[];
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const reg = rows[0];
    return NextResponse.json({
      success: true,
      data: {
        ...reg,
        selected_games:
          typeof reg.selected_games === 'string'
            ? (() => { try { return JSON.parse(reg.selected_games); } catch { return []; } })()
            : reg.selected_games || [],
      },
    });
  } catch (error: any) {
    console.error('Verify registration GET error:', error);
    return NextResponse.json(
      { error: 'Failed to look up registration', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Verify team name uniqueness
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`team-verify:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const { teamName } = body;

    if (!teamName || typeof teamName !== 'string' || teamName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const existingTeam = await sql`
      SELECT id, team_name FROM registrations 
      WHERE LOWER(team_name) = LOWER(${teamName.trim()})
      LIMIT 1
    ` as any[];

    if (existingTeam && existingTeam.length > 0) {
      return NextResponse.json({
        success: true,
        isUnique: false,
        message: 'This team name is already taken. Please choose a different name.',
      });
    }

    return NextResponse.json({
      success: true,
      isUnique: true,
      message: 'Team name is available!',
    });
  } catch (error: any) {
    console.error('Team name verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify team name', details: error.message },
      { status: 500 }
    );
  }
}
