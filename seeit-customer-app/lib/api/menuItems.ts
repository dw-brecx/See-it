import { supabase } from '../supabase/client';
import { MenuCategory, MenuItem, MenuItemPhoto } from '../types';

export async function fetchMenuForLocation(locationId: string): Promise<{
  categories: MenuCategory[];
  items: (MenuItem & { photos: MenuItemPhoto[] })[];
}> {
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
      .eq('is_visible', true)
      .order('name', { ascending: true }),
  ]);

  const items = ((itemsRes.data ?? []) as any[]).map((i) => ({
    ...i,
    photos: (i.photos ?? []) as MenuItemPhoto[],
  })) as (MenuItem & { photos: MenuItemPhoto[] })[];

  return {
    categories: (catsRes.data ?? []) as MenuCategory[],
    items,
  };
}

export async function fetchMenuItem(menuItemId: string): Promise<
  | (MenuItem & {
      photos: MenuItemPhoto[];
      brand_id: string;
      brand_name: string;
      brand_theme_color: string | null;
    })
  | null
> {
  const { data } = await supabase
    .from('menu_items')
    .select('*, photos:menu_item_photos(*), location:locations(brand:brands(id, name, theme_color))')
    .eq('id', menuItemId)
    .maybeSingle();
  if (!data) return null;
  const row: any = data;
  const brand = row.location?.brand;
  return {
    ...row,
    photos: (row.photos ?? []) as MenuItemPhoto[],
    brand_id: brand?.id ?? '',
    brand_name: brand?.name ?? '',
    brand_theme_color: brand?.theme_color ?? null,
  };
}
