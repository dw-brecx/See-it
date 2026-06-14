import { supabase } from '../supabase/client';
import { Brand, Location } from '../types';
import { debugLog } from '../utils/debugLog';

/**
 * Apply the visibility filter in JS, not in the query, to dodge any
 * weirdness with chained .or() / PostgREST URL encoding. The cost is a
 * few rows over the wire — fine at our scale.
 */
function isVisible(b: any): boolean {
  if (!b) return false;
  if (b.storefront_published !== true) return false;
  if (b.is_suspended === true) return false;
  return true;
}

/** Brand by id, with visibility gate. */
export async function fetchBrand(brandId: string): Promise<Brand | null> {
  debugLog('brand.fetch', 'querying', { brandId });
  const { data, error } = await supabase.from('brands').select('*').eq('id', brandId).maybeSingle();
  debugLog('brand.fetch', 'result', { found: !!data, error: error?.message });
  if (!data) return null;
  if (!isVisible(data)) {
    debugLog('brand.fetch', 'hidden (published/suspended)', {
      storefront_published: data.storefront_published,
      is_suspended: data.is_suspended,
    });
    return null;
  }
  return data as Brand;
}

/** All locations for a brand. */
export async function fetchLocationsForBrand(brandId: string): Promise<Location[]> {
  debugLog('brand.locations', 'querying', { brandId });
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('brand_id', brandId)
    .order('name', { ascending: true });
  debugLog('brand.locations', 'result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  return (data ?? []) as Location[];
}

/**
 * Newly verified brands. Server-side filter is is_verified=true only — we
 * apply the rest in JS so a misplaced filter doesn't silently empty the
 * rail. Sort by verified_at desc, nulls last (then created_at desc as
 * tiebreaker).
 */
export async function fetchNewlyVerifiedBrands(limit = 12): Promise<Brand[]> {
  debugLog('home.verified', 'querying brands with is_verified=true');
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('is_verified', true)
    .order('verified_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  debugLog('home.verified', 'raw result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  if (error) return [];
  const visible = (data ?? []).filter(isVisible) as Brand[];
  debugLog('home.verified', 'after visibility filter', {
    kept: visible.length,
    dropped: (data?.length ?? 0) - visible.length,
  });
  return visible;
}

/**
 * All published brands by created_at desc. This is BOTH the "New on"
 * rail AND the universal fallback when there's nothing nearby.
 */
export async function fetchPublishedBrands(limit = 24): Promise<Brand[]> {
  debugLog('home.published', 'querying brands with storefront_published=true');
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('storefront_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  debugLog('home.published', 'raw result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  if (error) return [];
  const visible = (data ?? []).filter(isVisible) as Brand[];
  debugLog('home.published', 'after visibility filter', {
    kept: visible.length,
    dropped: (data?.length ?? 0) - visible.length,
  });
  return visible;
}

/** Back-compat alias used by older imports. */
export const fetchNewBrands = fetchPublishedBrands;

/**
 * Dev-mode / last-resort fallback — every brand row, no filter at all.
 * Lets the rail still render something even if storefront_published was
 * never set in seed data, or RLS is blocking the filtered query.
 */
export async function fetchAllBrandsRaw(limit = 50): Promise<Brand[]> {
  debugLog('home.raw', 'querying brands with NO filter');
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  debugLog('home.raw', 'result', {
    count: data?.length ?? 0,
    error: error?.message,
    // If error is null AND count is 0, RLS is silently blocking — surface that.
    hint:
      data?.length === 0 && !error
        ? 'Zero rows returned with no error — likely RLS blocking anon SELECT on brands. Add a SELECT policy for anon: CREATE POLICY "Public read brands" ON brands FOR SELECT TO anon USING (true);'
        : undefined,
  });
  return (data ?? []) as Brand[];
}
