import { supabase } from '../supabase/client';
import { Review, ReviewPhoto, ReviewReply } from '../types';

export type ReviewWithAuthor = Review & {
  reviewer_name: string;
  reviewer_avatar_url: string | null;
  photos: ReviewPhoto[];
  reply: ReviewReply | null;
};

async function hydrateReviews(rows: any[]): Promise<ReviewWithAuthor[]> {
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
  const { data } = await supabase
    .from('reviews')
    .select(
      '*, user:users(name, email, avatar_url), photos:review_photos(*), replies:review_replies(*)',
    )
    .eq('location_id', locationId)
    .neq('is_flagged', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  return hydrateReviews((data ?? []) as any[]);
}

export async function fetchReviewsForMenuItem(
  menuItemId: string,
  limit = 20,
): Promise<ReviewWithAuthor[]> {
  const { data } = await supabase
    .from('reviews')
    .select(
      '*, user:users(name, email, avatar_url), photos:review_photos(*), replies:review_replies(*)',
    )
    .eq('menu_item_id', menuItemId)
    .neq('is_flagged', true)
    .order('created_at', { ascending: false })
    .limit(limit);
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

export async function submitReview(input: SubmitReviewInput) {
  const { data: reviewRes, error } = await supabase
    .from('reviews')
    .insert({
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
  if (error || !reviewRes) throw error ?? new Error('Failed to create review');

  if (input.photo_urls.length > 0) {
    await supabase.from('review_photos').insert(
      input.photo_urls.map((photo_url, display_order) => ({
        review_id: reviewRes.id,
        photo_url,
        display_order,
      })),
    );
  }
  return reviewRes.id as string;
}
