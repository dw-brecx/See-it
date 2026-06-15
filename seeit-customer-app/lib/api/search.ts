import { supabase } from '../supabase/client';
import { Brand, MenuItem } from '../types';
import { debugLog } from '../utils/debugLog';
import { isVisible, escapeIlike } from './visibility';

// Canonical dietary tags we'll treat specially in search. If the user
// types "kosher" (case-insensitive), we ALSO want to match brands whose
// location has 'Kosher' in dietary_tags — not just brands whose name
// happens to contain the word.
const DIETARY_TAGS_LOWER = new Map([
  ['kosher', 'Kosher'],
  ['halal', 'Halal'],
  ['vegan', 'Vegan'],
  ['vegetarian', 'Vegetarian'],
  ['gluten-free', 'Gluten-Free options'],
  ['gluten free', 'Gluten-Free options'],
  ['nut-free', 'Nut-Free options'],
  ['dairy-free', 'Dairy-Free options'],
  ['organic', 'Organic'],
]);

function recogniseDietaryTag(term: string): string | null {
  const k = term.trim().toLowerCase();
  return DIETARY_TAGS_LOWER.get(k) ?? null;
}

export async function searchBrands(q: string, limit = 30): Promise<Brand[]> {
  const term = q.trim();
  const safeTerm = escapeIlike(term);
  const dietary = recogniseDietaryTag(term);
  debugLog('search.brands', 'querying', { term, dietary, limit });

  // Pull brands + an embedded locations.dietary_tags so we can match by
  // dietary in JS without a second roundtrip.
  let query = supabase
    .from('brands')
    .select('*, locations(dietary_tags)')
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

  const namedHits = (data ?? []).filter(isVisible) as any[];

  // If the term is a dietary tag, ALSO pull brands whose locations carry
  // that tag (the ILIKE wouldn't catch e.g. a brand named "Joe's Burgers"
  // that's tagged Kosher). Merge + dedupe.
  let extra: any[] = [];
  if (dietary && term.length > 0) {
    const { data: tagged, error: tErr } = await supabase
      .from('brands')
      .select('*, locations!inner(dietary_tags)')
      .eq('storefront_published', true)
      .contains('locations.dietary_tags', [dietary])
      .limit(limit);
    if (!tErr) extra = (tagged ?? []).filter(isVisible);
  }

  const seen = new Set<string>();
  const out: Brand[] = [];
  for (const b of [...namedHits, ...extra]) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    // Strip embedded `locations` before returning as Brand.
    const { locations, ...rest } = b;
    out.push(rest as Brand);
  }
  debugLog('search.brands', 'merged', {
    named: namedHits.length,
    tagged: extra.length,
    total: out.length,
  });
  return out;
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
  const dietary = recogniseDietaryTag(term);
  debugLog('search.dishes', 'querying', { term, dietary, limit });

  let query = supabase
    .from('menu_items')
    .select(
      'id, name, description, price, dietary_tags, average_rating, review_count, is_visible, location_id, location:locations(brand_id, brand:brands(id, name, primary_cuisine, storefront_published, is_suspended)), menu_item_photos(photo_url, is_featured, display_order)',
    )
    .or('is_visible.is.null,is_visible.eq.true')
    .limit(limit);

  // Build the OR string — name/description ILIKE always, plus
  // dietary_tags array-contains when the term is a recognised tag.
  if (term.length > 0) {
    if (dietary) {
      // Two passes: ilike + dietary-tag match. PostgREST's .or doesn't
      // mix array operators easily, so we run two queries and merge.
      query = query.or(`name.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%`);
    } else {
      query = query.or(`name.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%`);
    }
  }
  const { data, error } = await query;
  debugLog('search.dishes', 'result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  if (error) return [];

  const results: DishSearchResult[] = [];
  const seen = new Set<string>();
  for (const m of (data ?? []) as any[]) {
    const brand = m.location?.brand;
    if (!isVisible(brand)) continue;
    if (seen.has(m.id)) continue;
    seen.add(m.id);
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

  // Dietary-tag second pass.
  if (dietary && term.length > 0) {
    const { data: tagged } = await supabase
      .from('menu_items')
      .select(
        'id, name, description, price, dietary_tags, average_rating, review_count, is_visible, location_id, location:locations(brand_id, brand:brands(id, name, primary_cuisine, storefront_published, is_suspended)), menu_item_photos(photo_url, is_featured, display_order)',
      )
      .or('is_visible.is.null,is_visible.eq.true')
      .contains('dietary_tags', [dietary])
      .limit(limit);
    for (const m of (tagged ?? []) as any[]) {
      const brand = m.location?.brand;
      if (!isVisible(brand)) continue;
      if (seen.has(m.id)) continue;
      seen.add(m.id);
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
  }

  return results;
}
