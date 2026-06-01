import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Upload a file to a Supabase Storage bucket and return its public URL.
 * Generates a UUID-prefixed filename to avoid collisions.
 *
 * Throws on error — callers should wrap in try/catch and surface a toast.
 */
export async function uploadToBucket(
  supabase: SupabaseClient,
  bucket: string,
  file: File,
  options: { prefix?: string; ownerId?: string } = {},
): Promise<{ path: string; publicUrl: string }> {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const prefixParts = [options.ownerId, options.prefix].filter(Boolean);
  const path = `${prefixParts.length ? prefixParts.join('/') + '/' : ''}${id}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

/**
 * Delete by path. Used when removing an image from a form before save.
 */
export async function deleteFromBucket(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/** Extract a storage path from a public URL — best-effort. */
export function pathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}
