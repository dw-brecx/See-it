import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Record an admin action to the audit log. Never throws — audit failures
 * should not break the user-visible operation.
 *
 * The actor_id column has a `default auth.uid()` server-side, so we don't
 * pass it explicitly. The current authenticated user is the actor.
 */
export async function logAudit(
  supabase: SupabaseClient<any, any, any>,
  args: {
    action: string;
    targetType: string;
    targetId?: string | null;
    targetLabel?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  try {
    await supabase.from('admin_audit_log').insert({
      action: args.action,
      target_type: args.targetType,
      target_id: args.targetId ?? null,
      target_label: args.targetLabel ?? null,
      metadata: args.metadata ?? {},
    });
  } catch {
    // Silent — log table might not exist yet (migration unrun) or
    // RLS might block. Either way, don't disrupt the real operation.
  }
}
