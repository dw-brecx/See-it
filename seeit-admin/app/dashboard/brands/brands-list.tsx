'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, ShieldOff, ShieldCheck, Trash2, Upload } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SubscriptionStatusBadge, SuspendedBadge } from '@/components/StatusBadge';
import { BulkActionBar } from '@/components/BulkActionBar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CsvExportButton } from '@/components/CsvExportButton';
import { CsvImportDialog, type ImportField } from '@/components/CsvImportDialog';
import { useRowSelection } from '@/hooks/useRowSelection';
import { createClient } from '@/lib/supabase/client';
import { formatDate, initials } from '@/lib/utils';
import type { SubscriptionStatus } from '@/lib/database.types';

type Row = {
  id: string;
  name: string;
  logo_url: string | null;
  primary_cuisine: string | null;
  subscription_status: SubscriptionStatus | null;
  is_suspended: boolean | null;
  created_at: string | null;
  owner: { id: string; email: string; name: string | null } | null;
  locations: { count: number }[];
};

const SUB_STATUSES: SubscriptionStatus[] = [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'inactive',
];

const IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'description', label: 'Description' },
  { key: 'primary_cuisine', label: 'Primary cuisine' },
  {
    key: 'secondary_cuisines',
    label: 'Secondary cuisines (semicolon-separated)',
    transform: (v) => v.split(/[;,]/).map((s) => s.trim()).filter(Boolean),
  },
  { key: 'logo_url', label: 'Logo URL' },
];

