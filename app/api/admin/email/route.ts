import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession, hasPagePermission } from '@/lib/auth';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

// Get SMTP settings from database
async function getSmtpSettings() {
  const settings = await sql`SELECT key, value FROM system_settings WHERE key LIKE 'smtp_%'`;
  const settingsMap: Record<string, string> = {};
  (settings as any[]).forEach((s: any) => {
    settingsMap[s.key] = s.value;
  });
  return settingsMap;
}

// Create nodemailer transporter
async function createTransporter() {
  const settings = await getSmtpSettings();
  
  if (!settings.smtp_email || !settings.smtp_password) {
    throw new Error('SMTP settings not configured');
  }

  return nodemailer.createTransport({
    host: settings.smtp_host || 'smtp.gmail.com',
    port: parseInt(settings.smtp_port || '587'),
    secure: settings.smtp_port === '465',
    auth: {
      user: settings.smtp_email,
      pass: settings.smtp_password,
    },
  });
}

// POST - Send email
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPagePermission(session, '/admin/email', 'edit')) {
      return NextResponse.json({ error: 'Forbidden - Email edit permission required' }, { status: 403 });
    }

    const body = await request.json();
    const { to, cc, bcc, subject, html, attachments } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'to, subject, and html are required' }, { status: 400 });
    }

    const settings = await getSmtpSettings();
    const transporter = await createTransporter();

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${settings.smtp_from_name || 'FCIT Sports Society'}" <${settings.smtp_email}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    };

    if (cc) {
      mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
    }

    if (bcc) {
      mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
    }

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);

    const { logAudit, getClientIp } = await import('@/lib/audit');
    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'email.send',
      targetType: 'email',
      after: {
        recipientCount: Array.isArray(to) ? to.length : 1,
        subject,
        accepted: Array.isArray(info.accepted) ? info.accepted.length : 0,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected 
    });
  } catch (error: any) {
    console.error('Send email error:', error);
    return NextResponse.json({ 
      error: 'Failed to send email', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET - Get recipients list based on filter
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPagePermission(session, '/admin/email', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const game = searchParams.get('game');
    const gender = searchParams.get('gender');

    const conditions: string[] = [];
    const params: any[] = [];

    if (filter === 'paid') {
      conditions.push(`status = 'paid'`);
    } else if (filter === 'pending') {
      conditions.push(`status IN ('pending_cash', 'pending_online')`);
    }

    if (gender && gender !== 'all') {
      params.push(gender);
      conditions.push(`LOWER(gender) = LOWER($${params.length})`);
    }

    if (game && game !== 'all') {
      params.push(`%"${game}"%`);
      conditions.push(`selected_games::text ILIKE $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const recipients = await sql(
      `SELECT DISTINCT email, name, gender, status, registration_number, team_name FROM registrations ${whereClause} ORDER BY name ASC`,
      params
    );

    const smtp = await getSmtpSettings();
    const smtpConfigured = Boolean(smtp.smtp_email && smtp.smtp_password);

    return NextResponse.json({
      success: true,
      data: recipients,
      smtpConfigured,
      smtpEmail: smtp.smtp_email || null,
    });
  } catch (error: any) {
    console.error('Get recipients error:', error);
    return NextResponse.json({ error: 'Failed to get recipients', details: error.message }, { status: 500 });
  }
}
