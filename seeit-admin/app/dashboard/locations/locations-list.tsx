'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Star, Trash2, Upload, EyeOff, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { LocationOpenBadge } from '@/components/StatusBadge';
import { BulkActionBar } from '@/components/BulkActionBar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CsvExportButton } from '@/components/CsvExportButton';
import { CsvImportDialog, type ImportField } from '@/components/CsvImportDialog';
import { useRowSelection } from '@/hooks/useRowSelection';
import { createClient } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';

type Row = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  cover_photo_url: string | null;
  average_rating: number | null;
  review_count: number | null;
  is_temporarily_closed: boolean | null;
  brand: { id: string; name: string; logo_url: string | null } | null;
};

type BrandOption = { id: string; name: string };

const IMPORT_FIELDS: ImportField[] = [
  { key: 'brand_id', label: 'Store ID (uuid)', required: true, aliases: ['brand', 'brand uuid', 'store', 'store uuid'] },
  { key: 'name', label: 'Name', required: true },
  { key: 'address', label: 'Address', required: true, aliases: ['street', 'street address'] },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip', label: 'ZIP', aliases: ['postal', 'postal code', 'zipcode'] },
  { key: 'country', label: 'Country' },
  { key: 'phone', label: 'Phone' },
  {
    key: 'latitude',
    label: 'Latitude',
    transform: (v) => (v ? Number(v) : null),
  },
  {
    key: 'longitude',
    label: 'Longitude',
    transform: (v) => (v ? Number(v) : null),
  },
];

