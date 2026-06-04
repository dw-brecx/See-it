import { supabase } from '../supabase/client';
import { Brand, Location } from '../types';

const VISIBLE_BRAND_FILTERS = (q: any) =>
  q.eq('storefront_published', true).neq('is_suspended', true);

/** Brand by id with all visible storefront fields. */
export async function fetchBrand(brandId: string): Promise<Brand | null> {
  const q = supabase.from('brands').select('*').eq('id', brandId).maybeSingle();
  const { data } = await q;
  if (!data) return null;
  if (data.storefront_published === false || data.is_suspended) return null;
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
  let q = supabase
    .from('brands')
    .select('*')
    .eq('is_verified', true)
    .order('verified_at', { ascending: false })
    .limit(limit);
  q = VISIBLE_BRAND_FILTERS(q);
  const { data } = await q;
  return (data ?? []) as Brand[];
}

/** Newest published brands. */
export async function fetchNewBrands(limit = 12): Promise<Brand[]> {
  let q = supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  q = VISIBLE_BRAND_FILTERS(q);
  const { data } = await q;
  return (data ?? []) as Brand[];
}
