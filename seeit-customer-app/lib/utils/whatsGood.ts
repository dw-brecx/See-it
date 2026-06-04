import { MenuItem } from '../types';

type ItemWithPhotos = MenuItem & { photo_count?: number };

/**
 * Score a menu item for "What's Good Here?" — owner-featured items always win,
 * then a combination of photo count + review count + rating + visibility.
 * Returns the top N items.
 */
export function pickWhatsGood(
  items: ItemWithPhotos[],
  featuredIds: string[],
  topN = 5,
): ItemWithPhotos[] {
  const featuredSet = new Set(featuredIds);
  const scored = items
    .filter((i) => i.is_visible !== false)
    .map((i) => ({
      item: i,
      featured: featuredSet.has(i.id),
      score:
        (i.photo_count ?? 0) * 2 +
        (i.review_count ?? 0) * 1.5 +
        (i.average_rating ?? 0) * 10,
    }))
    .sort((a, b) => {
      // Featured first, in the order chosen by the owner
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.featured && b.featured) {
        return featuredIds.indexOf(a.item.id) - featuredIds.indexOf(b.item.id);
      }
      return b.score - a.score;
    });
  return scored.slice(0, topN).map((s) => s.item);
}
