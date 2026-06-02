'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Camera,
  Clock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type RecSeverity = 'low' | 'medium' | 'high';
export type RecCategory =
  | 'menu'
  | 'photos'
  | 'reviews'
  | 'hours'
  | 'profile'
  | 'kosher';

type Props = {
  severity: RecSeverity;
  title: string;
  description: string;
  category: RecCategory;
  fixHref: string;
  fixLabel?: string;
  /** When true, render a small "AI" sparkle badge to differentiate AI-sourced recs. */
  aiGenerated?: boolean;
};

const CATEGORY_ICON: Record<RecCategory, LucideIcon> = {
  menu: UtensilsCrossed,
  photos: Camera,
  reviews: MessageSquare,
  hours: Clock,
  profile: Building2,
  kosher: ShieldCheck,
};

const SEVERITY_TOKENS: Record<
  RecSeverity,
  {
    rail: string;
    chipBg: string;
    chipText: string;
    chipBorder: string;
    iconBg: string;
    iconText: string;
    iconRing: string;
    label: string;
  }
> = {
  high: {
    rail: 'before:bg-rose-500',
    chipBg: 'bg-rose-50',
    chipText: 'text-rose-700',
    chipBorder: 'border-rose-100',
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
    iconRing: 'ring-rose-100',
    label: 'High priority',
  },
  medium: {
    rail: 'before:bg-amber-500',
    chipBg: 'bg-amber-50',
    chipText: 'text-amber-700',
    chipBorder: 'border-amber-100',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-700',
    iconRing: 'ring-amber-100',
    label: 'Medium',
  },
  low: {
    rail: 'before:bg-blue-500',
    chipBg: 'bg-blue-50',
    chipText: 'text-blue-700',
    chipBorder: 'border-blue-100',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    iconRing: 'ring-blue-100',
    label: 'Low',
  },
};

export function AIRecommendationCard({
  severity,
  title,
  description,
  category,
  fixHref,
  fixLabel = 'Fix it',
  aiGenerated = false,
}: Props) {
  const t = SEVERITY_TOKENS[severity];
  const Icon = CATEGORY_ICON[category];
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:-translate-y-px hover:shadow-soft',
        'before:absolute before:left-0 before:top-0 before:h-full before:w-[3px]',
        t.rail,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
            t.iconBg,
            t.iconText,
            t.iconRing,
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]',
                t.chipBg,
                t.chipText,
                t.chipBorder,
              )}
            >
              {t.label}
            </span>
            {aiGenerated && (
              <span className="inline-flex items-center gap-1 rounded-md border border-violet-100 bg-violet-50 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-violet-700">
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[14px] font-semibold leading-snug text-foreground">
            {title}
          </p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="shrink-0 sm:self-center">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full gap-1.5 sm:w-auto"
          >
            <Link href={fixHref}>
              {fixLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
