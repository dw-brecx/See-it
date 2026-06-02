'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Loader2,
  MapPin,
  Plus,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/EmptyState';
import { LocationOpenBadge } from '@/components/StatusBadge';
import { useBrand } from '@/components/BrandContext';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { LocationFormSheet } from './location-form-sheet';

type LocationCardRow = {
  id: string;
  brand_id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  cover_photo_url: string | null;
  is_temporarily_closed: boolean | null;
  average_rating: number | null;
  review_count: number | null;
  dietary_tags: string[] | null;
};

export function LocationsList() {
  const { currentBrandId } = useBrand();
  const [rows, setRows] = React.useState<LocationCardRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [googleFor, setGoogleFor] = React.useState<LocationCardRow | null>(null);

  const refresh = React.useCallback(async () => {
    if (!currentBrandId) {
      setRows([]);
      return;
    }
    setRows(null);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('locations')
      .select(
        'id, brand_id, name, address, city, state, zip, phone, cover_photo_url, is_temporarily_closed, average_rating, review_count, dietary_tags',
      )
      .eq('brand_id', currentBrandId)
      .order('name', { ascending: true });
    if (error) {
      setError(error.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as any);
  }, [currentBrandId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  if (rows === null) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load locations: {error}
        </div>
      )}

      {rows.length === 0 ? (
        <Card className="overflow-hidden p-0">
          <EmptyState
            icon={MapPin}
            title="No locations yet"
            description="Add your first storefront to start collecting reviews and showing up in searches."
            action={
              <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add location
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((loc) => (
            <LocationCard
              key={loc.id}
              loc={loc}
              onEdit={() => setEditingId(loc.id)}
              onConnectGoogle={() => setGoogleFor(loc)}
            />
          ))}
          <AddLocationCard onClick={() => setCreateOpen(true)} />
        </div>
      )}

      {/* Edit sheet */}
      <LocationFormSheet
        open={editingId !== null}
        onOpenChange={(o) => !o && setEditingId(null)}
        locationId={editingId}
        onSaved={refresh}
      />

      {/* Create sheet */}
      <LocationFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        locationId={null}
        onSaved={refresh}
      />

      {/* Google connect dialog */}
      <ConnectGoogleDialog
        location={googleFor}
        onClose={() => setGoogleFor(null)}
        onApplied={refresh}
      />
    </div>
  );
}

function LocationCard({
  loc,
  onEdit,
  onConnectGoogle,
}: {
  loc: LocationCardRow;
  onEdit: () => void;
  onConnectGoogle: () => void;
}) {
  const tags = (loc.dietary_tags ?? []).slice(0, 4);
  const cityLine = [loc.city, loc.state].filter(Boolean).join(', ');

  return (
    <Card className="flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-soft">
      <button
        type="button"
        onClick={onEdit}
        className="relative aspect-[16/9] w-full overflow-hidden bg-warm-100 text-left"
        aria-label={`Edit ${loc.name}`}
      >
        {loc.cover_photo_url ? (
          <Image
            src={loc.cover_photo_url}
            alt={loc.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-warm-400">
            <MapPin className="h-10 w-10" />
          </div>
        )}
        <span className="absolute right-2 top-2">
          <LocationOpenBadge closed={!!loc.is_temporarily_closed} />
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <button
          type="button"
          onClick={onEdit}
          className="text-left text-[16px] font-semibold leading-tight hover:text-terracotta-700"
        >
          {loc.name}
        </button>
        <p className="text-[12.5px] text-muted-foreground">
          {loc.address}
          {cityLine ? ` · ${cityLine}` : ''}
          {loc.zip ? ` ${loc.zip}` : ''}
        </p>

        <div className="flex items-center gap-2 text-[12.5px]">
          {loc.average_rating != null ? (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="font-semibold tabular-nums">
                {Number(loc.average_rating).toFixed(1)}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">No ratings yet</span>
          )}
          <span className="text-muted-foreground/40">·</span>
          <span className="text-muted-foreground">
            {loc.review_count ?? 0} review{(loc.review_count ?? 0) === 1 ? '' : 's'}
          </span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <Badge
                key={t}
                variant={t === 'Kosher' ? 'secondary' : 'default'}
              >
                {t}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-9 flex-1"
          >
            Edit details
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onConnectGoogle}
            className="h-9 gap-1.5"
            title="Refresh hours & phone from Google"
          >
            <Globe className="h-3.5 w-3.5" /> Google
          </Button>
        </div>
      </div>
    </Card>
  );
}

function AddLocationCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex aspect-[16/9] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-warm-300 bg-warm-50/60 p-6 transition-colors hover:border-terracotta-300 hover:bg-terracotta-50/50 sm:aspect-auto sm:min-h-[280px]',
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta-100 text-terracotta-600 group-hover:bg-terracotta-200">
        <Plus className="h-6 w-6" />
      </div>
      <p className="text-[14px] font-semibold text-foreground">
        Add new location
      </p>
      <p className="max-w-[14rem] text-center text-[12px] text-muted-foreground">
        New storefront, food truck, pop-up, or kitchen.
      </p>
    </button>
  );
}

// ───────────────────────── Google connect dialog ─────────────────────────

type GoogleCandidate = {
  place_id: string;
  name: string;
  formatted_address: string;
};

function ConnectGoogleDialog({
  location,
  onClose,
  onApplied,
}: {
  location: LocationCardRow | null;
  onClose: () => void;
  onApplied: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState(false);
  const [results, setResults] = React.useState<GoogleCandidate[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [applying, setApplying] = React.useState(false);
  const submittingRef = React.useRef(false);

  const open = location !== null;

  // Kick off the search when the dialog opens.
  React.useEffect(() => {
    if (!open || !location) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setUnavailable(false);
      setResults([]);
      setSelected(null);
      try {
        const q = [
          location.name,
          location.address,
          location.city,
          location.state,
        ]
          .filter(Boolean)
          .join(' ');
        const res = await fetch('/api/google/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        });
        if (cancelled) return;
        if (res.status === 503) {
          setUnavailable(true);
          return;
        }
        if (!res.ok) {
          const msg = await res.text().catch(() => '');
          toast.error(`Google search failed: ${msg || res.statusText}`);
          return;
        }
        const data = (await res.json()) as {
          candidates?: GoogleCandidate[];
          results?: GoogleCandidate[];
        };
        const list = (data.candidates ?? data.results ?? []).slice(0, 5);
        setResults(list);
        if (list.length === 1) setSelected(list[0].place_id);
      } catch (err: any) {
        if (!cancelled)
          toast.error(`Google search failed: ${err?.message ?? 'network'}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, location?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function applyChoice() {
    if (submittingRef.current) return;
    if (!location || !selected) return;
    submittingRef.current = true;
    setApplying(true);
    try {
      const res = await fetch(
        `/api/google/place?place_id=${encodeURIComponent(selected)}`,
        { method: 'GET' },
      );
      if (res.status === 503) {
        setUnavailable(true);
        return;
      }
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        toast.error(`Google lookup failed: ${msg || res.statusText}`);
        return;
      }
      const place = (await res.json()) as {
        phone?: string | null;
        hours?: Record<string, unknown> | null;
      };

      const supabase = createClient();
      const patch: { phone?: string; hours?: Record<string, unknown> } = {};
      if (place.phone) patch.phone = place.phone;
      if (place.hours) patch.hours = place.hours;
      if (Object.keys(patch).length === 0) {
        toast.warning('No hours or phone found on Google for this place.');
        return;
      }
      const { error } = await supabase
        .from('locations')
        .update(patch)
        .eq('id', location.id);
      if (error) {
        toast.error(`Update failed: ${error.message}`);
        return;
      }
      toast.success(`Updated ${location.name} from Google.`);
      onApplied();
      onClose();
      router.refresh();
    } catch (err: any) {
      toast.error(`Apply failed: ${err?.message ?? 'network'}`);
    } finally {
      submittingRef.current = false;
      setApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to Google</DialogTitle>
          <DialogDescription>
            Pick the matching Google listing to refresh hours and phone for{' '}
            <span className="font-medium">{location?.name}</span>.
          </DialogDescription>
        </DialogHeader>

        {unavailable ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900">
            Coming soon — connect Google in Settings → Integrations.
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">
            No matching Google places found.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {results.map((r) => {
              const checked = r.place_id === selected;
              return (
                <li key={r.place_id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-2 rounded-md border p-2.5 transition-colors',
                      checked
                        ? 'border-terracotta-300 bg-terracotta-50/60'
                        : 'border-border bg-card hover:border-warm-300',
                    )}
                  >
                    <input
                      type="radio"
                      name="google-place"
                      checked={checked}
                      onChange={() => setSelected(r.place_id)}
                      className="mt-1 h-4 w-4 accent-terracotta-600"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold">
                        {r.name}
                      </p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {r.formatted_address}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={applying}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={applyChoice}
            disabled={unavailable || applying || !selected}
            className="w-full sm:w-auto"
          >
            {applying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Applying…
              </>
            ) : (
              'Apply'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
