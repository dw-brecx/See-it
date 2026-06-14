import { supabase } from '../supabase/client';
import { Review, ReviewPhoto, ReviewReply } from '../types';
import { debugLog } from '../utils/debugLog';

export type ReviewWithAuthor = Review & {
  reviewer_name: string;
  reviewer_avatar_url: string | null;
  photos: ReviewPhoto[];
  reply: ReviewReply | null;
};

function hydrateReviews(rows: any[]): ReviewWithAuthor[] {
  return rows.map((r: any) => ({
    ...r,
    reviewer_name: r.user?.name ?? r.user?.email ?? 'Anonymous',
    reviewer_avatar_url: r.user?.avatar_url ?? null,
    photos: (r.photos ?? []) as ReviewPhoto[],
    reply: (r.replies?.[0] ?? null) as ReviewReply | null,
  }));
}

// Null-safe flagged filter — `.neq('is_flagged', true)` evaluates
// `NULL <> TRUE` to NULL (not TRUE) under SQL three-valued logic, so
// reviews with `is_flagged = NULL` (most rows) were silently dropped.
// We want: keep rows where is_flagged is NULL or FALSE.
function notFlagged(q: any) {
  return q.or('is_flagged.is.null,is_flagged.eq.false');
}

export async function fetchReviewsForLocation(
  locationId: string,
  limit = 30,
): Promise<ReviewWithAuthor[]> {
  debugLog('reviews.location', 'querying', { locationId });
  let q = supabase
    .from('reviews')
    .select(
      '*, user:users(name, email, avatar_url), photos:review_photos(*), replies:review_replies(*)',
    )
    .eq('location_id', locationId);
  q = notFlagged(q);
  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(limit);
  debugLog('reviews.location', 'result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  return hydrateReviews((data ?? []) as any[]);
}

export async function fetchReviewsForBrand(brandId: string): Promise<ReviewWithAuthor[]> {
  debugLog('reviews.brand', 'querying', { brandId });
  const { data: locs } = await supabase
    .from('locations')
    .select('id')
    .eq('brand_id', brandId);
  const locIds = (locs ?? []).map((l: any) => l.id);
  if (locIds.length === 0) return [];
  let q = supabase
    .from('reviews')
    .select(
      '*, user:users(name, email, avatar_url), photos:review_photos(*), replies:review_replies(*)',
    )
    .in('location_id', locIds);
  q = notFlagged(q);
  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(200);
  debugLog('reviews.brand', 'result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  return hydrateReviews((data ?? []) as any[]);
}

export async function fetchReviewsForMenuItem(
  menuItemId: string,
  limit = 20,
): Promise<ReviewWithAuthor[]> {
  debugLog('reviews.item', 'querying', { menuItemId });
  let q = supabase
    .from('reviews')
    .select(
      '*, user:users(name, email, avatar_url), photos:review_photos(*), replies:review_replies(*)',
    )
    .eq('menu_item_id', menuItemId);
  q = notFlagged(q);
  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(limit);
  debugLog('reviews.item', 'result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  return hydrateReviews((data ?? []) as any[]);
}

export type SubmitReviewInput = {
  location_id: string;
  menu_item_id: string | null;
  rating: number;
  text: string | null;
  portion_size: 'small' | 'right' | 'huge' | null;
  worth_the_price: boolean | null;
  mood_tags: string[];
  photo_urls: string[];
};

export class ReviewSubmitError extends Error {
  constructor(public step: 'review' | 'photos' | 'item-photos', message: string) {
    super(message);
    this.name = 'ReviewSubmitError';
  }
}

export async function submitReview(input: SubmitReviewInput): Promise<string> {
  debugLog('reviews.submit', 'inserting', {
    location_id: input.location_id,
    menu_item_id: input.menu_item_id,
    rating: input.rating,
    photoCount: input.photo_urls.length,
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ReviewSubmitError('review', 'Sign in to write a review');

  const { data: reviewRes, error } = await supabase
    .from('reviews')
    .insert({
      user_id: user.id,
      location_id: input.location_id,
      menu_item_id: input.menu_item_id,
      rating: input.rating,
      text: input.text,
      portion_size: input.portion_size,
      worth_the_price: input.worth_the_price,
      mood_tags: input.mood_tags,
    })
    .select('id')
    .single();
  debugLog('reviews.submit', 'review insert', {
    ok: !!reviewRes,
    id: reviewRes?.id,
    error: error?.message,
  });
  if (error || !reviewRes) {
    throw new ReviewSubmitError('review', error?.message ?? 'Failed to create review');
  }

  if (input.photo_urls.length > 0) {
    const { error: pErr } = await supabase.from('review_photos').insert(
      input.photo_urls.map((photo_url, display_order) => ({
        review_id: reviewRes.id,
        photo_url,
        display_order,
      })),
    );
    debugLog('reviews.submit', 'review_photos insert', { error: pErr?.message });
    if (pErr) {
      throw new ReviewSubmitError('photos', pErr.message);
    }

    if (input.menu_item_id) {
      const { error: miErr } = await supabase.from('menu_item_photos').insert(
        input.photo_urls.map((photo_url) => ({
          menu_item_id: input.menu_item_id!,
          user_id: user.id,
          photo_url,
          is_restaurant_uploaded: false,
          is_featured: false,
        })),
      );
      debugLog('reviews.submit', 'menu_item_photos insert', { error: miErr?.message });
      if (miErr) {
        throw new ReviewSubmitError('item-photos', miErr.message);
      }
    }
  }
  return reviewRes.id as string;
}

export type PhotoUploadResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

export async function uploadReviewPhoto(
  userId: string,
  uri: string,
  index: number,
): Promise<PhotoUploadResult> {
  try {
    const ext =
      uri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${userId}/${Date.now()}-${index}.${ext}`;
    debugLog('storage.review', 'uploading', { path });
    const res = await fetch(uri);
    const blob = await res.blob();
    const { error } = await supabase.storage
      .from('review-photos')
      .upload(path, blob, { contentType: blob.type || 'image/jpeg' });
    if (error) {
      debugLog('storage.review', 'upload error', { error: error.message });
      return { ok: false, error: error.message };
    }
    const { data } = supabase.storage.from('review-photos').getPublicUrl(path);
    debugLog('storage.review', 'uploaded', { publicUrl: data.publicUrl });
    return { ok: true, publicUrl: data.publicUrl };
  } catch (e: any) {
    debugLog('storage.review', 'caught', { message: e?.message });
    return { ok: false, error: e?.message ?? 'Upload failed' };
  }
}
