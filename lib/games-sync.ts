import { sql } from '@/lib/db';

let gamesSchemaEnsured = false;

export function toGameSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function ensureGamesSchema(): Promise<void> {
  if (gamesSchemaEnsured) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(120) PRIMARY KEY,
        slug VARCHAR(120) UNIQUE,
        name VARCHAR(150) NOT NULL UNIQUE,
        category VARCHAR(80),
        is_active BOOLEAN NOT NULL DEFAULT true,
        coupon_eligible BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    try {
      await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS slug VARCHAR(120)`;
      await sql`ALTER TABLE games ALTER COLUMN slug DROP NOT NULL`;
    } catch {}

    await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS category VARCHAR(50)`;
    await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS game_id VARCHAR(120)`;
    await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`;
    await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS coupon_eligible BOOLEAN NOT NULL DEFAULT true`;
    await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'PKR'`;
    await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;

    // Backfill parent games rows and link game_id for any existing games_pricing rows missing game_id
    const distinctRows = (await sql`
      SELECT DISTINCT ON (game_name) game_name, category
      FROM games_pricing
      WHERE game_id IS NULL OR game_id = ''
    `) as any[];

    for (const row of distinctRows) {
      const slug = toGameSlug(String(row.game_name));
      if (!slug) continue;
      const couponEligible = String(row.game_name).toLowerCase() !== 'swimming sprint' && String(row.game_name).toLowerCase() !== 'swimming';
      await sql`
        INSERT INTO games (id, slug, name, category, is_active, coupon_eligible, created_at, updated_at)
        VALUES (${slug}, ${slug}, ${row.game_name}, ${row.category || null}, true, ${couponEligible}, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET
          slug = COALESCE(games.slug, EXCLUDED.slug),
          category = COALESCE(games.category, EXCLUDED.category)
      `;
      await sql`
        UPDATE games_pricing
        SET game_id = g.id,
            coupon_eligible = COALESCE(games_pricing.coupon_eligible, ${couponEligible}),
            updated_at = COALESCE(updated_at, NOW())
        FROM games g
        WHERE games_pricing.game_name = g.name
          AND (games_pricing.game_id IS NULL OR games_pricing.game_id = '')
      `;
    }

    gamesSchemaEnsured = true;
  } catch (err) {
    console.warn('ensureGamesSchema warning:', err);
  }
}

export function isEsportsWindowOpen(settings: {
  is_open?: boolean | null;
  open_date?: string | Date | null;
  close_date?: string | Date | null;
} | null): boolean {
  if (!settings) return true;
  if (settings.is_open === false) return false;
  const now = Date.now();
  if (settings.open_date) {
    const openMs = new Date(settings.open_date).getTime();
    if (!Number.isNaN(openMs) && now < openMs) return false;
  }
  if (settings.close_date) {
    const closeMs = new Date(settings.close_date).getTime();
    if (!Number.isNaN(closeMs) && now > closeMs) return false;
  }
  return true;
}
