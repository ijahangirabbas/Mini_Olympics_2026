#!/usr/bin/env node
/**
 * Seeds test accounts for EVERY role in Mini Olympics 2026 so each role and
 * permission boundary (RBAC, View-only vs Edit vs Delegate, Coordinator scoping,
 * HOC override, Finance, Inventory, Registrations, Super Admin impersonation)
 * can be tested 1 by 1.
 *
 * Safe & idempotent: uses ON CONFLICT (username) DO UPDATE only on demo_* accounts.
 * Usage: node scripts/seed-demo-accounts.js
 */
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envFiles = ['.env.local', 'env.local', '.env'];
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, '..', envFile);
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) return;
      const key = match[1];
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const dk = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString('base64')}:${dk.toString('base64')}`;
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function toSlug(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function upsertStaffAccount({
  fixedId,
  username,
  displayName,
  password,
  role,
  assignedGames = [],
  assignedGender = 'both',
  createdBy = 'seed_script',
  permissions = [],
}) {
  const gamesJson = JSON.stringify(assignedGames);
  await sql`
    INSERT INTO admin_users (
      id, username, display_name, password_hash, role,
      assigned_games, assigned_gender, created_by, is_active, created_at, updated_at
    ) VALUES (
      ${fixedId}, ${username}, ${displayName}, ${hashPassword(password)}, ${role},
      ${gamesJson}, ${assignedGender}, ${createdBy}, true, NOW(), NOW()
    )
    ON CONFLICT (username) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      assigned_games = EXCLUDED.assigned_games,
      assigned_gender = EXCLUDED.assigned_gender,
      is_active = true,
      updated_at = NOW()
  `;

  const [userRow] = await sql`SELECT id FROM admin_users WHERE username = ${username} LIMIT 1`;
  const userId = userRow.id;

  // Replace explicit permissions rows
  await sql`DELETE FROM permissions WHERE user_id = ${userId}`;
  for (const [pageKey, canView, canEdit, canDelegate] of permissions) {
    await sql`
      INSERT INTO permissions (id, user_id, page_key, can_view, can_edit, can_delegate, granted_by, created_at, updated_at)
      VALUES (${uid()}, ${userId}, ${pageKey}, ${canView}, ${canEdit}, ${canDelegate}, ${createdBy}, NOW(), NOW())
      ON CONFLICT (user_id, page_key) DO UPDATE SET
        can_view = EXCLUDED.can_view,
        can_edit = EXCLUDED.can_edit,
        can_delegate = EXCLUDED.can_delegate,
        updated_at = NOW()
    `;
  }

  // Sync coordinator_game_assignments if games assigned
  await sql`DELETE FROM coordinator_game_assignments WHERE user_id = ${userId}`;
  for (const gameName of assignedGames) {
    await sql`
      INSERT INTO coordinator_game_assignments (id, user_id, game_id, game_name, created_at)
      VALUES (${uid()}, ${userId}, ${toSlug(gameName)}, ${gameName}, NOW())
      ON CONFLICT (user_id, game_name) DO NOTHING
    `;
  }

  return userId;
}

async function run() {
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS display_name TEXT`;
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS assigned_games TEXT`;
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS assigned_gender TEXT DEFAULT 'both'`;
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS created_by TEXT`;
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL`;

  await sql`
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      page_key TEXT NOT NULL,
      can_view BOOLEAN DEFAULT true NOT NULL,
      can_edit BOOLEAN DEFAULT false NOT NULL,
      can_delegate BOOLEAN DEFAULT false NOT NULL,
      granted_by TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
      UNIQUE(user_id, page_key)
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

  // 1. Super Admin
  await upsertStaffAccount({
    fixedId: 'demo-super-admin-001',
    username: 'demo_super',
    displayName: 'Demo Super Admin',
    password: 'Demo@1234',
    role: 'super_admin',
    permissions: [], // super_admin implicitly holds all pages
  });

  // 2. Delegating Sub-Admin (can view/edit Dashboard + Registrations + Delegate Coordinator Portal & Permissions)
  await upsertStaffAccount({
    fixedId: 'demo-sub-admin-001',
    username: 'demo_subadmin',
    displayName: 'Demo Sub-Admin (Ops + Delegate)',
    password: 'SubAdmin@123',
    role: 'sub_admin',
    createdBy: 'demo_super',
    permissions: [
      ['/admin/dashboard', true, false, false],
      ['/admin/registrations', true, true, false],
      ['/admin/coordinator', true, true, true],
      ['/admin/permissions', true, true, true],
    ],
  });

  // 3. Read-Only Sub-Admin (great for verifying view-only GET vs 403 POST/PATCH/DELETE)
  await upsertStaffAccount({
    fixedId: 'demo-viewer-001',
    username: 'demo_viewer',
    displayName: 'Demo Read-Only Auditor',
    password: 'Viewer@123',
    role: 'sub_admin',
    createdBy: 'demo_super',
    permissions: [
      ['/admin/dashboard', true, false, false],
      ['/admin/registrations', true, false, false],
      ['/admin/finance', true, false, false],
      ['/admin/settings', true, false, false],
    ],
  });

  // 4. Coordinator #1 (Cricket, both divisions)
  await upsertStaffAccount({
    fixedId: 'demo-coordinator-cricket-001',
    username: 'demo_cricket',
    displayName: 'Demo Cricket Coordinator',
    password: 'Coord@123',
    role: 'coordinator',
    assignedGames: ['Tape Ball Cricket'],
    assignedGender: 'both',
    createdBy: 'demo_super',
    permissions: [['/admin/coordinator', true, true, false]],
  });

  // 5. Coordinator #2 (Badminton, girls division — useful for IDOR & bulk reassignment testing)
  await upsertStaffAccount({
    fixedId: 'demo-coordinator-badminton-001',
    username: 'demo_badminton',
    displayName: 'Demo Badminton Coordinator (Girls)',
    password: 'Coord@123',
    role: 'coordinator',
    assignedGames: ['Badminton Singles', 'Badminton Doubles'],
    assignedGender: 'girls',
    createdBy: 'demo_super',
    permissions: [['/admin/coordinator', true, true, false]],
  });

  // 6. Registration Admin
  await upsertStaffAccount({
    fixedId: 'demo-reg-admin-001',
    username: 'demo_reg',
    displayName: 'Demo Registration Desk Admin',
    password: 'RegAdmin@123',
    role: 'registration_admin',
    createdBy: 'demo_super',
    permissions: [['/admin/registrations', true, true, false]],
  });

  // 7. Finance Admin
  await upsertStaffAccount({
    fixedId: 'demo-finance-admin-001',
    username: 'demo_finance',
    displayName: 'Demo Finance Officer',
    password: 'Finance@123',
    role: 'finance_admin',
    createdBy: 'demo_super',
    permissions: [['/admin/finance', true, true, false]],
  });

  // 8. Inventory Admin
  await upsertStaffAccount({
    fixedId: 'demo-inventory-admin-001',
    username: 'demo_inventory',
    displayName: 'Demo Inventory Manager',
    password: 'Inventory@123',
    role: 'inventory_admin',
    createdBy: 'demo_super',
    permissions: [['/admin/inventory', true, true, false]],
  });

  // 9. HOC Admin
  await upsertStaffAccount({
    fixedId: 'demo-hoc-admin-001',
    username: 'demo_hoc',
    displayName: 'Demo Head of Competition',
    password: 'HocAdmin@123',
    role: 'hoc_admin',
    createdBy: 'demo_super',
    permissions: [
      ['/admin/super', true, true, false],
      ['/admin/hoc', true, true, false],
      ['/admin/coordinator', true, true, false],
    ],
  });

  const usersRes = await sql`
    SELECT username, role, assigned_gender, is_active
    FROM admin_users
    ORDER BY created_at ASC
  `;
  console.log('Seeded/verified role test accounts:');
  for (const u of usersRes) {
    console.log(` - ${u.username} | role=${u.role} | gender=${u.assigned_gender} | active=${u.is_active}`);
  }
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
