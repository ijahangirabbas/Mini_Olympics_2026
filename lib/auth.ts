import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export type AdminRole =
  | 'super_admin'
  | 'sub_admin'
  | 'coordinator'
  | 'registration_admin'
  | 'inventory_admin'
  | 'hoc_admin'
  | 'finance_admin';

export type PagePermissionDetail = {
  canView: boolean;
  canEdit: boolean;
  canDelegate: boolean;
};

export type AdminSession = {
  sessionToken: string;
  adminUserId: string | null;
  username: string | null;
  displayName: string | null;
  role: AdminRole;
  permissions: string[];
  permissionDetails: Record<string, PagePermissionDetail>;
  assignedGames: string[];
  assignedGameIds: string[];
  assignedGender: 'boys' | 'girls' | 'both';
  defaultPage: string;
  expiresAt: string | null;
  impersonatedBy: string | null;
};

export type AdminPageMeta = {
  key: string;
  label: string;
  description: string;
};

export const ADMIN_PAGES: AdminPageMeta[] = [
  { key: '/admin/dashboard', label: 'Dashboard', description: 'Operations KPIs & overview metrics' },
  { key: '/admin/registrations', label: 'Registrations', description: 'View, verify, approve & export registrations' },
  { key: '/admin/inventory', label: 'Inventory', description: 'Equipment inventory & stock tracking' },
  { key: '/admin/finance', label: 'Finance', description: 'Treasury income, expense & ledger sync' },
  { key: '/admin/super', label: 'Sport Groups', description: 'WhatsApp groups & coordinator contact links' },
  { key: '/admin/hoc', label: 'HOC & Match Records', description: 'Tournament brackets & all coordinator match records' },
  { key: '/admin/coordinator', label: 'Coordinator Portal', description: 'Assigned game players, match scheduling & results' },
  { key: '/admin/email', label: 'Email Composer', description: 'Send bulk or individual emails via Gmail SMTP' },
  { key: '/admin/esports', label: 'Esports Controls', description: 'Esports registration toggle & announcements' },
  { key: '/admin/settings', label: 'Settings & Games', description: 'Manage games, prices, coupons, Gmail SMTP & registration lock' },
  { key: '/admin/permissions', label: 'Permissions & Users', description: 'Create sub-admins/coordinators, assign permissions & audit logs' },
];

export const ALL_ADMIN_PAGE_KEYS = ADMIN_PAGES.map((p) => p.key);

// Default pages for each role when no explicit rows exist in the `permissions` table
export const rolePermissions: Record<AdminRole, string[]> = {
  super_admin: ALL_ADMIN_PAGE_KEYS,
  sub_admin: [],
  coordinator: ['/admin/coordinator'],
  registration_admin: ['/admin/registrations'],
  inventory_admin: ['/admin/inventory'],
  hoc_admin: ['/admin/super', '/admin/hoc', '/admin/coordinator'],
  finance_admin: ['/admin/finance'],
};

// Default redirect page for each role
export const roleDefaultPage: Record<AdminRole, string> = {
  super_admin: '/admin/dashboard',
  sub_admin: '/admin/dashboard',
  coordinator: '/admin/coordinator',
  registration_admin: '/admin/registrations',
  inventory_admin: '/admin/inventory',
  hoc_admin: '/admin/hoc',
  finance_admin: '/admin/finance',
};

let schemaEnsurePromise: Promise<void> | null = null;

/**
 * Idempotently ensure auth, permissions, coordinator_matches, and games_pricing.category exist.
 * Runs at most once per server process (or resets on error so a transient outage can recover).
 */
