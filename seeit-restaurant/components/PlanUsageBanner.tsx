'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useBrand } from '@/components/BrandContext';
import { createClient } from '@/lib/supabase/client';
import {
  getPlan,
  isApproachingLimit,
  isAtLimit,
  type PlanSlug,
} from '@/lib/plans';

/**
 * Shows a warning banner when the current brand is approaching or at its
 * Starter-plan limits (locations or menu items). Hidden on Pro/Premium.
 */
export function PlanUsageBanner() {
  const { currentBrandId, currentBrand, brandLocations } = useBrand();
  const [maxItemsAcrossLocations, setMaxItems] = React.useState(0);

  const plan = getPlan(currentBrand?.plan);
  const planSlug = (currentBrand?.plan ?? 'free') as PlanSlug;

  React.useEffect(() => {
    if (!currentBrandId || brandLocations.length === 0) {
      setMaxItems(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      // For each location, count menu items; track the highest count for
      // banner copy ("X of 25 items at YourLocation").
      let highest = 0;
      for (const loc of brandLocations) {
        const { count } = await supabase
          .from('menu_items')
          .select('id', { count: 'exact', head: true })
          .eq('location_id', loc.id);
        if (count && count > highest) highest = count;
      }
      if (!cancelled) setMaxItems(highest);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentBrandId, brandLocations]);

  if (!currentBrandId) return null;
  if (planSlug !== 'free') return null;

  const locationsAtLimit = isAtLimit(plan, 'locations', brandLocations.length);
  const locationsApproaching = isApproachingLimit(
    plan,
    'locations',
    brandLocations.length,
  );
  const itemsAtLimit = isAtLimit(
    plan,
    'menuItemsPerLocation',
    maxItemsAcrossLocations,
  );
  const itemsApproaching = isApproachingLimit(
    plan,
    'menuItemsPerLocation',
    maxItemsAcrossLocations,
  );

  if (!locationsAtLimit && !locationsApproaching && !itemsAtLimit && !itemsApproaching) {
    return null;
  }

  let title = '';
  let body = '';
  if (locationsAtLimit) {
    title = "You're at your Starter location limit";
    body = `Starter includes ${plan.maxLocations} location. Upgrade to Pro for unlimited locations.`;
  } else if (itemsAtLimit) {
    title = "You've hit your menu item limit";
    body = `Starter includes ${plan.maxMenuItemsPerLocation} items per location. Upgrade to Pro for unlimited.`;
  } else if (itemsApproaching) {
    title = `Using ${maxItemsAcrossLocations} of ${plan.maxMenuItemsPerLocation} menu items`;
    body = 'Upgrade to Pro for unlimited menu items.';
  } else if (locationsApproaching) {
    title = `Using ${brandLocations.length} of ${plan.maxLocations} locations`;
    body = 'Upgrade to Pro for unlimited locations.';
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-amber-900">{title}</p>
        <p className="mt-0.5 text-[12.5px] text-amber-900/80">{body}</p>
      </div>
      <Link
        href="/dashboard/billing/plans"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-amber-700"
      >
        View plans
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
