// SeeIt model: one brand per restaurant_owner. Enforced at DB level via
// unique index on brands(owner_id) WHERE owner_id IS NOT NULL.
//
// This module is the canonical "which brand am I scoped to" resolver.
// Used by middleware, the dashboard layout, and any server route that
// needs to verify ownership.

import type { SupabaseClient } from '@supabase/supabase-js';

export type ResolvedBrand = {
  id: string;
  name: string;
  logo_url: string | null;
  plan: string | null;
  /** How the user is connected to this brand. */
  source: 'owner' | 'team_member';
};

/**
 * Resolve the single brand a user works under.
 *
 * Priority:
 *   1. brands.owner_id = userId — the user owns this brand
 *   2. team_members.user_id = userId — the user is on this brand's team
 *   3. null — user has no brand (restaurant_owner should be sent to onboarding)
 *
 * If a user accidentally owns multiple brands (legacy data before the
 * unique index), the most recently created one wins and the others are
 * invisible to them. Admin can investigate.
 */
export async function getUserBrand(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
): Promise<ResolvedBrand | null> {
  const { data: owned } = await supabase
    .from('brands')
    .select('id, name, logo_url, plan, created_at')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (owned && owned.length > 0) {
    const b = owned[0] as any;
    return {
      id: b.id,
      name: b.name,
      logo_url: b.logo_url ?? null,
      plan: b.plan ?? null,
      source: 'owner',
    };
  }

  const { data: team } = await supabase
    .from('team_members')
    .select('brand:brands(id, name, logo_url, plan, created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (team && team.length > 0) {
    const t = team[0] as any;
    if (t.brand) {
      return {
        id: t.brand.id,
        name: t.brand.name,
        logo_url: t.brand.logo_url ?? null,
        plan: t.brand.plan ?? null,
        source: 'team_member',
      };
    }
  }

  return null;
}

/**
 * True when this user owns a brand. Used to block "create brand" flows —
 * each account can only own one brand on SeeIt.
 */
export async function userAlreadyOwnsBrand(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
): Promise<boolean> {
  const { count } = await supabase
    .from('brands')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);
  return (count ?? 0) > 0;
}
