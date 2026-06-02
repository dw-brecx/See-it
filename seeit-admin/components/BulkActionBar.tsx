'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
  className?: string;
};

/**
 * Sticky toolbar that animates in when one or more rows are selected on a
 * list page. Sits between the filters and the table card.
 */
export function BulkActionBar({ count, onClear, children, className }: Props) {
  if (count === 0) return null;
  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className={cn(
        'sticky top-[68px] z-10 flex flex-wrap items-center gap-2 rounded-xl border border-terracotta-200 bg-terracotta-50/95 px-3 py-2 shadow-soft backdrop-blur-md animate-fade-in-up',
        className,
      )}
    >
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear selection"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-terracotta-700 hover:bg-terracotta-100"
      >
        <X className="h-4 w-4" />
      </button>
      <span className="text-[13px] font-semibold text-terracotta-800 tabular-nums">
        {count} selected
      </span>
      <span className="mx-1 h-4 w-px bg-terracotta-200" aria-hidden />
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}
