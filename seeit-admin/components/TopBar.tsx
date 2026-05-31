'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export function TopBar({ title, subtitle, children }: Props) {
  const router = useRouter();
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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/85 px-6 backdrop-blur-md">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isPending}
          className="gap-1.5"
        >
          <RefreshCw
            className={cn('h-3.5 w-3.5', (spinning || isPending) && 'animate-spin')}
          />
          Refresh
        </Button>
      </div>
    </header>
  );
}
