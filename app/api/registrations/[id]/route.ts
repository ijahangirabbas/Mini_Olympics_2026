import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdminPermission } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { sendPaymentReceivedEmail, sendPaymentNotReceivedEmail } from '@/lib/email';
import { logAudit, getClientIp } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending_cash: ['paid', 'rejected'],
  pending_online: ['paid', 'rejected'],
  rejected: ['paid', 'pending_cash', 'pending_online'],
  paid: ['refunded'],
  refunded: [],
};

// GET - Get single registration (includes full screenshot_url + registration_items snapshot)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminPermission('/admin/registrations', 'view');
    if (auth.error) return auth.error;

    const result = (await sql`SELECT * FROM registrations WHERE id = ${params.id}`) as any[];
    const registration = result[0] || null;

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    let items: any[] = [];
    try {
      items = (await sql`
        SELECT id, game_id, game_name, gender, unit_price, currency, players_count, created_at
        FROM registration_items
        WHERE registration_id = ${params.id}
        ORDER BY created_at ASC
      `) as any[];
    } catch {
      items = [];
    }

    return NextResponse.json({ success: true, data: { ...registration, items } });
  } catch (error: any) {
    console.error('Get registration error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update registration status / discount with strict state machine & finance sync
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminPermission('/admin/registrations', 'edit');
    if (auth.error) return auth.error;
    const { session } = auth;

    const body = await request.json();
    const { status, discount } = body;

    if (status === undefined && discount === undefined) {
      return NextResponse.json(
        { error: 'At least one field (status or discount) is required' },
        { status: 400 }
      );
    }

    const currentResult = (await sql`SELECT * FROM registrations WHERE id = ${params.id}`) as any[];
    if (!currentResult || currentResult.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }
    const currentReg = currentResult[0];

    if (status !== undefined) {
      const validStatuses = ['pending_cash', 'pending_online', 'paid', 'rejected', 'refunded'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
      if (status !== currentReg.status && !ALLOWED_TRANSITIONS[currentReg.status]?.includes(status)) {
        return NextResponse.json(
          { error: `Illegal status transition from '${currentReg.status}' to '${status}'` },
          { status: 409 }
        );
      }
    }

    let discountValue: number | null = null;
    if (discount !== undefined && discount !== null) {
      if (currentReg.status === 'paid' || currentReg.status === 'refunded') {
        return NextResponse.json(
          { error: 'Cannot change discount after registration has been paid or refunded' },
          { status: 409 }
        );
      }
      discountValue = Number(discount);
      if (isNaN(discountValue) || discountValue < 0 || discountValue > Number(currentReg.total_amount || 0)) {
        return NextResponse.json(
          { error: 'Discount must be between 0 and the total registration amount.' },
          { status: 400 }
        );
      }
    }

    const nextStatus = status !== undefined ? status : currentReg.status;
    const nextDiscount = discountValue !== null ? discountValue : currentReg.discount;

    const updatedRows = (await sql`
      UPDATE registrations
      SET status = ${nextStatus},
          discount = ${nextDiscount},
          updated_at = NOW()
      WHERE id = ${params.id} AND status = ${currentReg.status}
      RETURNING *
    `) as any[];

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        { error: 'Registration was modified concurrently; please refresh and retry.' },
        { status: 409 }
      );
    }
    const updated = updatedRows[0];

    // Idempotent finance record creation when moving into 'paid'
    if (nextStatus === 'paid' && currentReg.status !== 'paid') {
      const finalAmount = Math.max(0, Number(updated.total_amount) - (Number(updated.discount) || 0));
      const paymentMethod = updated.payment_method === 'cash' ? 'cash' : 'bank_transfer';
      await sql`
        INSERT INTO finance_records (
          id, record_type, category, amount, description,
          reference_id, reference_type, payment_method, recorded_by,
          record_date, created_at, updated_at
        ) VALUES (
          ${uuidv4()}, 'income', 'registration', ${finalAmount},
          ${'Registration #' + updated.registration_number + ' - ' + updated.name},
          ${params.id}, 'registration', ${paymentMethod}, ${session.username},
          ${new Date().toISOString().split('T')[0]}, NOW(), NOW()
        )
        ON CONFLICT (reference_id, reference_type) WHERE reference_id IS NOT NULL DO NOTHING
      `;
    }

    // Compensating expense entry when transitioning paid -> refunded
    if (nextStatus === 'refunded' && currentReg.status === 'paid') {
      const refundAmount = Math.max(0, Number(updated.total_amount) - (Number(updated.discount) || 0));
      const paymentMethod = updated.payment_method === 'cash' ? 'cash' : 'bank_transfer';
      await sql`
        INSERT INTO finance_records (
          id, record_type, category, amount, description,
          reference_id, reference_type, payment_method, recorded_by,
          record_date, created_at, updated_at
        ) VALUES (
          ${uuidv4()}, 'expense', 'refund', ${refundAmount},
          ${'Refund for Registration #' + updated.registration_number + ' - ' + updated.name},
          ${params.id}, 'registration_refund', ${paymentMethod}, ${session.username},
          ${new Date().toISOString().split('T')[0]}, NOW(), NOW()
        )
        ON CONFLICT (reference_id, reference_type) WHERE reference_id IS NOT NULL DO NOTHING
      `;
    }

    let emailSent = false;
    let emailWarning: string | null = null;
    if ((status === 'paid' || status === 'rejected') && status !== currentReg.status) {
      try {
        if (status === 'paid') {
          let gamesArr: string[] = [];
          try {
            gamesArr = Array.isArray(updated.selected_games)
              ? updated.selected_games
              : JSON.parse(String(updated.selected_games || '[]'));
          } catch {
            gamesArr = [];
          }
          const gamesListHtml =
            gamesArr.length > 0
              ? gamesArr.map((g) => `<li>${String(g)}</li>`).join('')
              : '<li>Mini Olympics 2026 Event</li>';

          await sendPaymentReceivedEmail({
            to: updated.email,
            name: updated.name || 'Participant',
            regNum: updated.registration_number,
            slipId: updated.slip_id || '',
            teamName: updated.team_name || updated.name || 'Individual',
            gamesList: gamesListHtml,
          });
          emailSent = true;
        } else {
          await sendPaymentNotReceivedEmail({
            to: updated.email,
            name: updated.name || 'Participant',
            regNum: updated.registration_number,
            slipId: updated.slip_id || '',
            paymentMethod: updated.payment_method === 'online' ? 'online' : 'cash',
          });
          emailSent = true;
        }
      } catch (emailErr: any) {
        emailWarning = emailErr?.message || 'Email delivery failed';
        console.error('Payment status email failed:', emailWarning);
      }
    }

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'registration.update',
      targetType: 'registration',
      targetId: params.id,
      before: { status: currentReg.status, discount: currentReg.discount },
      after: { status: updated.status, discount: updated.discount },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: updated, emailSent, emailWarning });
  } catch (error: any) {
    console.error('Update registration error:', error);
    return NextResponse.json(
      { error: 'Failed to update registration', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete unpaid/rejected registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminPermission('/admin/registrations', 'edit');
    if (auth.error) return auth.error;
    const { session } = auth;

    const currentRows = (await sql`
      SELECT id, registration_number, name, status FROM registrations WHERE id = ${params.id} LIMIT 1
    `) as any[];
    if (currentRows.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }
    const reg = currentRows[0];
    if (reg.status === 'paid') {
      return NextResponse.json(
        { error: 'Paid registrations cannot be deleted directly; mark as refunded instead.' },
        { status: 409 }
      );
    }

    await sql`DELETE FROM registrations WHERE id = ${params.id}`;

    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'registration.delete',
      targetType: 'registration',
      targetId: params.id,
      before: { registrationNumber: reg.registration_number, name: reg.name, status: reg.status },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, message: 'Registration deleted' });
  } catch (error: any) {
    console.error('Delete registration error:', error);
    return NextResponse.json(
      { error: 'Failed to delete registration', details: error.message },
      { status: 500 }
    );
  }
}

