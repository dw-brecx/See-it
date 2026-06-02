'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LocationOpenBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LocationForm } from '@/components/forms/LocationForm';
import { createClient } from '@/lib/supabase/client';
import type { WeekHours } from '@/lib/constants';

type Location = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_photo_url: string | null;
  description: string | null;
  dietary_tags: string[] | null;
  style_tags: string[] | null;
  is_temporarily_closed: boolean;
  reopening_date: string | null;
  hours: WeekHours | null;
  brand_id: string;
  average_rating: number | null;
  review_count: number | null;
};

type Props = {
  brandId: string;
  locations: Location[];
};

export function LocationsPanel({ brandId, locations }: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Location | null>(null);
  const [editKosher, setEditKosher] = React.useState<any>(null);
  const [duplicateOf, setDuplicateOf] = React.useState<Location | null>(null);
  const [duplicateKosher, setDuplicateKosher] = React.useState<any>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<Location | null>(null);

  async function openDuplicate(loc: Location) {
    const supabase = createClient();
    const { data: cert } = await supabase
      .from('kosher_certifications')
      .select('*')
      .eq('location_id', loc.id)
      .maybeSingle();
    // Strip id & cert id so the form treats it as a brand-new create
    setDuplicateKosher(cert ? { ...cert, id: undefined, location_id: undefined } : null);
    setDuplicateOf({
      ...loc,
      // Append "(copy)" so the user sees a clear distinguisher and edits if needed
      name: `${loc.name} (copy)`,
    });
  }

  async function openEdit(loc: Location) {
    const supabase = createClient();
    // Fetch existing kosher cert (if any) to pre-fill
    const { data: cert } = await supabase
      .from('kosher_certifications')
      .select('*')
      .eq('location_id', loc.id)
      .maybeSingle();
    setEditKosher(cert ?? null);
    setEditing(loc);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', confirmDelete.id);
    if (error) {
      toast.error(`Could not delete: ${error.message}`);
      return;
    }
    toast.success(`Deleted ${confirmDelete.name}`);
    setConfirmDelete(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button
          onClick={() => setAddOpen(true)}
          className="w-full gap-1.5 sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Add location
        </Button>
      </div>

      {locations.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={MapPin}
            title="No locations yet"
            description="Add the first location for this brand."
            action={
              <Button onClick={() => setAddOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add location
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {locations.map((loc) => (
            <li
              key={loc.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6"
            >
              <Avatar className="h-12 w-12 shrink-0 rounded-md">
                {loc.cover_photo_url ? (
                  <AvatarImage src={loc.cover_photo_url} alt={loc.name} />
                ) : null}
                <AvatarFallback className="rounded-md">
                  <MapPin className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{loc.name}</p>
                  <LocationOpenBadge closed={!!loc.is_temporarily_closed} />
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {loc.address}
                  {loc.city ? `, ${loc.city}` : ''}
                  {loc.state ? `, ${loc.state}` : ''}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span className="tabular-nums">
                    {loc.average_rating?.toFixed(1) ?? '—'}
                  </span>
                  <span>·</span>
                  <span>{loc.review_count ?? 0} reviews</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => openEdit(loc)}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => openDuplicate(loc)}
                  title="Clone this location's details into a new one"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(loc)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Delete</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add */}
      <LocationForm
        open={addOpen}
        onOpenChange={setAddOpen}
        brandId={brandId}
      />

      {/* Edit */}
      <LocationForm
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
            setEditKosher(null);
          }
        }}
        brandId={brandId}
        location={editing}
        kosherCert={editKosher}
      />

      {/* Duplicate — opens the same form pre-filled as a create (no `location` prop) */}
      <LocationForm
        open={!!duplicateOf}
        onOpenChange={(o) => {
          if (!o) {
            setDuplicateOf(null);
            setDuplicateKosher(null);
          }
        }}
        brandId={brandId}
        initialValues={duplicateOf ?? undefined}
        kosherCert={duplicateKosher}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title={`Delete ${confirmDelete?.name}?`}
        description="This removes the location, its menu, and reviews tied to it. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
