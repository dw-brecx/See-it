import { useQuery } from '@tanstack/react-query';
import { fetchReviewsForLocation, fetchReviewsForMenuItem } from '../api/reviews';

export function useLocationReviews(locationId: string | undefined) {
  return useQuery({
    queryKey: ['reviews-loc', locationId],
    queryFn: () => fetchReviewsForLocation(locationId!),
    enabled: !!locationId,
  });
}

export function useMenuItemReviews(menuItemId: string | undefined) {
  return useQuery({
    queryKey: ['reviews-item', menuItemId],
    queryFn: () => fetchReviewsForMenuItem(menuItemId!),
    enabled: !!menuItemId,
  });
}
