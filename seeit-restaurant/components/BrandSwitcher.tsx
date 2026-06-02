'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBrand } from '@/components/BrandContext';
import { cn, initials } from '@/lib/utils';

export function BrandSwitcher() {
  const { brands, currentBrand, setCurrentBrandId } = useBrand();

  if (brands.length === 0) return null;

  // Single brand → render compact non-interactive version
  if (brands.length === 1) {
    const b = brands[0];
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2">
        <Avatar className="h-8 w-8 rounded-md">
          {b.logo_url ? <AvatarImage src={b.logo_url} /> : null}
          <AvatarFallback className="rounded-md bg-terracotta-100 text-[10px] font-semibold text-terracotta-700">
            {initials(b.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold leading-tight">
            {b.name}
          </p>
          <p className="text-[10.5px] text-muted-foreground">Your store</p>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2 text-left transition-colors hover:bg-warm-50"
        >
          <Avatar className="h-8 w-8 rounded-md">
            {currentBrand?.logo_url ? (
              <AvatarImage src={currentBrand.logo_url} />
            ) : null}
            <AvatarFallback className="rounded-md bg-terracotta-100 text-[10px] font-semibold text-terracotta-700">
              {currentBrand ? initials(currentBrand.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold leading-tight">
              {currentBrand?.name ?? 'Pick a store'}
            </p>
            <p className="text-[10.5px] text-muted-foreground">
              {brands.length} stores
            </p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px]" align="start">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">
          Your stores
        </DropdownMenuLabel>
        {brands.map((b) => {
          const active = b.id === currentBrand?.id;
          return (
            <DropdownMenuItem
              key={b.id}
              onClick={() => setCurrentBrandId(b.id)}
              className={cn(
                'gap-2.5',
                active && 'bg-terracotta-50 text-terracotta-800',
              )}
            >
              <Avatar className="h-6 w-6 rounded-md">
                {b.logo_url ? <AvatarImage src={b.logo_url} /> : null}
                <AvatarFallback className="rounded-md bg-terracotta-100 text-[10px] font-semibold text-terracotta-700">
                  {initials(b.name)}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-[13px]">{b.name}</span>
              {active && <Check className="h-3.5 w-3.5 text-terracotta-600" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding" className="gap-2 text-[13px]">
            <Plus className="h-3.5 w-3.5" />
            Add another store
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
