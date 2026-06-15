import { supabase } from '../supabase/client';
import { debugLog } from '../utils/debugLog';
import { isVisible } from './visibility';

export type TrendingDish = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  dietary_tags: string[] | null;
  average_rating: number | null;
  review_count: number | null;
  location_id: string;
  brand_id: string;
  brand_name: string;
  cuisine: string | null;
  cover_photo_url: string | null;
};

function pickCover(photos: any[] | null | undefined): string | null {
  if (!photos || photos.length === 0) return null;
  const featured = photos.find((p) => p.is_featured);
  return featured?.photo_url ?? photos[0].photo_url ?? null;
}

function mapRow(row: any): TrendingDish | null {
  const brand = row.location?.brand;
  if (!isVisible(brand)) return null;
  const photos = row.menu_item_photos ?? row.photos ?? [];
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    price: row.price ?? null,
    dietary_tags: row.dietary_tags ?? null,
    average_rating: row.average_rating ?? null,
    review_count: row.review_count ?? null,
    location_id: row.location_id,
    brand_id: brand.id,
    brand_name: brand.name,
    cuisine: brand.primary_cuisine ?? null,
    cover_photo_url: pickCover(photos),
  };
}

/**
 * Trending dishes — visible menu items with at least one photo, ordered
 * by review count (most-reviewed first) then by creation. Skips dishes
 * from brands that aren't customer-visible. Always shows photo-bearing
 * dishes first so the home rail isn't empty placeholder boxes.
 */
export async function fetchTrendingDishes(limit = 20): Promise<TrendingDish[]> {
  debugLog('home.trending', 'querying');
  const { data, error } = await supabase
    .from('menu_items')
    .select(
      `id, name, description, price, dietary_tags, average_rating, review_count, location_id,
       menu_item_photos(photo_url, is_featured, display_order),
       location:locations!location_id(brand:brands!brand_id(id, name, primary_cuisine, storefront_published, is_suspended, is_verified))`,
    )
    .eq('is_visible', true)
    .order('review_count', { ascending: false, nullsFirst: false })
    .limit(limit * 3);
  debugLog('home.trending', 'result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  if (error) return [];
  const all = (data ?? [])
    .map(mapRow)
    .filter((d): d is TrendingDish => d !== null);
  // Photos first, then non-photo dishes if we still need to fill the rail.
  const withPhoto = all.filter((d) => d.cover_photo_url !== null);
  const without = all.filter((d) => d.cover_photo_url === null);
  return [...withPhoto, ...without].slice(0, limit);
}

/**
 * Recently added dishes — same shape but sorted by created_at desc.
 * Useful for the "Just cooked up" rail.
 */
export async function fetchNewDishes(limit = 20): Promise<TrendingDish[]> {
  debugLog('home.newDishes', 'querying');
  const { data, error } = await supabase
    .from('menu_items')
    .select(
      `id, name, description, price, dietary_tags, average_rating, review_count, location_id,
       menu_item_photos(photo_url, is_featured, display_order),
       location:locations!location_id(brand:brands!brand_id(id, name, primary_cuisine, storefront_published, is_suspended, is_verified))`,
    )
    .eq('is_visible', true)
    .order('created_at', { ascending: false, nullsFirst: false })
    .limit(limit * 3);
  debugLog('home.newDishes', 'result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  if (error) return [];
  const all = (data ?? [])
    .map(mapRow)
    .filter((d): d is TrendingDish => d !== null);
  return all.slice(0, limit);
}
