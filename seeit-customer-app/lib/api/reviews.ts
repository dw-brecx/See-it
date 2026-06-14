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

export async function fetchReviewsForLocation(
  locationId: string,
  limit = 30,
): Promise<ReviewWithAuthor[]> {
  debugLog('reviews.location', 'querying', { locationId });
  const { data, error } = await supabase
    .from('reviews')
    .select(
      '*, user:users(name, email, avatar_url), photos:review_photos(*), replies:review_replies(*)',
    )
    .eq('location_id', locationId)
    .neq('is_flagged', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  debugLog('reviews.location', 'result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  return hydrateReviews((data ?? []) as any[]);
}

/**
 * All non-flagged reviews across every location of a brand. Used to compute
 * the storefront-wide average (the bug was using the stored
 * locations.average_rating which never gets written by any trigger).
 */
export async function fetchReviewsForBrand(brandId: string): Promise<ReviewWithAuthor[]> {
  debugLog('reviews.brand', 'querying', { brandId });
  // Two-step because reviews.brand_id doesn't exist — go via locations.
  const { data: locs } = await supabase
    .from('locations')
    .select('id')
    .eq('brand_id', brandId);
  const locIds = (locs ?? []).map((l: any) => l.id);
  if (locIds.length === 0) {
    debugLog('reviews.brand', 'no locations for brand', { brandId });
    return [];
  }
  const { data, error } = await supabase
    .from('reviews')
    .select(
      '*, user:users(name, email, avatar_url), photos:review_photos(*), replies:review_replies(*)',
    )
    .in('location_id', locIds)
    .neq('is_flagged', true)
    .order('created_at', { ascending: false })
    .limit(100);
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
  const { data, error } = await supabase
    .from('reviews')
    .select(
      '*, user:users(name, email, avatar_url), photos:review_photos(*), replies:review_replies(*)',
    )
    .eq('menu_item_id', menuItemId)
    .neq('is_flagged', true)
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

/**
 * Insert the review row, then any review_photos. If a menu_item_id is set
 * we ALSO insert each photo into menu_item_photos with
 * is_restaurant_uploaded=false so the dish's photo carousel picks it up.
 * Without that step the customer never sees their own photo on the dish.
 */
export async function submitReview(input: SubmitReviewInput) {
  debugLog('reviews.submit', 'inserting review', {
    location_id: input.location_id,
    menu_item_id: input.menu_item_id,
    rating: input.rating,
    photoCount: input.photo_urls.length,
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to write a review');
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
  debugLog('reviews.submit', 'review insert result', {
    ok: !!reviewRes,
    id: reviewRes?.id,
    error: error?.message,
  });
  if (error || !reviewRes) throw error ?? new Error('Failed to create review');

  if (input.photo_urls.length > 0) {
    const { error: pErr } = await supabase.from('review_photos').insert(
      input.photo_urls.map((photo_url, display_order) => ({
        review_id: reviewRes.id,
        photo_url,
        display_order,
      })),
    );
    debugLog('reviews.submit', 'review_photos insert', { error: pErr?.message });

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
    }
  }
  return reviewRes.id as string;
}

/**
 * Upload an image from a local URI to the review-photos bucket and return the
 * public URL. Path: {userId}/{review-or-tmp}-{timestamp}-{i}.{ext}.
 */
export async function uploadReviewPhoto(
  userId: string,
  uri: string,
  index: number,
): Promise<string | null> {
  try {
    const ext = uri.split('.').pop()?.toLowerCase().split('?')[0] ?? 'jpg';
    const path = `${userId}/${Date.now()}-${index}.${ext}`;
    debugLog('storage.review', 'uploading', { path, uriPrefix: uri.slice(0, 32) });
    const res = await fetch(uri);
    const blob = await res.blob();
    const { error } = await supabase.storage
      .from('review-photos')
      .upload(path, blob, { contentType: blob.type || 'image/jpeg' });
    if (error) {
      debugLog('storage.review', 'upload error', { error: error.message });
      return null;
    }
    const { data } = supabase.storage.from('review-photos').getPublicUrl(path);
    debugLog('storage.review', 'uploaded', { publicUrl: data.publicUrl });
    return data.publicUrl;
  } catch (e: any) {
    debugLog('storage.review', 'caught', { message: e?.message });
    return null;
  }
}