export function BrandsList({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const ids = React.useMemo(() => rows.map((r) => r.id), [rows]);
  const sel = useRowSelection(ids);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  async function bulkDelete() {
    const supabase = createClient();
    const { error } = await supabase.from('brands').delete().in('id', sel.selectedIds);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    toast.success(`Deleted ${sel.count} store${sel.count === 1 ? '' : 's'}`);
    setConfirmDelete(false);
    sel.clear();
    router.refresh();
  }

  async function bulkSuspend(suspend: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from('brands')
      .update({ is_suspended: suspend })
      .in('id', sel.selectedIds);
    if (error) {
      toast.error(`Update failed: ${error.message}`);
      return;
    }
    toast.success(
      `${suspend ? 'Suspended' : 'Unsuspended'} ${sel.count} store${sel.count === 1 ? '' : 's'}`,
    );
    sel.clear();
    router.refresh();
  }

  async function bulkSetStatus(status: SubscriptionStatus) {
    const supabase = createClient();
    const { error } = await supabase
      .from('brands')
      .update({ subscription_status: status })
      .in('id', sel.selectedIds);
    if (error) {
      toast.error(`Update failed: ${error.message}`);
      return;
    }
    toast.success(`Set subscription to ${status}`);
    sel.clear();
    router.refresh();
  }

  async function duplicate(brand: Row) {
    const supabase = createClient();
    // Fetch the full row so we can clone all editable fields
    const { data: full, error: fetchErr } = await supabase
      .from('brands')
      .select(
        'name, description, primary_cuisine, secondary_cuisines, logo_url, subscription_status',
      )
      .eq('id', brand.id)
      .single();
    if (fetchErr || !full) {
      toast.error(`Duplicate failed: ${fetchErr?.message ?? 'not found'}`);
      return;
    }
    const { error: insertErr } = await supabase.from('brands').insert({
      ...full,
      name: `${full.name} (copy)`,
      is_suspended: false,
    });
    if (insertErr) {
      toast.error(`Duplicate failed: ${insertErr.message}`);
      return;
    }
    toast.success(`Duplicated "${brand.name}"`);
    router.refresh();
  }

  async function exportAll() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('brands')
      .select(
        'name, description, primary_cuisine, secondary_cuisines, subscription_status, is_suspended, logo_url, owner:users!brands_owner_id_fkey(email), created_at',
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
      const { error } = await supabase.from('brands').insert(rec as any);
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
          filename="brands"
          columns={[
            { header: 'Name', accessor: (b: any) => b.name },
            { header: 'Description', accessor: (b: any) => b.description },
            { header: 'Primary cuisine', accessor: (b: any) => b.primary_cuisine },
            { header: 'Secondary cuisines', accessor: (b: any) => b.secondary_cuisines },
            { header: 'Owner email', accessor: (b: any) => b.owner?.email ?? '' },
            { header: 'Subscription status', accessor: (b: any) => b.subscription_status },
            { header: 'Suspended', accessor: (b: any) => b.is_suspended ? 'yes' : 'no' },
            { header: 'Logo URL', accessor: (b: any) => b.logo_url },
            { header: 'Created', accessor: (b: any) => b.created_at },
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              Set subscription
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SUB_STATUSES.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => bulkSetStatus(s)}
                className="capitalize"
              >
                {s.replace('_', ' ')}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => bulkSuspend(true)}
        >
          <ShieldOff className="h-3.5 w-3.5" /> Suspend
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => bulkSuspend(false)}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Unsuspend
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
                <TableHead>Store</TableHead>
                <TableHead>Cuisine</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((brand) => {
                const locCount =
                  Array.isArray(brand.locations) && brand.locations[0]
                    ? brand.locations[0].count
                    : 0;
                const checked = sel.isSelected(brand.id);
                return (
                  <TableRow
                    key={brand.id}
                    data-state={checked ? 'selected' : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => sel.toggle(brand.id)}
                        aria-label={`Select ${brand.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/brands/${brand.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="h-9 w-9 rounded-md">
                          {brand.logo_url ? (
                            <AvatarImage
                              src={brand.logo_url}
                              alt={brand.name}
                            />
                          ) : null}
                          <AvatarFallback className="rounded-md bg-terracotta-100 text-terracotta-700">
                            {initials(brand.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">{brand.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {brand.primary_cuisine ?? '—'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {brand.owner?.email ?? (
                        <span className="text-muted-foreground">Orphaned</span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{locCount}</TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={brand.subscription_status} />
                    </TableCell>
                    <TableCell>
                      <SuspendedBadge suspended={!!brand.is_suspended} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(brand.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Duplicate store"
                        onClick={() => duplicate(brand)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <ul className="divide-y divide-border md:hidden">
          {rows.map((brand) => {
            const locCount =
              Array.isArray(brand.locations) && brand.locations[0]
                ? brand.locations[0].count
                : 0;
            const checked = sel.isSelected(brand.id);
            return (
              <li key={brand.id} className="flex items-start gap-3 px-4 py-3.5">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => sel.toggle(brand.id)}
                  aria-label={`Select ${brand.name}`}
                  className="mt-3"
                />
                <Link
                  href={`/dashboard/brands/${brand.id}`}
                  className="flex flex-1 items-start gap-3"
                >
                  <Avatar className="h-10 w-10 shrink-0 rounded-md">
                    {brand.logo_url ? (
                      <AvatarImage src={brand.logo_url} alt={brand.name} />
                    ) : null}
                    <AvatarFallback className="rounded-md bg-terracotta-100 text-terracotta-700">
                      {initials(brand.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{brand.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {brand.primary_cuisine ?? '—'} · {locCount} location
                      {locCount === 1 ? '' : 's'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {brand.owner?.email ?? 'Orphaned'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <SubscriptionStatusBadge status={brand.subscription_status} />
                      <SuspendedBadge suspended={!!brand.is_suspended} />
                    </div>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  title="Duplicate"
                  onClick={() => duplicate(brand)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${sel.count} store${sel.count === 1 ? '' : 's'}?`}
        description="This permanently removes the selected stores plus their locations, menus, photos, and reviews."
        confirmLabel="Delete"
        destructive
        onConfirm={bulkDelete}
      />

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entity="store"
        fields={IMPORT_FIELDS}
        onImport={runImport}
      />
    </div>
  );
}
