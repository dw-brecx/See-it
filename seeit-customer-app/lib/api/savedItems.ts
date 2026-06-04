import { supabase } from '../supabase/client';
import { SavedItem } from '../types';

export async function fetchSavedItems(userId: string): Promise<SavedItem[]> {
  const { data } = await supabase
    .from('saved_items')
    .select('*')
    .eq('user_id', userId);
  return (data ?? []) as SavedItem[];
}

export async function saveLocation(locationId: string, notes: string | null = null) {
  const { error } = await supabase
    .from('saved_items')
    .insert({ item_type: 'location', location_id: locationId, notes });
  if (error) throw error;
}

export async function saveMenuItem(menuItemId: string, notes: string | null = null) {
  const { error } = await supabase
    .from('saved_items')
    .insert({ item_type: 'menu_item', menu_item_id: menuItemId, notes });
  if (error) throw error;
}

export async function unsaveItem(id: string) {
  const { error } = await supabase.from('saved_items').delete().eq('id', id);
  if (error) throw error;
}
