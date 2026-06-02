/**
 * Plan tier definitions — shared across admin + restaurant apps.
 *
 * Currently uses `brands.plan` (a text column) as source of truth.
 * Default is 'free'.
 */

export const PLANS = {
  free: {
    slug: 'free' as const,
    name: 'Starter',
    pricePerLocation: 0,
    maxLocations: 1,
    maxMenuItemsPerLocation: 25,
    aiFeaturesEnabled: false,
    bulkUpload: false,
    customBranding: false,
    prioritySupport: false,
  },
  pro: {
    slug: 'pro' as const,
    name: 'Pro',
    pricePerLocation: 50,
    maxLocations: Infinity,
    maxMenuItemsPerLocation: Infinity,
    aiFeaturesEnabled: true,
    bulkUpload: true,
    customBranding: false,
    prioritySupport: false,
  },
  premium: {
    slug: 'premium' as const,
    name: 'Premium',
    pricePerLocation: 100,
    maxLocations: Infinity,
    maxMenuItemsPerLocation: Infinity,
    aiFeaturesEnabled: true,
    bulkUpload: true,
    customBranding: true,
    prioritySupport: true,
  },
} as const;

export type PlanSlug = keyof typeof PLANS;
export type PlanConfig = (typeof PLANS)[PlanSlug];

/** Resolve a plan config from a brand row's plan field (or anything plan-like). */
export function getPlan(slug: string | null | undefined): PlanConfig {
  if (slug && slug in PLANS) return PLANS[slug as PlanSlug];
  return PLANS.free;
}

/** True when usage has hit the limit for this plan + dimension. */
export function isAtLimit(
  plan: PlanConfig,
  dimension: 'locations' | 'menuItemsPerLocation',
  currentCount: number,
): boolean {
  const limit =
    dimension === 'locations'
      ? plan.maxLocations
      : plan.maxMenuItemsPerLocation;
  return currentCount >= limit;
}

/** True when within 80% of the limit but not yet over — used for warning banners. */
export function isApproachingLimit(
  plan: PlanConfig,
  dimension: 'locations' | 'menuItemsPerLocation',
  currentCount: number,
): boolean {
  const limit =
    dimension === 'locations'
      ? plan.maxLocations
      : plan.maxMenuItemsPerLocation;
  if (!Number.isFinite(limit)) return false;
  return currentCount >= Math.floor(limit * 0.8) && currentCount < limit;
}

/**
 * Friendly label like "1 of 1", "20 of 25", "12" (unlimited).
 */
export function usageLabel(
  plan: PlanConfig,
  dimension: 'locations' | 'menuItemsPerLocation',
  currentCount: number,
): string {
  const limit =
    dimension === 'locations'
      ? plan.maxLocations
      : plan.maxMenuItemsPerLocation;
  if (!Number.isFinite(limit)) return String(currentCount);
  return `${currentCount} of ${limit}`;
}
