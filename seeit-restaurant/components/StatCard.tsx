import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatTone =
  | 'terracotta'
  | 'emerald'
  | 'blue'
  | 'amber'
  | 'violet'
  | 'rose'
  | 'warm';

const TONES: Record<
  StatTone,
  { iconBg: string; iconText: string; iconRing: string; accent: string }
> = {
  terracotta: {
    iconBg: 'bg-terracotta-50',
    iconText: 'text-terracotta-600',
    iconRing: 'ring-terracotta-100',
    accent: 'before:bg-terracotta-400/70',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    iconRing: 'ring-emerald-100',
    accent: 'before:bg-emerald-400/70',
  },
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    iconRing: 'ring-blue-100',
    accent: 'before:bg-blue-400/70',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-700',
    iconRing: 'ring-amber-100',
    accent: 'before:bg-amber-400/70',
  },
  violet: {
    iconBg: 'bg-violet-50',
    iconText: 'text-violet-600',
    iconRing: 'ring-violet-100',
    accent: 'before:bg-violet-400/70',
  },
  rose: {
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
    iconRing: 'ring-rose-100',
    accent: 'before:bg-rose-400/70',
  },
  warm: {
    iconBg: 'bg-warm-100',
    iconText: 'text-warm-700',
    iconRing: 'ring-warm-200',
    accent: 'before:bg-warm-300/70',
  },
};

type Props = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  /** Color theme for the icon chip + the left rail accent. Defaults to terracotta. */
  tone?: StatTone;
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  className?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'terracotta',
  trend,
  className,
}: Props) {
  const t = TONES[tone];
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-px hover:shadow-soft-md',
        // Top color bar — subtle but enough to differentiate cards
        'before:absolute before:left-0 before:right-0 before:top-0 before:h-[3px]',
        t.accent,
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset transition-transform group-hover:scale-105',
            t.iconBg,
            t.iconText,
            t.iconRing,
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-[28px] font-bold tracking-tight tabular-nums text-foreground">
          {value}
        </p>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
              trend.direction === 'up' && 'bg-emerald-50 text-emerald-700',
              trend.direction === 'down' && 'bg-red-50 text-red-700',
              trend.direction === 'flat' && 'bg-warm-100 text-warm-700',
            )}
          >
            {trend.direction === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {trend.direction === 'down' && <ArrowDownRight className="h-3 w-3" />}
            {trend.label}
          </span>
        )}
      </div>
      {hint && (
        <p className="mt-1.5 text-[12.5px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
