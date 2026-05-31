import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  className?: string;
};

export function StatCard({ label, value, icon: Icon, hint, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-terracotta-100 text-terracotta-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
