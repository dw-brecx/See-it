'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ALL_LOCATIONS, useBrand } from '@/components/BrandContext';
import { cn } from '@/lib/utils';

export function LocationSwitcher() {
  const { brandLocations, currentLocation, currentLocationId, setCurrentLocationId } = useBrand();

  if (brandLocations.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-warm-50/50 px-2.5 py-1.5 text-[11.5px] text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        No locations yet
      </div>
    );
  }

  const label =
    currentLocationId === ALL_LOCATIONS
      ? 'All locations'
      : currentLocation
        ? currentLocation.name
        : 'Pick a location';

  // Single location → just label
  if (brandLocations.length === 1) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11.5px]">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="truncate font-medium">{brandLocations[0].name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-warm-50"
        >
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px]" align="start">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">
          Filter by location
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => setCurrentLocationId(ALL_LOCATIONS)}
          className={cn(
            'gap-2',
            currentLocationId === ALL_LOCATIONS &&
              'bg-terracotta-50 text-terracotta-800',
          )}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span className="flex-1 text-[13px]">All locations</span>
          {currentLocationId === ALL_LOCATIONS && (
            <Check className="h-3.5 w-3.5 text-terracotta-600" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {brandLocations.map((l) => {
          const active = l.id === currentLocationId;
          return (
            <DropdownMenuItem
              key={l.id}
              onClick={() => setCurrentLocationId(l.id)}
              className={cn(
                'gap-2',
                active && 'bg-terracotta-50 text-terracotta-800',
              )}
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1 truncate text-[13px]">
                {l.name}
                {l.city && (
                  <span className="ml-1 text-[11px] text-muted-foreground">
                    · {l.city}
                  </span>
                )}
              </span>
              {active && <Check className="h-3.5 w-3.5 text-terracotta-600" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