export function LocationsList({
  rows,
  brands,
}: {
  rows: Row[];
  brands: BrandOption[];
}) {
  const router = useRouter();
  const ids = React.useMemo(() => rows.map((r) => r.id), [rows]);
  const sel = useRowSelection(ids);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  async function bulkDelete() {
    const supabase = createClient();
    const ids = [...sel.selectedIds];
    const { error } = await supabase.from('locations').delete().in('id', ids);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    await logAudit(supabase, {
      action: 'delete',
      targetType: 'location',
      metadata: { ids, count: ids.length },
    });
    toast.success(`Deleted ${sel.count} location${sel.count === 1 ? '' : 's'}`);
    setConfirmDelete(false);
    sel.clear();
    router.refresh();
  }

  async function bulkClose(close: boolean) {
    const supabase = createClient();
    const ids = [...sel.selectedIds];
    const { error } = await supabase
      .from('locations')
      .update({ is_temporarily_closed: close })
      .in('id', ids);
    if (error) {
      toast.error(`Update failed: ${error.message}`);
      return;
    }
    await logAudit(supabase, {
      action: close ? 'close' : 'reopen',
      targetType: 'location',
      metadata: { ids, count: ids.length },
    });
    toast.success(
      `${close ? 'Closed' : 'Reopened'} ${sel.count} location${sel.count === 1 ? '' : 's'}`,
    );
    sel.clear();
    router.refresh();
  }

  async function exportAll() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('locations')
      .select(
        'id, name, address, city, state, zip, country, phone, latitude, longitude, is_temporarily_closed, average_rating, review_count, brand:brands(name), created_at',
      )
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  }

  async function runImport(records: Record<string, unknown>[]) {
    const supabase = createClient();
    let inserted = 0;
    let failed = 0;
    let firstError: string | undefined;
    for (const rec of records) {
      const { error } = await supabase.from('locations').insert(rec as any);
      if (error) {
        failed++;
        if (!firstError) firstError = error.message;
      } else {
        inserted++;
      }
    }
    router.refresh();
    return { inserted, failed, firstError };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <CsvExportButton
          fetchRows={exportAll}
          filename="locations"
          columns={[
            { header: 'Store', accessor: (l: any) => l.brand?.name ?? '' },
            { header: 'Name', accessor: (l: any) => l.name },
            { header: 'Address', accessor: (l: any) => l.address },
            { header: 'City', accessor: (l: any) => l.city },
            { header: 'State', accessor: (l: any) => l.state },
            { header: 'ZIP', accessor: (l: any) => l.zip },
            { header: 'Country', accessor: (l: any) => l.country },
            { header: 'Phone', accessor: (l: any) => l.phone },
            { header: 'Latitude', accessor: (l: any) => l.latitude },
            { header: 'Longitude', accessor: (l: any) => l.longitude },
            { header: 'Avg Rating', accessor: (l: any) => l.average_rating },
            { header: 'Reviews', accessor: (l: any) => l.review_count },
            { header: 'Closed', accessor: (l: any) => l.is_temporarily_closed ? 'yes' : 'no' },
          ]}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setImportOpen(true)}
          className="h-9 gap-1.5"
        >
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Import CSV</span>
        </Button>
      </div>

      <BulkActionBar count={sel.count} onClear={sel.clear}>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => bulkClose(true)}
        >
          <EyeOff className="h-3.5 w-3.5" /> Close
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => bulkClose(false)}
        >
          <Eye className="h-3.5 w-3.5" /> Reopen
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </BulkActionBar>

      <Card className="overflow-hidden p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={sel.allSelected}
                    onCheckedChange={() => sel.toggleAll()}
                    aria-label="Select all rows"
                  />
                </TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Reviews</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((loc) => {
                const checked = sel.isSelected(loc.id);
                return (
                  <TableRow
                    key={loc.id}
                    data-state={checked ? 'selected' : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => sel.toggle(loc.id)}
                        aria-label={`Select ${loc.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-md">
                          {loc.cover_photo_url ? (
                            <AvatarImage src={loc.cover_photo_url} alt={loc.name} />
                          ) : null}
                          <AvatarFallback className="rounded-md">
                            <MapPin className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{loc.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {loc.address}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {loc.brand ? (
                        <Link
                          href={`/dashboard/brands/${loc.brand.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {loc.brand.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {loc.city}
                      {loc.state ? `, ${loc.state}` : ''}
                    </TableCell>
                    <TableCell>
                      <LocationOpenBadge closed={!!loc.is_temporarily_closed} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {loc.average_rating != null ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {Number(loc.average_rating).toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {loc.review_count ?? 0}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <ul className="divide-y divide-border md:hidden">
          {rows.map((loc) => {
            const checked = sel.isSelected(loc.id);
            return (
              <li key={loc.id} className="flex items-start gap-3 px-4 py-3.5">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => sel.toggle(loc.id)}
                  aria-label={`Select ${loc.name}`}
                  className="mt-3"
                />
                <Avatar className="h-12 w-12 shrink-0 rounded-md">
                  {loc.cover_photo_url ? (
                    <AvatarImage src={loc.cover_photo_url} alt={loc.name} />
                  ) : null}
                  <AvatarFallback className="rounded-md">
                    <MapPin className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{loc.name}</p>
                    <LocationOpenBadge closed={!!loc.is_temporarily_closed} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {loc.address}
                  </p>
                  {loc.brand && (
                    <Link
                      href={`/dashboard/brands/${loc.brand.id}`}
                      className="mt-0.5 inline-block text-xs font-medium text-primary"
                    >
                      {loc.brand.name}
                    </Link>
                  )}
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span className="tabular-nums">
                      {loc.average_rating != null
                        ? Number(loc.average_rating).toFixed(1)
                        : '—'}
                    </span>
                    <span>·</span>
                    <span>{loc.review_count ?? 0} reviews</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${sel.count} location${sel.count === 1 ? '' : 's'}?`}
        description="This permanently removes the selected locations, plus any menu items, photos, and reviews tied to them."
        confirmLabel="Delete"
        destructive
        onConfirm={bulkDelete}
      />

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entity="location"
        fields={IMPORT_FIELDS}
        onImport={runImport}
      />
    </div>
  );
}
