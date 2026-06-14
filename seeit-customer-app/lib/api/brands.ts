import { supabase } from '../supabase/client';
import { Brand, Location } from '../types';
import { debugLog } from '../utils/debugLog';
import { isVisible } from './visibility';

export async function fetchBrand(brandId: string): Promise<Brand | null> {
  debugLog('brand.fetch', 'querying', { brandId });
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', brandId)
    .maybeSingle();
  debugLog('brand.fetch', 'result', { found: !!data, error: error?.message });
  if (!data) return null;
  if (!isVisible(data)) {
    debugLog('brand.fetch', 'hidden', {
      storefront_published: data.storefront_published,
      is_suspended: data.is_suspended,
    });
    return null;
  }
  return data as Brand;
}

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
  return (data ?? []).filter(isVisible) as Brand[];
}

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
  return (data ?? []).filter(isVisible) as Brand[];
}

export const fetchNewBrands = fetchPublishedBrands;

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
    hint:
      data?.length === 0 && !error
        ? 'Zero rows + zero error → likely RLS blocking anon SELECT on brands.'
        : undefined,
  });
  return (data ?? []) as Brand[];
}
