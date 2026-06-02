'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShieldOff, UserCog, Upload } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RoleBadge } from '@/components/RoleBadge';
import { BulkActionBar } from '@/components/BulkActionBar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CsvExportButton } from '@/components/CsvExportButton';
import { CsvImportDialog, type ImportField } from '@/components/CsvImportDialog';
import { Card } from '@/components/ui/card';
import { useRowSelection } from '@/hooks/useRowSelection';
import { createClient } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { formatDate, initials } from '@/lib/utils';
import type { UserRole } from '@/lib/database.types';

type Row = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_suspended: boolean | null;
  created_at: string | null;
  reviews?: { count: number }[];
  brands?: { id: string; name: string }[];
};

const IMPORT_FIELDS: ImportField[] = [
  { key: 'email', label: 'Email', required: true, aliases: ['e-mail', 'mail'] },
  { key: 'name', label: 'Name', aliases: ['full name', 'fullname'] },
  { key: 'phone', label: 'Phone' },
  {
    key: 'role',
    label: 'Role',
    transform: (v) => {
      const norm = v.toLowerCase().replace(/[\s_-]+/g, '_');
      if (['customer', 'restaurant_owner', 'admin'].includes(norm)) return norm;
      return 'customer';
    },
  },
];

export function UsersList({ rows: initialRows }: { rows: Row[] }) {
  const router = useRouter();
  const [rows] = React.useState(initialRows);
  const ids = React.useMemo(() => rows.map((r) => r.id), [rows]);
  const sel = useRowSelection(ids);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [confirmSuspend, setConfirmSuspend] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  async function bulkDelete() {
    const supabase = createClient();
    const ids = [...sel.selectedIds];
    const { error } = await supabase.from('users').delete().in('id', ids);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    await logAudit(supabase, {
      action: 'delete',
      targetType: 'user',
      metadata: { ids, count: ids.length },
    });
    toast.success(`Deleted ${sel.count} user${sel.count === 1 ? '' : 's'}`);
    setConfirmDelete(false);
    sel.clear();
    router.refresh();
  }

  async function bulkSuspend(suspend: boolean) {
    const supabase = createClient();
    const ids = [...sel.selectedIds];
    const { error } = await supabase
      .from('users')
      .update({ is_suspended: suspend })
      .in('id', ids);
    if (error) {
      toast.error(`Update failed: ${error.message}`);
      return;
    }
    await logAudit(supabase, {
      action: suspend ? 'suspend' : 'unsuspend',
      targetType: 'user',
      metadata: { ids, count: ids.length },
    });
    toast.success(
      `${suspend ? 'Suspended' : 'Unsuspended'} ${sel.count} user${sel.count === 1 ? '' : 's'}`,
    );
    setConfirmSuspend(false);
    sel.clear();
    router.refresh();
  }

  async function bulkChangeRole(role: UserRole) {
    const supabase = createClient();
    const ids = [...sel.selectedIds];
    const { error } = await supabase
      .from('users')
      .update({ role })
      .in('id', ids);
    if (error) {
      toast.error(`Role change failed: ${error.message}`);
      return;
    }
    await logAudit(supabase, {
      action: 'change_role',
      targetType: 'user',
      metadata: { ids, count: ids.length, role },
    });
    toast.success(`Changed role for ${sel.count} user${sel.count === 1 ? '' : 's'}`);
    sel.clear();
    router.refresh();
  }

  async function exportAll() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, is_suspended, phone, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  }

  async function runImport(records: Record<string, unknown>[]) {
    const supabase = createClient();
    let inserted = 0;
    let failed = 0;
    let firstError: string | undefined;
    // Insert one-by-one so a single bad row doesn't kill the whole batch
    for (const rec of records) {
      const { error } = await supabase.from('users').insert(rec as any);
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
          filename="users"
          columns={[
            { header: 'Email', accessor: (u: any) => u.email },
            { header: 'Name', accessor: (u: any) => u.name },
            { header: 'Role', accessor: (u: any) => u.role },
            { header: 'Phone', accessor: (u: any) => u.phone },
            { header: 'Suspended', accessor: (u: any) => u.is_suspended ? 'yes' : 'no' },
            { header: 'Joined', accessor: (u: any) => u.created_at },
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
              <UserCog className="h-3.5 w-3.5" /> Change role
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => bulkChangeRole('customer')}>
              Customer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => bulkChangeRole('restaurant_owner')}>
              Restaurant owner
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => bulkChangeRole('admin')}>
              Admin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => setConfirmSuspend(true)}
        >
          <ShieldOff className="h-3.5 w-3.5" /> Suspend
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
      {/* Desktop table */}
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
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Reviews</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => {
              const revCount =
                Array.isArray(u.reviews) && u.reviews[0] ? u.reviews[0].count : 0;
              const checked = sel.isSelected(u.id);
              return (
                <TableRow
                  key={u.id}
                  data-state={checked ? 'selected' : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => sel.toggle(u.id)}
                      aria-label={`Select ${u.email}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/users/${u.id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatar_url ?? undefined} />
                        <AvatarFallback>
                          {initials(u.name ?? u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u.name ?? '—'}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {(() => {
                      const brand = Array.isArray((u as any).brands)
                        ? (u as any).brands[0]
                        : (u as any).brands;
                      if (!brand) {
                        return (
                          <span className="text-muted-foreground">No brand</span>
                        );
                      }
                      return (
                        <Link
                          href={`/dashboard/brands/${brand.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {brand.name}
                        </Link>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {u.is_suspended ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(u.created_at)}
                  </TableCell>
                  <TableCell className="tabular-nums">{revCount}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-border md:hidden">
        {rows.map((u) => {
          const revCount =
            Array.isArray(u.reviews) && u.reviews[0] ? u.reviews[0].count : 0;
          const checked = sel.isSelected(u.id);
          return (
            <li
              key={u.id}
              className="flex items-start gap-3 px-4 py-3.5"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => sel.toggle(u.id)}
                aria-label={`Select ${u.email}`}
                className="mt-2"
              />
              <Link
                href={`/dashboard/users/${u.id}`}
                className="flex flex-1 items-start gap-3 active:bg-muted/50 -m-1 p-1 rounded-md"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={u.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {initials(u.name ?? u.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{u.name ?? '—'}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.email}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <RoleBadge role={u.role} />
                    {u.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                    <span className="text-[11px] text-muted-foreground">
                      {revCount} review{revCount === 1 ? '' : 's'} ·{' '}
                      {formatDate(u.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${sel.count} user${sel.count === 1 ? '' : 's'}?`}
        description="This permanently removes the selected accounts. Reviews and other rows owned by them may be orphaned."
        confirmLabel="Delete"
        destructive
        onConfirm={bulkDelete}
      />

      <ConfirmDialog
        open={confirmSuspend}
        onOpenChange={setConfirmSuspend}
        title={`Suspend ${sel.count} user${sel.count === 1 ? '' : 's'}?`}
        description="Suspended users can no longer sign in. They keep all their data and can be unsuspended later."
        confirmLabel="Suspend"
        destructive
        onConfirm={() => bulkSuspend(true)}
      />

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entity="user"
        fields={IMPORT_FIELDS}
        onImport={runImport}
      />
    </div>
  );
}
