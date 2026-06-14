import { supabase } from '../supabase/client';
import { SavedItem } from '../types';
import { debugLog } from '../utils/debugLog';

// Extend the row shape with the want-to-try flag added by migration 007.
export type SavedItemRow = SavedItem & { is_want_to_try?: boolean | null };

export async function fetchSavedItems(userId: string): Promise<SavedItemRow[]> {
  debugLog('saved.list', 'querying', { userId });
  const { data, error } = await supabase
    .from('saved_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false } as any);
  debugLog('saved.list', 'result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  if (error) throw error;
  return (data ?? []) as SavedItemRow[];
}

async function requireUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to save your favorites');
  return user.id;
}

export async function saveLocation(
  locationId: string,
  opts: { wantToTry?: boolean; notes?: string | null } = {},
) {
  const userId = await requireUserId();
  debugLog('saved.location.create', 'inserting', {
    locationId,
    wantToTry: !!opts.wantToTry,
  });
  const { error } = await supabase.from('saved_items').insert({
    user_id: userId,
    item_type: 'location',
    location_id: locationId,
    notes: opts.notes ?? null,
    is_want_to_try: !!opts.wantToTry,
  } as any);
  if (error) {
    debugLog('saved.location.create', 'error', { error: error.message });
    throw error;
  }
}

export async function saveMenuItem(
  menuItemId: string,
  opts: { wantToTry?: boolean; notes?: string | null } = {},
) {
  const userId = await requireUserId();
  debugLog('saved.item.create', 'inserting', {
    menuItemId,
    wantToTry: !!opts.wantToTry,
  });
  const { error } = await supabase.from('saved_items').insert({
    user_id: userId,
    item_type: 'menu_item',
    menu_item_id: menuItemId,
    notes: opts.notes ?? null,
    is_want_to_try: !!opts.wantToTry,
  } as any);
  if (error) {
    debugLog('saved.item.create', 'error', { error: error.message });
    throw error;
  }
}

export async function unsaveItem(id: string) {
  debugLog('saved.delete', 'deleting', { id });
  const { error } = await supabase.from('saved_items').delete().eq('id', id);
  if (error) {
    debugLog('saved.delete', 'error', { error: error.message });
    throw error;
  }
}

/** Flip the want-to-try flag on an existing saved row. */
export async function setWantToTry(id: string, want: boolean) {
  const { error } = await supabase
    .from('saved_items')
    .update({ is_want_to_try: want } as any)
    .eq('id', id);
  if (error) throw error;
}
