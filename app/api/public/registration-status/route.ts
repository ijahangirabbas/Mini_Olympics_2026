import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isEsportsWindowOpen } from '@/lib/games-sync';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Public: GET registration open status, runtime cash toggle, and esports availability window. */
export async function GET() {
  try {
    const settingsRows = (await sql`
      SELECT key, value FROM system_settings
      WHERE key IN ('registrations_open', 'cash_payment_enabled')
    `) as any[];

    const map = new Map<string, string>();
    for (const r of settingsRows) {
      map.set(String(r.key), String(r.value));
    }

    const regOpenRaw = map.get('registrations_open');
    const open = regOpenRaw !== 'false' && regOpenRaw !== '0';

    const cashRaw = map.get('cash_payment_enabled');
    const envCash =
      process.env.CASH_PAYMENT_ENABLED ?? process.env.NEXT_PUBLIC_CASH_PAYMENT_ENABLED;
    const cashPaymentEnabled =
      cashRaw !== undefined
        ? cashRaw !== 'false' && cashRaw !== '0'
        : envCash !== 'false' && envCash !== '0';

    let esports: any = { isOpen: true, effectiveIsOpen: true, openDate: null, closeDate: null, announcement: null };
    try {
      const esRows = (await sql`SELECT * FROM esports_settings WHERE id = '1' LIMIT 1`) as any[];
      if (esRows.length > 0) {
        const es = esRows[0];
        esports = {
          isOpen: Boolean(es.is_open),
          effectiveIsOpen: isEsportsWindowOpen(es),
          openDate: es.open_date || null,
          closeDate: es.close_date || null,
          announcement: es.announcement || null,
        };
      }
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      open: !!open,
      cashPaymentEnabled,
      esports,
    });
  } catch {
    return NextResponse.json({
      success: true,
      open: true,
      cashPaymentEnabled: true,
      esports: { isOpen: true, effectiveIsOpen: true, openDate: null, closeDate: null, announcement: null },
    });
  }
}
