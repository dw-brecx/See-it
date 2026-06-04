import { supabase } from '../supabase/client';
import { Brand, MenuItem } from '../types';

export type BrandSearchResult = Brand & {
  location_count: number;
  average_rating: number | null;
};

export async function searchBrands(q: string, limit = 30): Promise<Brand[]> {
  const term = q.trim();
  let query = supabase
    .from('brands')
    .select('*')
    .eq('storefront_published', true)
    .neq('is_suspended', true)
    .limit(limit);
  if (term.length > 0) {
    query = query.or(
      `name.ilike.%${term}%,primary_cuisine.ilike.%${term}%,tagline.ilike.%${term}%`,
    );
  }
  const { data } = await query;
  return (data ?? []) as Brand[];
}

export type DishSearchResult = MenuItem & {
  brand_id: string;
  brand_name: string;
  location_id: string;
  cover_photo_url: string | null;
};

export async function searchDishes(q: string, limit = 50): Promise<DishSearchResult[]> {
  const term = q.trim();
  let query = supabase
    .from('menu_items')
    .select(
      'id, name, description, price, dietary_tags, average_rating, review_count, location_id, location:locations(brand_id, brand:brands(id, name))',
    )
    .eq('is_visible', true)
    .limit(limit);
  if (term.length > 0) {
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }
  const { data } = await query;
  return ((data ?? []) as any[]).map((m) => ({
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
    cover_photo_url: null,
  }));
}
