import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase/client';

/**
 * Live brand-wide rating + review count. The stored `locations.review_count`
 * + `locations.average_rating` aren't kept up to date by any trigger, so
 * cards were showing "0 reviews" while the storefront (live-computed)
 * showed "1 review". This hook is the per-card source of truth.
 *
 * Cached per brand_id under the same key so multiple cards rendering the
 * same brand share a single round trip.
 */
export function useBrandRating(brandId: string | null | undefined) {
  return useQuery({
    queryKey: ['brand-rating', brandId],
    queryFn: async (): Promise<{ rating: number; count: number }> => {
      if (!brandId) return { rating: 0, count: 0 };
      const { data: locs } = await supabase
        .from('locations')
        .select('id')
        .eq('brand_id', brandId);
      const locIds = (locs ?? []).map((l: any) => l.id);
      if (locIds.length === 0) return { rating: 0, count: 0 };
      // Pull just the rating column — no joins, no photos, tiny payload.
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .in('location_id', locIds)
        .or('is_flagged.is.null,is_flagged.eq.false');
      const list = (reviews ?? []) as { rating: number | null }[];
      const count = list.length;
      const rating =
        count === 0
          ? 0
          : list.reduce((s, r) => s + (r.rating ?? 0), 0) / count;
      return { rating, count };
    },
    enabled: !!brandId,
    staleTime: 60 * 1000,
  });
}
