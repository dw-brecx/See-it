'use client';

import * as React from 'react';
import {
  CheckCircle2,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Search,
  Star,
  Unlink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBrand } from '@/components/BrandContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const GOOGLE_PREFIX = 'google:';

type Loc = { id: string; name: string; city: string | null };
type Connection = {
  qr_id: string;
  location_id: string;
  place_id: string;
};

type Place = {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
};

export function IntegrationsForm() {
  const { currentBrandId, currentBrand, brandLocations } = useBrand();
  const [loading, setLoading] = React.useState(true);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [googleStatus, setGoogleStatus] = React.useState<'unknown' | 'ok' | 'down'>(
    'unknown',
  );
  const [pickerFor, setPickerFor] = React.useState<Loc | null>(null);
  const [toDisconnect, setToDisconnect] = React.useState<Connection | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  const reload = React.useCallback(() => setReloadKey((k) => k + 1), []);

  React.useEffect(() => {
    if (!currentBrandId || brandLocations.length === 0) {
      setConnections([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const supabase = createClient();
      const locationIds = brandLocations.map((l) => l.id);
      const { data, error } = await supabase
        .from('qr_codes')
        .select('id, location_id, code')
        .in('location_id', locationIds);
      if (cancelled) return;
      if (error) {
        toast.error(`Failed to load integrations: ${error.message}`);
        setConnections([]);
      } else {
        const conns = (data ?? [])
          .filter((r) => typeof r.code === 'string' && r.code.startsWith(GOOGLE_PREFIX))
          .map((r) => ({
            qr_id: r.id,
            location_id: r.location_id,
            place_id: r.code.slice(GOOGLE_PREFIX.length),
          }));
        setConnections(conns);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentBrandId, brandLocations, reloadKey]);

  // Probe whether Google is configured
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/google/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '' }),
        });
        if (cancelled) return;
        if (res.status === 503) setGoogleStatus('down');
        else setGoogleStatus('ok');
      } catch {
        if (!cancelled) setGoogleStatus('down');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function disconnect() {
    if (!toDisconnect) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', toDisconnect.qr_id);
    if (error) {
      toast.error(`Disconnect failed: ${error.message}`);
      return;
    }
    toast.success('Disconnected from Google');
    setToDisconnect(null);
    reload();
  }

  async function connect(loc: Loc, place: Place) {
    const supabase = createClient();
    // Upsert: delete any existing google:* row for this location, then insert
    const { error: delErr } = await supabase
      .from('qr_codes')
      .delete()
      .eq('location_id', loc.id)
      .like('code', `${GOOGLE_PREFIX}%`);
    if (delErr) {
      toast.error(`Connect failed: ${delErr.message}`);
      return;
    }
    const { error } = await supabase.from('qr_codes').insert({
      location_id: loc.id,
      code: `${GOOGLE_PREFIX}${place.place_id}`,
    });
    if (error) {
      toast.error(`Connect failed: ${error.message}`);
      return;
    }
    toast.success(`Connected ${loc.name} to ${place.name}`);
    setPickerFor(null);
    reload();
  }

  if (!currentBrandId) {
    return (
      <Card className="p-0">
        <EmptyState
          icon={LinkIcon}
          title="No brand selected"
          description="Pick a brand in the sidebar to manage its integrations."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Google Business Profile</CardTitle>
          <CardDescription>
            Link each location to its Google listing so SeeIt can pull ratings,
            photos, hours, and reviews. Linking is per-location.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-3 px-6 pb-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : brandLocations.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No locations yet"
              description={`Add a location to ${currentBrand?.name ?? 'this brand'} first — Google connections are per-location.`}
            />
          ) : googleStatus === 'down' ? (
            <div className="px-6 pb-6">
              <div className="rounded-lg border border-dashed border-border bg-warm-50/60 px-4 py-6 text-center">
                <p className="text-[13px] font-medium">
                  Coming soon — connect in Settings → Integrations
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Google Places API isn't configured for this environment yet.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {brandLocations.map((loc) => {
                const conn = connections.find((c) => c.location_id === loc.id);
                return (
                  <li
                    key={loc.id}
                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{loc.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {loc.city ?? '—'}
                      </p>
                      {conn && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Connected
                          </Badge>
                          <span className="font-mono text-[10.5px] text-muted-foreground">
                            {conn.place_id}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {conn ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-destructive hover:bg-destructive/10"
                          onClick={() => setToDisconnect(conn)}
                        >
                          <Unlink className="h-3.5 w-3.5" /> Disconnect
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setPickerFor(loc)}
                        >
                          <LinkIcon className="h-3.5 w-3.5" /> Connect Google
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <PlacePickerDialog
        location={pickerFor}
        onOpenChange={(o) => !o && setPickerFor(null)}
        onPick={(place) => pickerFor && connect(pickerFor, place)}
      />

      <ConfirmDialog
        open={!!toDisconnect}
        onOpenChange={(o) => !o && setToDisconnect(null)}
        title="Disconnect from Google?"
        description="SeeIt will stop pulling ratings, photos, and reviews for this location."
        confirmLabel="Disconnect"
        destructive
        onConfirm={disconnect}
      />
    </div>
  );
}

function PlacePickerDialog({
  location,
  onOpenChange,
  onPick,
}: {
  location: Loc | null;
  onOpenChange: (o: boolean) => void;
  onPick: (place: Place) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Place[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (location) {
      const seed = `${location.name}${location.city ? ` ${location.city}` : ''}`.trim();
      setQuery(seed);
      setResults([]);
      setError(null);
      // Auto-search on open
      if (seed) {
        runSearch(seed);
      }
    } else {
      setQuery('');
      setResults([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.id]);

  async function runSearch(q: string) {
    if (!q.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch('/api/google/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim() }),
      });
      if (res.status === 503) {
        setError('Google Places isn’t configured for this environment yet.');
        setResults([]);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? `Search failed (${res.status})`);
        setResults([]);
        return;
      }
      const data = (await res.json()) as { results?: Place[] };
      setResults(data.results ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  return (
    <Dialog open={!!location} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Connect to Google Business Profile</DialogTitle>
          <DialogDescription>
            Find {location?.name ?? 'this location'} on Google to link its
            listing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Restaurant name + city"
            autoFocus
          />
          <Button type="submit" disabled={searching} className="gap-1.5">
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </Button>
        </form>

        <div className="max-h-[50vh] overflow-y-auto">
          {error && (
            <div className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-[12.5px] text-amber-800">
              {error}
            </div>
          )}
          {!error && !searching && results.length === 0 && (
            <p className="px-1 py-6 text-center text-[12.5px] text-muted-foreground">
              Search to find your listing.
            </p>
          )}
          <ul className="space-y-1.5">
            {results.map((p) => (
              <li key={p.place_id}>
                <button
                  type="button"
                  onClick={() => onPick(p)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-terracotta-200 hover:bg-terracotta-50/50"
                >
                  <p className="text-[13.5px] font-semibold">{p.name}</p>
                  <p className="truncate text-[11.5px] text-muted-foreground">
                    {p.formatted_address}
                  </p>
                  {p.rating != null && (
                    <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-amber-700">
                      <Star className="h-3 w-3 fill-current" />
                      {p.rating.toFixed(1)}
                      {p.user_ratings_total != null && (
                        <span className="text-muted-foreground">
                          ({p.user_ratings_total})
                        </span>
                      )}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
