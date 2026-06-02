'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Menu, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationsBell } from '@/components/NotificationsBell';
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
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-8">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="h-10 w-10 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-4.5 w-4.5" />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[17px] font-semibold tracking-tight text-foreground sm:text-[19px]">
          {title}
        </h1>
        {subtitle && (
          <p className="hidden truncate text-[13px] text-muted-foreground sm:block">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Search trigger — opens the global command palette via Cmd+K */}
        <button
          type="button"
          onClick={() => {
            // Synthesize a Cmd+K event so we don't need a context just for this
            window.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'k', metaKey: true }),
            );
          }}
          className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[12.5px] text-muted-foreground shadow-xs transition-colors hover:bg-warm-50 hover:text-foreground md:flex"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Quick search</span>
          <kbd className="ml-2 rounded border border-border bg-warm-50 px-1 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>
        {children}
        <NotificationsBell />
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isPending}
          className="h-9 gap-1.5 px-3"
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
