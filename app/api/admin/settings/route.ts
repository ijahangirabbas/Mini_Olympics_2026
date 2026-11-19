import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession, hasPagePermission } from '@/lib/auth';
import { logAudit, getClientIp } from '@/lib/audit';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const SECRET_MASK = '********';
function isSecretSettingKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.includes('password') ||
    lower.includes('secret') ||
    lower.includes('api_key') ||
    lower.includes('token')
  );
}

// GET - Fetch settings
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPagePermission(session, '/admin/settings', 'view')) {
      return NextResponse.json({ error: 'Forbidden - Settings permission required' }, { status: 403 });
    }

    const settings = await sql`SELECT key, value FROM system_settings`;
    
    const settingsMap: Record<string, string> = {};
    (settings as any[]).forEach((s: any) => {
      if (isSecretSettingKey(String(s.key))) {
        settingsMap[s.key] = s.value ? SECRET_MASK : '';
      } else {
        settingsMap[s.key] = s.value;
      }
    });

    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error: any) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings', details: error.message }, { status: 500 });
  }
}

// POST - Update settings
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPagePermission(session, '/admin/settings', 'edit')) {
      return NextResponse.json({ error: 'Forbidden - Settings edit permission required' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // Remove deprecated OpenAI key if ever sent, or skip unchanged masked secret values
    if (key === 'openai_api_key') {
      return NextResponse.json({ error: 'Deprecated AI setting removed' }, { status: 400 });
    }
    if (isSecretSettingKey(key) && value === SECRET_MASK) {
      return NextResponse.json({ success: true, skippedMask: true });
    }

    const nextVal = value !== undefined && value !== null ? String(value) : '';

    await sql`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (${key}, ${nextVal}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${nextVal}, updated_at = NOW()
    `;

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'settings.update',
      targetType: 'system_setting',
      targetId: key,
      after: { key, value: isSecretSettingKey(key) ? SECRET_MASK : nextVal },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings', details: error.message }, { status: 500 });
  }
}
