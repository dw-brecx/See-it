import { supabase } from '../supabase/client';
import { Brand, MenuItem } from '../types';
import { debugLog } from '../utils/debugLog';
import { isVisible, escapeIlike } from './visibility';

export async function searchBrands(q: string, limit = 30): Promise<Brand[]> {
  const term = q.trim();
  const safeTerm = escapeIlike(term);
  debugLog('search.brands', 'querying', { term, safeTerm, limit });
  let query = supabase
    .from('brands')
    .select('*')
    .eq('storefront_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (term.length > 0) {
    query = query.or(
      `name.ilike.%${safeTerm}%,primary_cuisine.ilike.%${safeTerm}%,tagline.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%`,
    );
  }
  const { data, error } = await query;
  debugLog('search.brands', 'raw result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  if (error) return [];
  return (data ?? []).filter(isVisible) as Brand[];
}

export type DishSearchResult = MenuItem & {
  brand_id: string;
  brand_name: string;
  location_id: string;
  cover_photo_url: string | null;
  primary_cuisine: string | null;
};

export async function searchDishes(q: string, limit = 50): Promise<DishSearchResult[]> {
  const term = q.trim();
  const safeTerm = escapeIlike(term);
  debugLog('search.dishes', 'querying', { term, limit });
  let query = supabase
    .from('menu_items')
    .select(
      'id, name, description, price, dietary_tags, average_rating, review_count, is_visible, location_id, location:locations(brand_id, brand:brands(id, name, primary_cuisine, storefront_published, is_suspended)), menu_item_photos(photo_url, is_featured, display_order)',
    )
    .eq('is_visible', true)
    .limit(limit);
  if (term.length > 0) {
    query = query.or(
      `name.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%`,
    );
  }
  const { data, error } = await query;
  debugLog('search.dishes', 'result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  if (error) return [];
  const results: DishSearchResult[] = [];
  for (const m of (data ?? []) as any[]) {
    const brand = m.location?.brand;
    // Drop dishes from suspended/unpublished brands (visibility leak fix)
    if (!isVisible(brand)) continue;
    const photos = (m.menu_item_photos ?? []) as any[];
    const cover = photos.find((p) => p.is_featured) ?? photos[0];
    results.push({
      id: m.id,
      name: m.name,
      description: m.description,
      price: m.price,
      dietary_tags: m.dietary_tags,
      average_rating: m.average_rating,
      review_count: m.review_count,
      location_id: m.location_id,
      is_visible: true,
      category_id: null,
      brand_id: brand.id,
      brand_name: brand.name,
      cover_photo_url: cover?.photo_url ?? null,
      primary_cuisine: brand.primary_cuisine ?? null,
    });
  }
  return results;
}
