import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession, hasPagePermission } from '@/lib/auth';
import { isEsportsWindowOpen } from '@/lib/games-sync';
import { logAudit, getClientIp } from '@/lib/audit';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET - Get esports settings
export async function GET(request: NextRequest) {
  try {
    let result = await sql`SELECT * FROM esports_settings WHERE id = '1'` as any[];
    let settings = result[0] || null;

    if (!settings) {
      await sql`
        INSERT INTO esports_settings (id, is_open, announcement)
        VALUES ('1', true, '')
      `;
      result = await sql`SELECT * FROM esports_settings WHERE id = '1'` as any[];
      settings = result[0] || null;
    }

    return NextResponse.json({
      success: true,
      data: settings
        ? { ...settings, effective_is_open: isEsportsWindowOpen(settings) }
        : null,
    });
  } catch (error: any) {
    console.error('Get esports settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch esports settings', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update esports settings
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPagePermission(session, '/admin/esports', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { isOpen, openDate, closeDate, announcement } = body;

    if (openDate && closeDate && new Date(openDate).getTime() > new Date(closeDate).getTime()) {
      return NextResponse.json({ error: 'Open date cannot be after close date' }, { status: 400 });
    }

    await sql`
      UPDATE esports_settings
      SET 
        is_open = ${isOpen ?? true},
        open_date = ${openDate || null},
        close_date = ${closeDate || null},
        announcement = ${announcement || null},
        updated_at = NOW()
      WHERE id = '1'
    `;

    const result = await sql`SELECT * FROM esports_settings WHERE id = '1'` as any[];
    const updated = result[0] || null;

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'esports.update',
      targetType: 'esports_settings',
      targetId: '1',
      after: { isOpen, openDate, closeDate, announcement },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      data: updated ? { ...updated, effective_is_open: isEsportsWindowOpen(updated) } : null,
    });
  } catch (error: any) {
    console.error('Update esports settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update esports settings', details: error.message },
      { status: 500 }
    );
  }
}

