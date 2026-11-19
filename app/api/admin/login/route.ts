import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { ensureAuthAndPermissionsSchema, normalizeRole, resolveUserPermissions } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp, logAudit } from '@/lib/audit';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const runtime = 'nodejs';

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString('base64')}:${derivedKey.toString('base64')}`;
}

function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (password === '' || stored === null || stored === undefined || typeof stored !== 'string') {
    return false;
  }
  if (!stored.startsWith('scrypt:')) {
    return false;
  }

  const parts = stored.split(':');
  if (parts.length !== 3) return false;
  const salt = Buffer.from(parts[1], 'base64');
  const expected = Buffer.from(parts[2], 'base64');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`admin_login:${ip}`, 15, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Retry in ${rl.retryAfterSec}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const rawUsername = body?.username;
    const rawPassword = body?.password;
    const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';
    const password = typeof rawPassword === 'string' ? rawPassword.trim() : '';

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const sessionsTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'admin_sessions'
      ) AS exists
    `;
    const sessionsTableExists = Boolean((sessionsTableCheck as any)[0]?.exists);
    if (!sessionsTableExists) {
      return NextResponse.json(
        {
          error: 'Database is not initialized (admin_sessions table is missing).',
          fix: 'Run DB migration against the same DATABASE_URL used in production.',
        },
        { status: 500 }
      );
    }

    const adminUsersTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'admin_users'
      ) AS exists
    `;
    const adminUsersTableExists = Boolean((adminUsersTableCheck as any)[0]?.exists);

    if (adminUsersTableExists) {
      const countRes = await sql`SELECT COUNT(*)::int AS count FROM admin_users`;
      const count = Number((countRes as any)[0]?.count) || 0;

      // Only use env to create the very first admin when table is empty. Once users exist, only DB is used — env never overwrites DB (fixes production reverting after 1–2 days).
      if (count === 0) {
        const adminUsername = (process.env.ADMIN_USERNAME ?? '').trim();
        const adminPassword = (process.env.ADMIN_PASSWORD ?? '').trim();
        const hasEnv = adminUsername !== '' && adminPassword !== '';
        const envMatch = hasEnv && username === adminUsername && password === adminPassword;
        if (envMatch) {
          await sql`
            INSERT INTO admin_users (id, username, display_name, password_hash, role, is_active)
            VALUES (${uuidv4()}, ${adminUsername}, 'Super Admin', ${hashPassword(adminPassword)}, 'super_admin', true)
          `;
        } else {
          return NextResponse.json(
            { error: 'No admin users yet. Create one: node scripts/create-admin-node.js admin YourPassword' },
            { status: 500 }
          );
        }
      }

      const userRes = await sql`SELECT * FROM admin_users WHERE username = ${username} LIMIT 1`;
      const user = (userRes as any)[0] || null;
      const storedPassword = user?.password_hash ?? user?.password;

      const accepted = user && verifyPassword(password, storedPassword);
      if (!accepted) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      if (user?.is_active === false) {
        return NextResponse.json({ error: 'Account is deactivated. Contact Super Admin.' }, { status: 403 });
      }
    } else {
      const adminUsername = (process.env.ADMIN_USERNAME ?? '').trim();
      const adminPassword = (process.env.ADMIN_PASSWORD ?? '').trim();
      if (!adminUsername || !adminPassword) {
        return NextResponse.json(
          { error: 'Admin users table missing. Set ADMIN_USERNAME and ADMIN_PASSWORD in production env, or run DB migration.' },
          { status: 500 }
        );
      }
      if (username !== adminUsername || password !== adminPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    // Prune expired sessions opportunistically
    try {
      await sql`DELETE FROM admin_sessions WHERE expires_at <= NOW()`;
    } catch {}

    // Create session token
    const sessionToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    let userRole = adminUsersTableExists ? 'sub_admin' : 'super_admin';
    let userId: string | null = null;
    try {
      if (adminUsersTableExists) {
        const userRow = await sql`SELECT id, role FROM admin_users WHERE username = ${username} LIMIT 1`;
        userId = (userRow as any)[0]?.id || null;
        userRole = (userRow as any)[0]?.role || 'sub_admin';
      }
      await sql`
        INSERT INTO admin_sessions (id, session_token, expires_at, admin_user_id, role)
        VALUES (${uuidv4()}, ${sessionToken}, ${expiresAt.toISOString()}, ${userId}, ${userRole})
      `;
    } catch {
      await sql`
        INSERT INTO admin_sessions (id, session_token, expires_at)
        VALUES (${uuidv4()}, ${sessionToken}, ${expiresAt.toISOString()})
      `;
    }

    try {
      await ensureAuthAndPermissionsSchema();
    } catch {}

    const normalizedRole = normalizeRole(userRole);
    const { defaultPage } = await resolveUserPermissions(userId, normalizedRole);
    const redirectTo = defaultPage || '/admin/dashboard';

    await logAudit({
      actorUserId: userId,
      actorUsername: username,
      action: 'auth.login',
      targetType: 'admin_session',
      targetId: userId,
      after: { role: normalizedRole },
      ip,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      role: normalizedRole,
      redirectTo,
    });

    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return response;

  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

