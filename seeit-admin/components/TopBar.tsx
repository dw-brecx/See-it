'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Menu, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShell } from '@/components/DashboardShell';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export function TopBar({ title, subtitle, children }: Props) {
  const router = useRouter();
  const { setMobileOpen } = useShell();
  const [isPending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  function refresh() {
    setSpinning(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => setSpinning(false), 600);
    });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
      {/* Hamburger — mobile only */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {children}
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isPending}
          className="gap-1.5"
          aria-label="Refresh"
        >
          <RefreshCw
            className={cn('h-3.5 w-3.5', (spinning || isPending) && 'animate-spin')}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </header>
  );
}
