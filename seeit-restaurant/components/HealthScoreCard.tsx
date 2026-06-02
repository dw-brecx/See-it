'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HealthBreakdownItem = {
  label: string;
  points: number;
  max: number;
  met: boolean;
};

type Props = {
  score: number;
  breakdown: HealthBreakdownItem[];
  /** Optional title override. */
  title?: string;
  /** Optional subtitle override. */
  subtitle?: string;
};

function ringColor(score: number) {
  if (score >= 80) return '#10B981'; // emerald-500
  if (score >= 60) return '#F59E0B'; // amber-500
  return '#F43F5E'; // rose-500
}

function ringTone(score: number) {
  if (score >= 80) return 'emerald';
  if (score >= 60) return 'amber';
  return 'rose';
}

function CircularRing({ score }: { score: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  const stroke = 14;
  const radius = 70;
  const size = (radius + stroke) * 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - safe / 100);
  const color = ringColor(safe);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F0EDE3"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[44px] font-bold leading-none tabular-nums tracking-tight"
          style={{ color }}
        >
          {safe}
        </span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          out of 100
        </span>
      </div>
    </div>
  );
}

export function HealthScoreCard({
  score,
  breakdown,
  title = 'Listing health score',
  subtitle = 'How complete and discoverable your listing is right now.',
}: Props) {
  const tone = ringTone(score);
  const toneClasses: Record<string, { chip: string; bar: string; text: string }> = {
    emerald: {
      chip: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      bar: 'bg-emerald-500',
      text: 'text-emerald-700',
    },
    amber: {
      chip: 'bg-amber-50 text-amber-700 border-amber-100',
      bar: 'bg-amber-500',
      text: 'text-amber-700',
    },
    rose: {
      chip: 'bg-rose-50 text-rose-700 border-rose-100',
      bar: 'bg-rose-500',
      text: 'text-rose-700',
    },
  };
  const t = toneClasses[tone];

  const summary =
    score >= 80
      ? 'Looking great. A few finishing touches will push you higher.'
      : score >= 60
        ? 'Solid foundation — there are clear wins below.'
        : 'Plenty to improve. Knock these out for a big jump.';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-terracotta-100/30 blur-3xl"
      />
      <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <CircularRing score={score} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]',
              t.chip,
            )}
          >
            <Sparkles className="h-3 w-3" />
            {title}
          </div>
          <h3 className="mt-3 text-[22px] font-bold leading-tight tracking-tight text-foreground sm:text-[24px]">
            {summary}
          </h3>
          <p className="mt-1.5 max-w-lg text-[13.5px] text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {breakdown.map((b, i) => {
            const pct = b.max === 0 ? 0 : Math.max(0, Math.min(1, b.points / b.max));
            return (
              <div
                key={`${b.label}-${i}`}
                className="flex items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'truncate text-[12.5px]',
                        b.met ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {b.label}
                    </span>
                    <span className="shrink-0 tabular-nums text-[11.5px] font-semibold text-muted-foreground">
                      {b.points}/{b.max}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-warm-100">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        b.met
                          ? pct >= 0.99
                            ? 'bg-emerald-500'
                            : t.bar
                          : 'bg-warm-300',
                      )}
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
