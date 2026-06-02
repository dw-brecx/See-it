import { Camera, MapPin, MessageSquare, Star, TrendingDown, TrendingUp, Users, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  reviewsThisMonth: number;
  reviewsLastMonth: number;
  photosThisWeek: number;
  averageRating: number | null;
  locationCount: number;
  teamCount: number;
};

/**
 * Compact KPI strip rendered above the tabs on the store detail page.
 * Six tiles, color-coded, with deltas where meaningful.
 */
export function SnapshotStrip({
  reviewsThisMonth,
  reviewsLastMonth,
  photosThisWeek,
  averageRating,
  locationCount,
  teamCount,
}: Props) {
  const reviewsDelta =
    reviewsLastMonth === 0
      ? reviewsThisMonth > 0
        ? { dir: 'up' as const, label: 'new' }
        : { dir: 'flat' as const, label: '—' }
      : {
          dir:
            reviewsThisMonth > reviewsLastMonth
              ? ('up' as const)
              : reviewsThisMonth < reviewsLastMonth
              ? ('down' as const)
              : ('flat' as const),
          label: `${Math.abs(reviewsThisMonth - reviewsLastMonth)}`,
        };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Tile
        tone="amber"
        icon={Star}
        label="Avg rating"
        value={averageRating != null ? averageRating.toFixed(1) : '—'}
        hint="Across all locations"
      />
      <Tile
        tone="terracotta"
        icon={MessageSquare}
        label="Reviews · 30d"
        value={reviewsThisMonth.toLocaleString()}
        trend={reviewsDelta}
        hint={`vs ${reviewsLastMonth} previous`}
      />
      <Tile
        tone="rose"
        icon={Camera}
        label="Photos · 7d"
        value={photosThisWeek.toLocaleString()}
        hint="Customer + staff uploads"
      />
      <Tile
        tone="blue"
        icon={MapPin}
        label="Locations"
        value={locationCount.toLocaleString()}
      />
      <Tile
        tone="emerald"
        icon={Users}
        label="Team"
        value={teamCount.toLocaleString()}
        hint="Owners + staff"
      />
    </div>
  );
}

type Tone = 'terracotta' | 'emerald' | 'blue' | 'amber' | 'rose' | 'violet';

const TONES: Record<Tone, { iconBg: string; iconText: string; iconRing: string }> = {
  terracotta: { iconBg: 'bg-terracotta-50', iconText: 'text-terracotta-600', iconRing: 'ring-terracotta-100' },
  emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', iconRing: 'ring-emerald-100' },
  blue: { iconBg: 'bg-blue-50', iconText: 'text-blue-600', iconRing: 'ring-blue-100' },
  amber: { iconBg: 'bg-amber-50', iconText: 'text-amber-700', iconRing: 'ring-amber-100' },
  rose: { iconBg: 'bg-rose-50', iconText: 'text-rose-600', iconRing: 'ring-rose-100' },
  violet: { iconBg: 'bg-violet-50', iconText: 'text-violet-600', iconRing: 'ring-violet-100' },
};

function Tile({
  tone,
  icon: Icon,
  label,
  value,
  hint,
  trend,
}: {
  tone: Tone;
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  trend?: { dir: 'up' | 'down' | 'flat'; label: string };
}) {
  const t = TONES[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
            t.iconBg,
            t.iconText,
            t.iconRing,
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <p className="text-[22px] font-bold tracking-tight tabular-nums">{value}</p>
        {trend && trend.dir !== 'flat' && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded text-[10.5px] font-semibold',
              trend.dir === 'up' ? 'text-emerald-700' : 'text-red-700',
            )}
          >
            {trend.dir === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.label}
          </span>
        )}
      </div>
      {hint && (
        <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
