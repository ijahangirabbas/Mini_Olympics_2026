/**
 * Idempotent migration & backfill script for Audit Phases 7-9:
 * - Normalized `games` table & `games_pricing` links (`game_id`, `is_active`, `coupon_eligible`, `currency`)
 * - `registration_items` price snapshot backfill
 * - `permissions` explicit backfill for existing legacy role accounts
 * - `coordinator_game_assignments` & `coordinator_player_assignments` schema & backfill
 * - `coordinator_matches` scheduling & pairing metadata columns
 * - `audit_logs` & performance/uniqueness indexes
 *
 * Usage: node scripts/migrate-audit-phases-7-9.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');

function loadEnv() {
  for (const envFile of ['.env.local', '.env']) {
    const full = path.join(__dirname, '..', envFile);
    if (!fs.existsSync(full)) continue;
    const raw = fs.readFileSync(full, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

function toSlug(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const LEGACY_ROLE_PERMS = {
  hoc: ['/admin/hoc', '/admin/registrations'],
  finance_admin: ['/admin/finance', '/admin/registrations'],
  inventory_admin: ['/admin/inventory'],
  coordinator: ['/admin/coordinator'],
};

async function main() {
  loadEnv();
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing in environment');
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log('1/5 Applying schema additions & indexes...');
  await sql`
    CREATE TABLE IF NOT EXISTS games (
      id VARCHAR(120) PRIMARY KEY,
      name VARCHAR(150) NOT NULL UNIQUE,
      category VARCHAR(80),
      is_active BOOLEAN NOT NULL DEFAULT true,
      coupon_eligible BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS category VARCHAR(50)`;
  await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS game_id VARCHAR(120)`;
  await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`;
  await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS coupon_eligible BOOLEAN NOT NULL DEFAULT true`;
  await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'PKR'`;
  await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;

  await sql`
    CREATE TABLE IF NOT EXISTS registration_items (
      id TEXT PRIMARY KEY,
      registration_id TEXT NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
      game_id VARCHAR(120),
      game_name VARCHAR(150) NOT NULL,
      gender VARCHAR(10) NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
      players_count INTEGER,
      team_members_json TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      actor_username TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      before_json TEXT,
      after_json TEXT,
      ip_address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS coordinator_game_assignments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      game_id VARCHAR(120) NOT NULL,
      game_name VARCHAR(150) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, game_name)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS coordinator_player_assignments (
      id TEXT PRIMARY KEY,
      coordinator_user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      registration_id TEXT NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
      game_id VARCHAR(120),
      game_name VARCHAR(150),
      assigned_by TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(coordinator_user_id, registration_id, game_name)
    )
  `;

  await sql`ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS impersonated_by TEXT`;
  await sql`ALTER TABLE coordinator_matches ADD COLUMN IF NOT EXISTS game_id VARCHAR(120)`;
  await sql`ALTER TABLE coordinator_matches ADD COLUMN IF NOT EXISTS scheduled_start_at TIMESTAMPTZ`;
  await sql`ALTER TABLE coordinator_matches ADD COLUMN IF NOT EXISTS scheduled_end_at TIMESTAMPTZ`;
  await sql`ALTER TABLE coordinator_matches ADD COLUMN IF NOT EXISTS pair_reason TEXT`;
  await sql`ALTER TABLE coordinator_matches ADD COLUMN IF NOT EXISTS assignment_scope TEXT DEFAULT 'manual'`;
  await sql`ALTER TABLE coordinator_matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_team_name_unique ON registrations (LOWER(team_name)) WHERE team_name IS NOT NULL AND team_name <> ''`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_reference_unique ON finance_records (reference_id, reference_type) WHERE reference_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS idx_registrations_roll_number ON registrations (LOWER(roll_number))`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC)`;

  console.log('2/5 Backfilling canonical games & games_pricing.game_id...');
  const gpRows = await sql`SELECT DISTINCT ON (game_name) game_name, category FROM games_pricing`;
  for (const r of gpRows) {
    const slug = toSlug(r.game_name);
    if (!slug) continue;
    const eligible = !['swimming', 'swimming sprint'].includes(String(r.game_name).toLowerCase());
    await sql`
      INSERT INTO games (id, name, category, is_active, coupon_eligible, created_at, updated_at)
      VALUES (${slug}, ${r.game_name}, ${r.category || null}, true, ${eligible}, NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
    `;
    await sql`
      UPDATE games_pricing
      SET game_id = g.id,
          coupon_eligible = ${eligible}
      FROM games g
      WHERE games_pricing.game_name = g.name AND (games_pricing.game_id IS NULL OR games_pricing.game_id = '')
    `;
  }

  console.log('3/5 Backfilling registration_items snapshots...');
  const regs = await sql`
    SELECT r.id, r.gender, r.selected_games, r.team_members
    FROM registrations r
    WHERE NOT EXISTS (SELECT 1 FROM registration_items ri WHERE ri.registration_id = r.id)
  `;
  const gpAll = await sql`SELECT game_id, game_name, gender, price, players, currency FROM games_pricing`;
  const gpMap = new Map();
  for (const row of gpAll) {
    gpMap.set(`${row.gender}::${String(row.game_name).toLowerCase()}`, row);
  }
  let itemCount = 0;
  for (const reg of regs) {
    let selected = [];
    try {
      selected = typeof reg.selected_games === 'string' ? JSON.parse(reg.selected_games) : reg.selected_games || [];
    } catch {}
    let members = {};
    try {
      members = reg.team_members ? (typeof reg.team_members === 'string' ? JSON.parse(reg.team_members) : reg.team_members) : {};
    } catch {}
    for (const gameName of selected) {
      const gp = gpMap.get(`${reg.gender}::${String(gameName).toLowerCase()}`);
      const mJson = members && members[gameName] ? JSON.stringify(members[gameName]) : null;
      await sql`
        INSERT INTO registration_items (id, registration_id, game_id, game_name, gender, unit_price, currency, players_count, team_members_json, created_at)
        VALUES (
          ${crypto.randomUUID()},
          ${reg.id},
          ${gp?.game_id || toSlug(gameName)},
          ${gameName},
          ${reg.gender},
          ${gp ? Number(gp.price) : 0},
          ${gp?.currency || 'PKR'},
          ${gp?.players ? Number(gp.players) : 1},
          ${mJson},
          NOW()
        )
      `;
      itemCount++;
    }
  }
  console.log(`   Inserted ${itemCount} registration_items rows.`);

  console.log('4/5 Backfilling explicit permissions for legacy accounts...');
  const staff = await sql`SELECT id, username, role, assigned_games FROM admin_users`;
  let permSeeded = 0;
  let coordGameSeeded = 0;
  for (const u of staff) {
    const role = String(u.role || 'sub_admin').toLowerCase();
    const pages = LEGACY_ROLE_PERMS[role];
    if (pages && pages.length > 0) {
      const existing = await sql`SELECT COUNT(*)::int AS cnt FROM permissions WHERE user_id = ${u.id}`;
      if (Number(existing[0]?.cnt || 0) === 0) {
        for (const pageKey of pages) {
          await sql`
            INSERT INTO permissions (id, user_id, page_key, can_view, can_edit, can_delegate, granted_by, created_at, updated_at)
            VALUES (${crypto.randomUUID()}, ${u.id}, ${pageKey}, true, true, false, 'migration_backfill', NOW(), NOW())
            ON CONFLICT (user_id, page_key) DO NOTHING
          `;
          permSeeded++;
        }
      }
    }

    let ag = [];
    try {
      ag = typeof u.assigned_games === 'string' ? JSON.parse(u.assigned_games) : Array.isArray(u.assigned_games) ? u.assigned_games : [];
    } catch {}
    for (const gameName of ag) {
      if (!gameName) continue;
      await sql`
        INSERT INTO coordinator_game_assignments (id, user_id, game_id, game_name, created_at)
        VALUES (${crypto.randomUUID()}, ${u.id}, ${toSlug(gameName)}, ${gameName}, NOW())
        ON CONFLICT (user_id, game_name) DO NOTHING
      `;
      coordGameSeeded++;
    }
  }
  console.log(`   Seeded ${permSeeded} explicit permissions and ${coordGameSeeded} coordinator game assignments.`);
  console.log('5/5 Done.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
