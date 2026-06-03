'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBrand } from '@/components/BrandContext';
import { cn, initials } from '@/lib/utils';

/**
 * Static brand display for the sidebar. Each restaurant_owner account owns
 * exactly one brand on SeeIt, so this replaces the multi-brand switcher.
 *
 * Clickable — jumps to Settings → Store profile for editing.
 */
export function BrandBadge() {
  const { currentBrand } = useBrand();

  if (!currentBrand) {
    return null;
  }

  return (
    <Link
      href="/dashboard/settings/profile"
      className={cn(
        'flex items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2 transition-colors',
        'hover:border-warm-300 hover:bg-warm-50',
      )}
      title="Edit store settings"
    >
      <Avatar className="h-8 w-8 rounded-md">
        {currentBrand.logo_url ? (
          <AvatarImage src={currentBrand.logo_url} alt={currentBrand.name} />
        ) : null}
        <AvatarFallback className="rounded-md bg-terracotta-100 text-[11px] font-semibold text-terracotta-700">
          {initials(currentBrand.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-tight">
          {currentBrand.name}
        </p>
        <p className="text-[10.5px] text-muted-foreground">Edit store</p>
      </div>
      <Settings className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
