import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { sql } from '@/lib/db';

export type AuditLogInput = {
  actorUserId?: string | null;
  actorUsername?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
};

export function getClientIp(request: NextRequest | Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim().slice(0, 64);
  }
  return (request.headers.get('x-real-ip') || 'unknown').slice(0, 64);
}

/**
 * Best-effort persistent audit trail for admin/coordinator/system mutations.
 * Never throws so an audit write failure cannot break core flows after commit.
 */
export async function logAudit(entry: AuditLogInput): Promise<void> {
  try {
    const id = uuidv4();
    const beforeJson = entry.before !== undefined ? JSON.stringify(entry.before) : null;
    const afterJson = entry.after !== undefined ? JSON.stringify(entry.after) : null;

    await sql`
      INSERT INTO audit_logs (
        id, actor_user_id, actor_username, action, target_type, target_id,
        before_json, after_json, ip, created_at
      ) VALUES (
        ${id},
        ${entry.actorUserId || null},
        ${entry.actorUsername || 'system'},
        ${entry.action},
        ${entry.targetType},
        ${entry.targetId || null},
        ${beforeJson}::jsonb,
        ${afterJson}::jsonb,
        ${entry.ip || null},
        NOW()
      )
    `;
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
