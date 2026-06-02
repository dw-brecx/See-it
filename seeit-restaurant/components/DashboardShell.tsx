'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { BrandProvider, type BrandRef, type LocationRef } from '@/components/BrandContext';
import { cn } from '@/lib/utils';

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
  };
  brands: BrandRef[];
  locations: LocationRef[];
  children: React.ReactNode;
};

type ShellContext = {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const ShellCtx = React.createContext<ShellContext | null>(null);

export function useShell() {
  const ctx = React.useContext(ShellCtx);
  if (!ctx) throw new Error('useShell must be used within DashboardShell');
  return ctx;
}

export function DashboardShell({ user, brands, locations, children }: Props) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  return (
    <BrandProvider brands={brands} locations={locations}>
      <ShellCtx.Provider value={{ mobileOpen, setMobileOpen }}>
        <div className="flex min-h-screen bg-background">
          <div
            aria-hidden={!mobileOpen}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden',
              mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          />

          <div
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-[280px] transform bg-card shadow-soft-xl transition-transform md:sticky md:top-0 md:z-auto md:w-[260px] md:translate-x-0 md:shadow-none',
              mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
            )}
          >
            <Sidebar user={user} onLinkClick={() => setMobileOpen(false)} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
      </ShellCtx.Provider>
    </BrandProvider>
  );
}
