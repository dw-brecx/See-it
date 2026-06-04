// Order lists are stored server-side once the user signs in and saves them.
// While browsing anonymously, the active list lives in zustand only.

import { supabase } from '../supabase/client';

export async function saveOrderList(
  userId: string,
  locationId: string,
  name: string | null,
  items: { menu_item_id: string; quantity: number; notes: string | null; assigned_to: string | null }[],
): Promise<string> {
  const { data: listRow, error } = await supabase
    .from('order_lists')
    .insert({ user_id: userId, location_id: locationId, name })
    .select('id')
    .single();
  if (error || !listRow) throw error ?? new Error('Failed to create order list');

  if (items.length > 0) {
    await supabase.from('order_list_items').insert(
      items.map((it) => ({ ...it, order_list_id: listRow.id })),
    );
  }
  return listRow.id as string;
}
