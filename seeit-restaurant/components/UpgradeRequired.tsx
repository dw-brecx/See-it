'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Crown, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPlan, type PlanSlug } from '@/lib/plans';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanSlug;
  feature:
    | 'locations'
    | 'menuItems'
    | 'aiFeatures'
    | 'bulkUpload'
    | 'customBranding';
  /** Optional context, e.g. "to add a 2nd location". */
  context?: string;
};

const FEATURE_COPY: Record<
  Props['feature'],
  { title: string; description: string; recommended: PlanSlug }
> = {
  locations: {
    title: 'Add more locations',
    description:
      'Your Starter plan includes 1 location. Upgrade to Pro for unlimited locations.',
    recommended: 'pro',
  },
  menuItems: {
    title: 'Add more menu items',
    description:
      'Your Starter plan includes 25 menu items per location. Upgrade to Pro for unlimited items.',
    recommended: 'pro',
  },
  aiFeatures: {
    title: 'Unlock AI tools',
    description:
      'AI-generated descriptions, smart review replies, and health-check recommendations are part of Pro.',
    recommended: 'pro',
  },
  bulkUpload: {
    title: 'Unlock bulk upload',
    description:
      'CSV bulk-upload your entire menu in one shot. Available on Pro and Premium.',
    recommended: 'pro',
  },
  customBranding: {
    title: 'Custom branding',
    description:
      'Theme colors and custom branding across your storefront are unlocked on Premium.',
    recommended: 'premium',
  },
};

export function UpgradeRequired({
  open,
  onOpenChange,
  currentPlan,
  feature,
  context,
}: Props) {
  const copy = FEATURE_COPY[feature];
  const current = getPlan(currentPlan);
  const recommended = getPlan(copy.recommended);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-terracotta-50 text-terracotta-600">
              {copy.recommended === 'premium' ? (
                <Crown className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </div>
            <Badge variant="default" className="capitalize">
              {current.name} plan
            </Badge>
          </div>
          <DialogTitle className="mt-2">{copy.title}</DialogTitle>
          <DialogDescription>
            {context ? `${context}. ` : ''}
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-terracotta-100 bg-terracotta-50/40 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[15px] font-semibold">{recommended.name}</p>
            <p className="text-[15px] font-bold">
              ${recommended.pricePerLocation}
              <span className="text-[11.5px] font-normal text-muted-foreground">
                /location/month
              </span>
            </p>
          </div>
          <ul className="mt-3 space-y-1.5 text-[12.5px]">
            {recommended.maxLocations === Infinity && (
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-terracotta-500" />
                Unlimited locations
              </li>
            )}
            {recommended.maxMenuItemsPerLocation === Infinity && (
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-terracotta-500" />
                Unlimited menu items per location
              </li>
            )}
            {recommended.aiFeaturesEnabled && (
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-terracotta-500" />
                AI menu descriptions + review replies
              </li>
            )}
            {recommended.bulkUpload && (
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-terracotta-500" />
                CSV bulk upload
              </li>
            )}
            {recommended.customBranding && (
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-terracotta-500" />
                Custom branding + theme color
              </li>
            )}
            {recommended.prioritySupport && (
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-terracotta-500" />
                Priority support
              </li>
            )}
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
          <Button asChild className="gap-1.5">
            <Link href="/dashboard/billing/plans">
              View plans
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
