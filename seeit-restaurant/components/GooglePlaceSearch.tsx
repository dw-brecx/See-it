'use client';

import * as React from 'react';
import { Loader2, MapPin, Search, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';
import type { PlaceDetails, PlaceSummary } from '@/lib/google-places';

type Props = {
  /** Called when the user picks a place and the details fetch resolves. */
  onPick: (details: PlaceDetails) => void;
  className?: string;
};

/**
 * Search Google Places for a business and pick one. Calls the
 * server-side /api/google/search and /api/google/place/[id] routes
 * so the API key never reaches the browser. If the API is not
 * configured server-side, shows a friendly "not connected" state
 * rather than crashing.
 */
export function GooglePlaceSearch({ onPick, className }: Props) {
  const [query, setQuery] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [results, setResults] = React.useState<PlaceSummary[] | null>(null);
  const [pickingId, setPickingId] = React.useState<string | null>(null);
  const [notConfigured, setNotConfigured] = React.useState(false);
  const [searchedQuery, setSearchedQuery] = React.useState('');

  async function runSearch() {
    const q = query.trim();
    if (q.length < 2) {
      toast.error('Type at least 2 characters to search');
      return;
    }
    setSearching(true);
    setSearchedQuery(q);
    try {
      const res = await fetch(
        `/api/google/search?q=${encodeURIComponent(q)}`,
        { method: 'POST' },
      );
      if (res.status === 503) {
        setNotConfigured(true);
        setResults(null);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? 'Search failed');
        return;
      }
      const body = (await res.json()) as { results?: PlaceSummary[] };
      setResults(body.results ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function pick(p: PlaceSummary) {
    setPickingId(p.place_id);
    try {
      const res = await fetch(
        `/api/google/place/${encodeURIComponent(p.place_id)}`,
      );
      if (res.status === 503) {
        setNotConfigured(true);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? 'Could not load place details');
        return;
      }
      const body = (await res.json()) as { details?: PlaceDetails };
      if (!body.details) {
        toast.error('Place details not available');
        return;
      }
      onPick(body.details);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load place');
    } finally {
      setPickingId(null);
    }
  }

  if (notConfigured) {
    return (
      <div
        className={cn(
          'rounded-xl border border-border bg-card',
          className,
        )}
      >
        <EmptyState
          icon={MapPin}
          title="Google integration not configured"
          description="Skip this step and enter your restaurant details manually — you can connect Google later from Settings."
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder="Search for your restaurant — e.g. 'Joe's Pizza Brooklyn'"
          className="h-11 flex-1"
        />
        <Button
          type="button"
          onClick={runSearch}
          disabled={searching}
          className="h-11 gap-1.5"
        >
          {searching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Search Google
            </>
          )}
        </Button>
      </div>

      {results !== null && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="rounded-md border border-border bg-warm-50/50 px-4 py-3 text-sm text-muted-foreground">
              No results for "{searchedQuery}". Try a different query — or skip
              and enter details manually below.
            </p>
          ) : (
            results.map((p) => {
              const loading = pickingId === p.place_id;
              return (
                <button
                  key={p.place_id}
                  type="button"
                  onClick={() => pick(p)}
                  disabled={pickingId !== null}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-terracotta-300 hover:bg-warm-50/40',
                    loading && 'opacity-60',
                  )}
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-terracotta-50 text-terracotta-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="truncate text-[12.5px] text-muted-foreground">
                      {p.formatted_address}
                    </p>
                    {typeof p.rating === 'number' && (
                      <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {p.rating.toFixed(1)}
                        {p.user_ratings_total
                          ? ` · ${p.user_ratings_total.toLocaleString()} reviews`
                          : ''}
                      </p>
                    )}
                  </div>
                  {loading && (
                    <Loader2 className="mt-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
