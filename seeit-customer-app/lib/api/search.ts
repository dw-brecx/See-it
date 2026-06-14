import { supabase } from '../supabase/client';
import { Brand, MenuItem } from '../types';
import { debugLog } from '../utils/debugLog';

function isVisible(b: any): boolean {
  if (!b) return false;
  if (b.storefront_published !== true) return false;
  if (b.is_suspended === true) return false;
  return true;
}

export async function searchBrands(q: string, limit = 30): Promise<Brand[]> {
  const term = q.trim();
  debugLog('search.brands', 'querying', { term, limit });
  let query = supabase
    .from('brands')
    .select('*')
    .eq('storefront_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (term.length > 0) {
    query = query.or(
      `name.ilike.%${term}%,primary_cuisine.ilike.%${term}%,tagline.ilike.%${term}%,description.ilike.%${term}%`,
    );
  }
  const { data, error } = await query;
  debugLog('search.brands', 'raw result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  if (error) return [];
  const visible = (data ?? []).filter(isVisible) as Brand[];
  return visible;
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
  debugLog('search.dishes', 'querying', { term, limit });
  let query = supabase
    .from('menu_items')
    .select(
      // Pull through location → brand for naming + cuisine fallback, AND
      // menu_item_photos so the result cards actually show the dish photo
      // (the previous query left cover_photo_url null and gave you gray
      // rectangles in the results).
      'id, name, description, price, dietary_tags, average_rating, review_count, is_visible, location_id, location:locations(brand_id, brand:brands(id, name, primary_cuisine)), menu_item_photos(photo_url, is_featured, display_order)',
    )
    .eq('is_visible', true)
    .limit(limit);
  if (term.length > 0) {
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }
  const { data, error } = await query;
  debugLog('search.dishes', 'result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  if (error) return [];
  return ((data ?? []) as any[]).map((m) => {
    const photos = (m.menu_item_photos ?? []) as any[];
    const cover = photos.find((p) => p.is_featured) ?? photos[0];
    return {
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
      brand_id: m.location?.brand?.id ?? '',
      brand_name: m.location?.brand?.name ?? '',
      cover_photo_url: cover?.photo_url ?? null,
      primary_cuisine: m.location?.brand?.primary_cuisine ?? null,
    };
  });
}
