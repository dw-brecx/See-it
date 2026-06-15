import { supabase } from '../supabase/client';
import { MenuCategory, MenuItem, MenuItemPhoto } from '../types';
import { debugLog } from '../utils/debugLog';

export async function fetchMenuForLocation(locationId: string): Promise<{
  categories: MenuCategory[];
  items: (MenuItem & { photos: MenuItemPhoto[] })[];
}> {
  debugLog('menu.fetch', 'querying', { locationId });
  const [catsRes, itemsRes] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('*')
      .eq('location_id', locationId)
      .order('display_order', { ascending: true }),
    supabase
      .from('menu_items')
      .select('*, photos:menu_item_photos(*)')
      .eq('location_id', locationId)
      .or('is_visible.is.null,is_visible.eq.true')
      .order('name', { ascending: true }),
  ]);
  debugLog('menu.fetch', 'result', {
    categories: catsRes.data?.length ?? 0,
    items: itemsRes.data?.length ?? 0,
    error: catsRes.error?.message ?? itemsRes.error?.message,
  });
  const items = ((itemsRes.data ?? []) as any[]).map((i) => ({
    ...i,
    photos: (i.photos ?? []) as MenuItemPhoto[],
  })) as (MenuItem & { photos: MenuItemPhoto[] })[];
  return { categories: (catsRes.data ?? []) as MenuCategory[], items };
}

/**
 * Dish detail — INCLUDES customer-uploaded photos (is_restaurant_uploaded
 * false). Ordered with featured first, then any restaurant uploads, then
 * customer uploads, then newest first as the tiebreaker. So a customer
 * review photo automatically appears in the carousel after submit.
 */
export async function fetchMenuItem(menuItemId: string): Promise<
  | (MenuItem & {
      photos: MenuItemPhoto[];
      brand_id: string;
      brand_name: string;
      brand_theme_color: string | null;
    })
  | null
> {
  debugLog('menu.item', 'querying', { menuItemId });
  const { data, error } = await supabase
    .from('menu_items')
    .select(
      '*, photos:menu_item_photos(*), location:locations(brand:brands(id, name, theme_color))',
    )
    .eq('id', menuItemId)
    .maybeSingle();
  debugLog('menu.item', 'result', { found: !!data, error: error?.message });
  if (!data) return null;
  const row: any = data;
  const brand = row.location?.brand;
  const photos = (row.photos ?? []) as MenuItemPhoto[];
  photos.sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    if (a.is_restaurant_uploaded !== b.is_restaurant_uploaded)
      return a.is_restaurant_uploaded ? -1 : 1;
    return 0;
  });
  return {
    ...row,
    photos,
    brand_id: brand?.id ?? '',
    brand_name: brand?.name ?? '',
    brand_theme_color: brand?.theme_color ?? null,
  };
}

/**
 * All photos belonging to a brand for the storefront Photos tab.
 * Pulls menu_item_photos joined through menu_items → locations → brand_id.
 */
export async function fetchAllPhotosForBrand(
  brandId: string,
): Promise<{ id: string; photo_url: string; menu_item_id: string }[]> {
  debugLog('photos.brand', 'querying', { brandId });
  const { data: locs } = await supabase
    .from('locations')
    .select('id')
    .eq('brand_id', brandId);
  const locIds = (locs ?? []).map((l: any) => l.id);
  if (locIds.length === 0) {
    debugLog('photos.brand', 'no locations', { brandId });
    return [];
  }
  const { data: items } = await supabase
    .from('menu_items')
    .select('id')
    .in('location_id', locIds);
  const itemIds = (items ?? []).map((m: any) => m.id);
  if (itemIds.length === 0) {
    debugLog('photos.brand', 'no items', { brandId });
    return [];
  }
  const { data: photos, error } = await supabase
    .from('menu_item_photos')
    .select('id, photo_url, menu_item_id')
    .in('menu_item_id', itemIds)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });
  debugLog('photos.brand', 'result', {
    count: photos?.length ?? 0,
    error: error?.message,
  });
  return (photos ?? []) as { id: string; photo_url: string; menu_item_id: string }[];
}
