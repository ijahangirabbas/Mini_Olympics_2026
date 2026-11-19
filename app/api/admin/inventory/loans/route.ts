import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession, hasPagePermission } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET - Fetch all loans
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPagePermission(session, '/admin/inventory', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const itemId = searchParams.get('itemId');

    let query = `
      SELECT l.*, i.name as item_name, i.category as item_category
      FROM inventory_loans l
      JOIN inventory_items i ON l.item_id = i.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      params.push(status);
      conditions.push(`l.status = $${params.length}`);
    }
    if (itemId) {
      params.push(itemId);
      conditions.push(`l.item_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY l.created_at DESC';

    const loans = await sql(query, params);

    return NextResponse.json({ success: true, data: loans });
  } catch (error: any) {
    console.error('Fetch loans error:', error);
    return NextResponse.json({ error: 'Failed to fetch loans', details: error.message }, { status: 500 });
  }
}

// POST - Create a new loan
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPagePermission(session, '/admin/inventory', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { itemId, borrowerName, borrowerRoll, borrowerPhone, quantity, expectedReturnDate, notes } = body;

    if (!itemId || !borrowerName || !borrowerPhone) {
      return NextResponse.json({ error: 'Item ID, borrower name, and phone are required' }, { status: 400 });
    }

    const loanQty = Number(quantity) || 1;
    if (!Number.isInteger(loanQty) || loanQty <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive integer' }, { status: 400 });
    }

    const item = await sql`SELECT quantity FROM inventory_items WHERE id = ${itemId}`;
    if ((item as any[]).length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const id = uuidv4();

    // Atomically check stock (counting active + overdue unreturned loans) and insert
    const inserted = (await sql`
      WITH stock AS (
        SELECT
          i.quantity AS total_qty,
          COALESCE(SUM(l.quantity) FILTER (WHERE l.status IN ('active', 'overdue')), 0) AS loaned_qty
        FROM inventory_items i
        LEFT JOIN inventory_loans l ON l.item_id = i.id
        WHERE i.id = ${itemId}
        GROUP BY i.id, i.quantity
      )
      INSERT INTO inventory_loans (
        id, item_id, borrower_name, borrower_roll, borrower_phone,
        quantity, expected_return_date, notes, loaned_by, created_at, updated_at
      )
      SELECT
        ${id}, ${itemId}, ${borrowerName}, ${borrowerRoll || null}, ${borrowerPhone},
        ${loanQty}, ${expectedReturnDate || null}, ${notes || null}, ${session.username}, NOW(), NOW()
      FROM stock
      WHERE (stock.total_qty - stock.loaned_qty) >= ${loanQty}
      RETURNING id, (SELECT total_qty - loaned_qty FROM stock) AS available_before
    `) as any[];

    if (!inserted || inserted.length === 0) {
      const loanedResult = await sql`SELECT COALESCE(SUM(quantity), 0) as loaned FROM inventory_loans WHERE item_id = ${itemId} AND status IN ('active', 'overdue')`;
      const availableQty = Number((item as any[])[0].quantity) - (Number((loanedResult as any[])[0]?.loaned) || 0);
      return NextResponse.json({ error: `Insufficient stock. Available: ${Math.max(0, availableQty)}` }, { status: 400 });
    }

    const availableBefore = Number(inserted[0].available_before);

    await sql`
      INSERT INTO inventory_movements (id, item_id, movement_type, quantity, previous_quantity, new_quantity, reason, performed_by, created_at)
      VALUES (${uuidv4()}, ${itemId}, 'loan', ${loanQty}, ${availableBefore}, ${availableBefore - loanQty}, ${'Loaned to ' + borrowerName}, ${session.username}, NOW())
    `;

    const { logAudit, getClientIp } = await import('@/lib/audit');
    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: 'inventory.loan.create',
      targetType: 'inventory_loan',
      targetId: id,
      after: { itemId, borrowerName, quantity: loanQty },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Create loan error:', error);
    return NextResponse.json({ error: 'Failed to create loan', details: error.message }, { status: 500 });
  }
}

// PUT - Return, mark overdue, or mark lost on a loan
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    const session = await getAdminSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPagePermission(session, '/admin/inventory', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status: newStatus, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Loan ID is required' }, { status: 400 });
    }

    const targetStatus = (newStatus || 'returned') as string;
    const allowedTargets = new Set(['returned', 'lost', 'overdue']);
    if (!allowedTargets.has(targetStatus)) {
      return NextResponse.json({ error: 'Invalid loan status transition target' }, { status: 400 });
    }

    const loan = await sql`SELECT * FROM inventory_loans WHERE id = ${id}`;
    if ((loan as any[]).length === 0) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    const loanData = (loan as any[])[0];

    // Enforce loan state machine: active -> returned | lost | overdue; overdue -> returned | lost
    const allowedFrom: Record<string, string[]> = {
      active: ['returned', 'lost', 'overdue'],
      overdue: ['returned', 'lost'],
    };
    if (!allowedFrom[loanData.status]?.includes(targetStatus)) {
      return NextResponse.json(
        { error: `Cannot transition loan from '${loanData.status}' to '${targetStatus}'` },
        { status: 409 }
      );
    }

    const returnAtIso = targetStatus === 'returned' ? new Date().toISOString() : null;
    const returnedTo = targetStatus === 'returned' ? session.username : null;

    // Atomically update loan and decrement item stock if marked lost
    const result = (await sql`
      WITH updated AS (
        UPDATE inventory_loans
        SET status = ${targetStatus},
            actual_return_date = ${returnAtIso}::timestamp,
            returned_to = ${returnedTo},
            notes = COALESCE(${notes ?? null}, notes),
            updated_at = NOW()
        WHERE id = ${id} AND status = ${loanData.status}
        RETURNING *
      ),
      lost_item AS (
        UPDATE inventory_items
        SET quantity = GREATEST(0, quantity - (SELECT quantity FROM updated)),
            updated_at = NOW()
        WHERE id = (SELECT item_id FROM updated) AND ${targetStatus} = 'lost'
        RETURNING id, quantity
      )
      SELECT updated.*, lost_item.quantity AS remaining_quantity
      FROM updated
      LEFT JOIN lost_item ON true
    `) as any[];

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Loan state changed concurrently; please refresh' }, { status: 409 });
    }

    if (targetStatus === 'returned' || targetStatus === 'lost') {
      await sql`
        INSERT INTO inventory_movements (id, item_id, movement_type, quantity, previous_quantity, new_quantity, reason, performed_by, created_at)
        VALUES (
          ${uuidv4()},
          ${loanData.item_id},
          ${targetStatus === 'returned' ? 'return' : 'adjust'},
          ${loanData.quantity},
          0,
          ${result[0].remaining_quantity ?? 0},
          ${targetStatus === 'returned' ? 'Returned by ' + loanData.borrower_name : 'Marked lost (borrower: ' + loanData.borrower_name + ')'},
          ${session.username},
          NOW()
        )
      `;
    }

    const { logAudit, getClientIp } = await import('@/lib/audit');
    await logAudit({
      actorUserId: session.adminUserId,
      actorUsername: session.username,
      action: `inventory.loan.${targetStatus}`,
      targetType: 'inventory_loan',
      targetId: id,
      before: { status: loanData.status },
      after: { status: targetStatus, notes },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update loan error:', error);
    return NextResponse.json({ error: 'Failed to update loan', details: error.message }, { status: 500 });
  }
}