export async function ensureAuthAndPermissionsSchema(): Promise<void> {
  if (schemaEnsurePromise) return schemaEnsurePromise;

  schemaEnsurePromise = (async () => {
    try {
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS display_name TEXT`;
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS assigned_games TEXT`;
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS assigned_gender TEXT DEFAULT 'both'`;
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS created_by TEXT`;
      await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL`;

      await sql`ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS impersonated_by TEXT`;

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
      await sql`CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON permissions(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_permissions_page_key ON permissions(page_key)`;

      await sql`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          actor_user_id TEXT,
          actor_username TEXT,
          action TEXT NOT NULL,
          target_type TEXT NOT NULL,
          target_id TEXT,
          before_json JSONB,
          after_json JSONB,
          ip TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id)`;

      await sql`
        CREATE TABLE IF NOT EXISTS games (
          id TEXT PRIMARY KEY,
          slug TEXT UNIQUE,
          name VARCHAR(150) NOT NULL UNIQUE,
          category VARCHAR(50) NOT NULL DEFAULT 'skill',
          headline TEXT,
          tagline TEXT,
          match_format TEXT,
          rules_overview TEXT,
          venue_note TEXT,
          accent_color VARCHAR(30) DEFAULT '#12E2C4',
          icon_key VARCHAR(50) DEFAULT 'trophy',
          image_url TEXT,
          coupon_eligible BOOLEAN DEFAULT true NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          sort_order INTEGER DEFAULT 0 NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `;
      try {
        await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS slug TEXT`;
        await sql`ALTER TABLE games ALTER COLUMN slug DROP NOT NULL`;
      } catch {}

      await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS category VARCHAR(50)`;
      await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS game_id TEXT`;
      await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL`;
      await sql`ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'PKR' NOT NULL`;

      await sql`
        CREATE TABLE IF NOT EXISTS registration_items (
          id TEXT PRIMARY KEY,
          registration_id TEXT NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
          game_id TEXT,
          game_name VARCHAR(150) NOT NULL,
          gender VARCHAR(20),
          unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
          currency VARCHAR(10) DEFAULT 'PKR',
          players_count INTEGER DEFAULT 1,
          team_members_json JSONB,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `;
      try {
        await sql`ALTER TABLE registration_items ADD COLUMN IF NOT EXISTS game_name VARCHAR(150)`;
        await sql`ALTER TABLE registration_items ADD COLUMN IF NOT EXISTS gender VARCHAR(20)`;
        await sql`ALTER TABLE registration_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2) DEFAULT 0`;
        await sql`ALTER TABLE registration_items ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'PKR'`;
        await sql`ALTER TABLE registration_items ADD COLUMN IF NOT EXISTS players_count INTEGER DEFAULT 1`;
        await sql`ALTER TABLE registration_items ADD COLUMN IF NOT EXISTS team_members_json JSONB`;
      } catch {}
      await sql`CREATE INDEX IF NOT EXISTS idx_reg_items_reg_id ON registration_items(registration_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_reg_items_game_id ON registration_items(game_id)`;

      await sql`
        CREATE TABLE IF NOT EXISTS coordinator_game_assignments (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
          game_id TEXT,
          game_name VARCHAR(150) NOT NULL,
          gender VARCHAR(10) NOT NULL DEFAULT 'both' CHECK (gender IN ('boys', 'girls', 'both')),
          assigned_by TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE(user_id, game_name)
        )
      `;
      try {
        await sql`ALTER TABLE coordinator_game_assignments ADD COLUMN IF NOT EXISTS user_id TEXT`;
        await sql`CREATE INDEX IF NOT EXISTS idx_coord_game_assign_user ON coordinator_game_assignments(user_id)`;
      } catch {}

      await sql`
        CREATE TABLE IF NOT EXISTS coordinator_player_assignments (
          id TEXT PRIMARY KEY,
          coordinator_user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
          registration_id TEXT NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
          game_id TEXT,
          game_name VARCHAR(150),
          notes TEXT,
          assigned_by TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE(coordinator_user_id, registration_id)
        )
      `;
      try {
        await sql`ALTER TABLE coordinator_player_assignments ADD COLUMN IF NOT EXISTS coordinator_user_id TEXT`;
        await sql`ALTER TABLE coordinator_player_assignments ADD COLUMN IF NOT EXISTS notes TEXT`;
        await sql`CREATE INDEX IF NOT EXISTS idx_coord_player_assign_user ON coordinator_player_assignments(coordinator_user_id)`;
      } catch {}
      await sql`CREATE INDEX IF NOT EXISTS idx_coord_player_assign_reg ON coordinator_player_assignments(registration_id)`;

      await sql`
        CREATE TABLE IF NOT EXISTS coordinator_matches (
          id TEXT PRIMARY KEY,
          game_name VARCHAR(150) NOT NULL,
          gender VARCHAR(10) NOT NULL CHECK (gender IN ('boys', 'girls')),
          round_name VARCHAR(100) NOT NULL DEFAULT 'Round 1',
          match_number INTEGER NOT NULL DEFAULT 1,
          player1_name VARCHAR(255) NOT NULL,
          player1_reg_id TEXT,
          player1_roll VARCHAR(50),
          player1_contact VARCHAR(30),
          player2_name VARCHAR(255) NOT NULL,
          player2_reg_id TEXT,
          player2_roll VARCHAR(50),
          player2_contact VARCHAR(30),
          scheduled_date VARCHAR(50),
          scheduled_time VARCHAR(120),
          venue VARCHAR(150),
          status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'walkover')),
          winner_name VARCHAR(255),
          score_summary VARCHAR(255),
          notes TEXT,
          coordinator_id TEXT,
          coordinator_username TEXT,
          assignment_scope TEXT DEFAULT 'game',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `;
      await sql`ALTER TABLE coordinator_matches ADD COLUMN IF NOT EXISTS game_id TEXT`;
      await sql`ALTER TABLE coordinator_matches ADD COLUMN IF NOT EXISTS scheduled_start_at TIMESTAMPTZ`;
      await sql`ALTER TABLE coordinator_matches ADD COLUMN IF NOT EXISTS scheduled_end_at TIMESTAMPTZ`;
      await sql`ALTER TABLE coordinator_matches ADD COLUMN IF NOT EXISTS pair_reason TEXT`;
      await sql`ALTER TABLE coordinator_matches ADD COLUMN IF NOT EXISTS override_by TEXT`;
      await sql`ALTER TABLE coordinator_matches ADD COLUMN IF NOT EXISTS override_reason TEXT`;
      await sql`ALTER TABLE coordinator_matches ADD COLUMN IF NOT EXISTS assignment_scope TEXT DEFAULT 'game'`;

      await sql`CREATE INDEX IF NOT EXISTS idx_coord_matches_game_gender ON coordinator_matches(game_name, gender)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_coord_matches_coord_id ON coordinator_matches(coordinator_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_coord_matches_status ON coordinator_matches(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_registrations_slip_id ON registrations(slip_id)`;

      try {
        await sql`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_team_name_lower
          ON registrations (LOWER(team_name))
          WHERE team_name IS NOT NULL AND team_name != ''
        `;
      } catch {}

      try {
        await sql`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_ref_unique
          ON finance_records (reference_id, reference_type)
          WHERE reference_id IS NOT NULL AND reference_type IS NOT NULL
        `;
      } catch {}
    } catch (err) {
      schemaEnsurePromise = null;
      throw err;
    }
  })();

  return schemaEnsurePromise;
}

export function parseAssignedGames(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((x) => String(x).trim()).filter(Boolean);
        }
      } catch {
        // Fall through to comma-split
      }
    }
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeRole(rawRole: unknown): AdminRole {
  const r = String(rawRole || 'sub_admin').trim();
  if (r === 'admin') return 'super_admin';
  if (
    r === 'super_admin' ||
    r === 'sub_admin' ||
    r === 'coordinator' ||
    r === 'registration_admin' ||
    r === 'inventory_admin' ||
    r === 'hoc_admin' ||
    r === 'finance_admin'
  ) {
    return r;
  }
  return 'sub_admin';
}

export async function resolveUserPermissions(
  userId: string | null,
  role: AdminRole
): Promise<{
  permissions: string[];
  permissionDetails: Record<string, PagePermissionDetail>;
  defaultPage: string;
}> {
  if (role === 'super_admin') {
    const details: Record<string, PagePermissionDetail> = {};
    for (const key of ALL_ADMIN_PAGE_KEYS) {
      details[key] = { canView: true, canEdit: true, canDelegate: true };
    }
    return {
      permissions: ALL_ADMIN_PAGE_KEYS,
      permissionDetails: details,
      defaultPage: '/admin/dashboard',
    };
  }

  let rows: any[] = [];
  if (userId) {
    try {
      rows = (await sql`
        SELECT page_key, can_view, can_edit, can_delegate
        FROM permissions
        WHERE user_id = ${userId}
      `) as any[];
    } catch {
      rows = [];
    }
  }

  const details: Record<string, PagePermissionDetail> = {};
  if (rows.length > 0) {
    for (const row of rows) {
      if (row.can_view) {
        details[String(row.page_key)] = {
          canView: Boolean(row.can_view),
          canEdit: Boolean(row.can_edit),
          canDelegate: Boolean(row.can_delegate),
        };
      }
    }
  } else if (role !== 'sub_admin') {
    const defaults = rolePermissions[role] || [];
    for (const key of defaults) {
      details[key] = { canView: true, canEdit: true, canDelegate: false };
    }
  }

  const allowedKeys = Object.keys(details);
  const preferredDefault = roleDefaultPage[role];
  const defaultPage = allowedKeys.includes(preferredDefault)
    ? preferredDefault
    : allowedKeys[0] || '/admin/login';

  return {
    permissions: allowedKeys,
    permissionDetails: details,
    defaultPage,
  };
}

/**
 * Get admin session by session token string from database, including resolved permissions.
 */
export async function getAdminSession(sessionToken: string | undefined): Promise<AdminSession | null> {
  if (!sessionToken) return null;

  try {
    await ensureAuthAndPermissionsSchema();
  } catch {
    // Non-fatal: continue with legacy query if DDL fails
  }

  let result: any = null;

  try {
    result = await sql`
      SELECT
        s.session_token,
        s.expires_at,
        s.impersonated_by,
        COALESCE(s.admin_user_id, NULL) AS admin_user_id,
        COALESCE(u.username, NULL) AS username,
        COALESCE(u.display_name, NULL) AS display_name,
        COALESCE(u.role, s.role, 'sub_admin') AS role,
        u.assigned_games,
        COALESCE(u.assigned_gender, 'both') AS assigned_gender,
        COALESCE(u.is_active, true) AS is_active
      FROM admin_sessions s
      LEFT JOIN admin_users u ON u.id = s.admin_user_id
      WHERE s.session_token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
  } catch (err: any) {
    const code = err?.code ? String(err.code) : '';
    if (code !== '42703') throw err;

    result = await sql`
      SELECT session_token, expires_at
      FROM admin_sessions
      WHERE session_token = ${sessionToken} AND expires_at > NOW()
      LIMIT 1
    `;
  }

  const rows = result?.rows ? result.rows : result;
  const row: any = rows?.[0] || null;

  if (!row) return null;
  if (row.is_active === false) return null;

  const effectiveRole = normalizeRole(row.role);
  const adminUserId = row.admin_user_id ? String(row.admin_user_id) : null;
  const { permissions, permissionDetails, defaultPage } = await resolveUserPermissions(
    adminUserId,
    effectiveRole
  );

  const rawGender = String(row.assigned_gender || 'both').toLowerCase();
  let assignedGender: 'boys' | 'girls' | 'both' =
    rawGender === 'boys' || rawGender === 'girls' ? rawGender : 'both';

  let assignedGames = parseAssignedGames(row.assigned_games);
  let assignedGameIds: string[] = [];

  if (adminUserId) {
    try {
      const assignRows = (await sql`
        SELECT DISTINCT
          COALESCE(g.name, cga.game_name) AS game_name,
          cga.game_id,
          cga.gender
        FROM coordinator_game_assignments cga
        LEFT JOIN games g ON g.id = cga.game_id
        WHERE cga.user_id = ${adminUserId}
      `) as any[];
      if (assignRows.length > 0) {
        const mergedNames = new Set(assignedGames);
        const ids = new Set<string>();
        for (const ar of assignRows) {
          if (ar.game_name) mergedNames.add(String(ar.game_name));
          if (ar.game_id) ids.add(String(ar.game_id));
        }
        assignedGames = Array.from(mergedNames);
        assignedGameIds = Array.from(ids);
        const genders = new Set(assignRows.map((ar) => String(ar.gender || 'both')));
        if (genders.has('both') || (genders.has('boys') && genders.has('girls'))) {
          assignedGender = 'both';
        } else if (genders.size === 1) {
          const only = Array.from(genders)[0];
          if (only === 'boys' || only === 'girls') assignedGender = only;
        }
      }
    } catch {
      // Table may not exist yet in partial states
    }
  }

  return {
    sessionToken: row.session_token,
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    adminUserId,
    username: row.username ? String(row.username) : null,
    displayName: row.display_name ? String(row.display_name) : null,
    role: effectiveRole,
    permissions,
    permissionDetails,
    assignedGames,
    assignedGameIds,
    assignedGender,
    defaultPage,
    impersonatedBy: row.impersonated_by ? String(row.impersonated_by) : null,
  };
}

export function hasAnyRole(session: AdminSession | null, allowed: AdminRole[]) {
  if (!session?.role) return false;
  if (session.role === 'super_admin') return true;
  return allowed.includes(session.role);
}

/**
 * Check whether the authenticated session has permission for a specific admin pageKey.
 */
export function hasPagePermission(
  session: AdminSession | null,
  pageKey: string,
  mode: 'view' | 'edit' | 'delegate' = 'view'
): boolean {
  if (!session) return false;
  if (session.role === 'super_admin') return true;

  const detail = session.permissionDetails?.[pageKey];
  if (!detail) return false;
  if (mode === 'delegate') return detail.canView && detail.canDelegate;
  if (mode === 'edit') return detail.canView && detail.canEdit;
  return detail.canView;
}

/**
 * Helper for API routes to authenticate and enforce a specific page permission.
 */
export async function requireAdminPermission(
  pageKey: string,
  mode: 'view' | 'edit' | 'delegate' = 'view'
): Promise<{ session: AdminSession; error?: never } | { session?: never; error: NextResponse }> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session')?.value;
  const session = await getAdminSession(sessionToken);

  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (!hasPagePermission(session, pageKey, mode)) {
    return {
      error: NextResponse.json(
        { error: `Forbidden - ${mode} permission required for ${pageKey}` },
        { status: 403 }
      ),
    };
  }

  return { session };
}
