import { supabase } from '../supabase/client';
import { UserPreferences } from '../types';

export async function fetchPreferences(userId: string): Promise<UserPreferences | null> {
  const { data } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return (data ?? null) as UserPreferences | null;
}

export async function updatePreferences(
  userId: string,
  allergies: string[],
  dietary_preferences: string[],
) {
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, allergies, dietary_preferences }, { onConflict: 'user_id' });
  if (error) throw error;
}
