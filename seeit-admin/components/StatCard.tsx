import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  /** Optional delta indicator e.g. `{ direction: 'up', label: '+12%' }`. */
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  className?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-px hover:shadow-soft-md',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-terracotta-50 text-terracotta-600 ring-1 ring-inset ring-terracotta-100">
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
              trend.direction === 'up' &&
                'bg-emerald-50 text-emerald-700',
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
