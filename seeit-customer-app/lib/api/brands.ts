import { supabase } from '../supabase/client';
import { Brand, Location } from '../types';

/**
 * Visibility filter for the customer app.
 * - storefront_published must be explicitly true
 * - is_suspended must be NOT TRUE (i.e. false or null)
 *
 * Critical: `.neq('is_suspended', true)` excludes NULL rows because in SQL
 * `NULL <> true` evaluates to NULL (not TRUE). Most newly-created brands
 * have is_suspended NULL by default, so the bare neq silently hides them.
 * We use `.or('is_suspended.is.null,is_suspended.eq.false')` instead.
 */
function visibleBrandsQuery() {
  return supabase
    .from('brands')
    .select('*')
    .eq('storefront_published', true)
    .or('is_suspended.is.null,is_suspended.eq.false');
}

/** Brand by id with all visible storefront fields. */
export async function fetchBrand(brandId: string): Promise<Brand | null> {
  const { data } = await supabase.from('brands').select('*').eq('id', brandId).maybeSingle();
  if (!data) return null;
  if (data.storefront_published !== true) return null;
  if (data.is_suspended === true) return null;
  return data as Brand;
}

/** All visible locations for a brand. */
export async function fetchLocationsForBrand(brandId: string): Promise<Location[]> {
  const { data } = await supabase
    .from('locations')
    .select('*')
    .eq('brand_id', brandId)
    .order('name', { ascending: true });
  return (data ?? []) as Location[];
}

/** Recently verified brands — for the "Newly Verified" home rail. */
export async function fetchNewlyVerifiedBrands(limit = 12): Promise<Brand[]> {
  const { data } = await visibleBrandsQuery()
    .eq('is_verified', true)
    .order('verified_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as Brand[];
}

/** Newest published brands — "New on SeeIt" + the universal fallback rail. */
export async function fetchNewBrands(limit = 24): Promise<Brand[]> {
  const { data } = await visibleBrandsQuery()
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as Brand[];
}

/**
 * Dev/test escape hatch — returns ALL brands (no visibility filter) so the
 * Home rail still has something to show when seed data lacks
 * storefront_published=true. Triggered by the "Show all" toggle in About.
 */
export async function fetchAllBrandsRaw(limit = 50): Promise<Brand[]> {
  const { data } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as Brand[];
}
