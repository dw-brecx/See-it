'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Flag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Star } from 'lucide-react';
import { BulkActionBar } from '@/components/BulkActionBar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CsvExportButton } from '@/components/CsvExportButton';
import { useRowSelection } from '@/hooks/useRowSelection';
import { ReviewModal } from './review-actions';
import { createClient } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { formatRelative, initials, truncate } from '@/lib/utils';

type Row = {
  id: string;
  rating: number;
  text: string | null;
  is_flagged: boolean | null;
  created_at: string | null;
  portion_size: string | null;
  worth_the_price: boolean | null;
  mood_tags: string[] | null;
  user: { id: string; name: string | null; email: string; avatar_url: string | null } | null;
  location: { id: string; name: string; brand: { id: string; name: string } | null } | null;
  menu_item: { id: string; name: string } | null;
  review_photos: { id: string; photo_url: string }[];
  review_replies: { id: string; text: string; created_at: string }[];
};

export function ReviewsList({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const ids = React.useMemo(() => rows.map((r) => r.id), [rows]);
  const sel = useRowSelection(ids);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  async function bulkDelete() {
    const supabase = createClient();
    const ids = [...sel.selectedIds];
    const { error } = await supabase.from('reviews').delete().in('id', ids);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    await logAudit(supabase, {
      action: 'delete',
      targetType: 'review',
      metadata: { ids, count: ids.length },
    });
    toast.success(`Deleted ${sel.count} review${sel.count === 1 ? '' : 's'}`);
    setConfirmDelete(false);
    sel.clear();
    router.refresh();
  }

  async function bulkFlag(flag: boolean) {
    const supabase = createClient();
    const ids = [...sel.selectedIds];
    const { error } = await supabase
      .from('reviews')
      .update({ is_flagged: flag })
      .in('id', ids);
    if (error) {
      toast.error(`Update failed: ${error.message}`);
      return;
    }
    await logAudit(supabase, {
      action: flag ? 'flag' : 'unflag',
      targetType: 'review',
      metadata: { ids, count: ids.length },
    });
    toast.success(
      `${flag ? 'Flagged' : 'Unflagged'} ${sel.count} review${sel.count === 1 ? '' : 's'}`,
    );
    sel.clear();
    router.refresh();
  }

  async function exportAll() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reviews')
      .select(
        'rating, text, portion_size, worth_the_price, mood_tags, is_flagged, created_at, user:users(email, name), location:locations(name, brand:brands(name)), menu_item:menu_items(name)',
      )
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <CsvExportButton
          fetchRows={exportAll}
          filename="reviews"
          columns={[
            { header: 'Rating', accessor: (r: any) => r.rating },
            { header: 'Text', accessor: (r: any) => r.text },
            { header: 'Reviewer', accessor: (r: any) => r.user?.email ?? '' },
            { header: 'Store', accessor: (r: any) => r.location?.brand?.name ?? '' },
            { header: 'Location', accessor: (r: any) => r.location?.name ?? '' },
            { header: 'Menu item', accessor: (r: any) => r.menu_item?.name ?? '' },
            { header: 'Portion', accessor: (r: any) => r.portion_size },
            {
              header: 'Worth the price',
              accessor: (r: any) =>
                r.worth_the_price === true
                  ? 'yes'
                  : r.worth_the_price === false
                  ? 'no'
                  : '',
            },
            { header: 'Mood tags', accessor: (r: any) => r.mood_tags },
            { header: 'Flagged', accessor: (r: any) => r.is_flagged ? 'yes' : 'no' },
            { header: 'Created', accessor: (r: any) => r.created_at },
          ]}
        />
      </div>

      <BulkActionBar count={sel.count} onClear={sel.clear}>
        <Button onClick={() => bulkFlag(true)} variant="outline" size="sm" className="h-8 gap-1.5">
          <Flag className="h-3.5 w-3.5" /> Flag
        </Button>
        <Button onClick={() => bulkFlag(false)} variant="outline" size="sm" className="h-8 gap-1.5">
          <Flag className="h-3.5 w-3.5" /> Unflag
        </Button>
        <Button
          onClick={() => setConfirmDelete(true)}
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
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
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Dish / Location</TableHead>
                <TableHead>Text</TableHead>
                <TableHead>Photos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const checked = sel.isSelected(r.id);
                return (
                  <ReviewModal
                    key={r.id}
                    review={{ ...r, is_flagged: !!r.is_flagged } as any}
                  >
                    <TableRow
                      className="cursor-pointer"
                      data-state={checked ? 'selected' : undefined}
                    >
                      <TableCell
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-default"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => sel.toggle(r.id)}
                          aria-label="Select review"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={r.user?.avatar_url ?? undefined} />
                            <AvatarFallback>
                              {initials(r.user?.name ?? r.user?.email ?? '?')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm">
                            {r.user?.name ?? r.user?.email ?? 'Anon'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {r.rating}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <p className="truncate font-medium">
                          {r.menu_item?.name ?? '—'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.location?.name ?? 'Unknown'}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[300px] text-sm text-muted-foreground">
                        {truncate(r.text, 90)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {r.review_photos?.length ?? 0}
                      </TableCell>
                      <TableCell>
                        {r.is_flagged ? (
                          <Badge variant="destructive">Flagged</Badge>
                        ) : r.rating <= 2 ? (
                          <Badge variant="warning">Low rating</Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelative(r.created_at)}
                      </TableCell>
                    </TableRow>
                  </ReviewModal>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <ul className="divide-y divide-border md:hidden">
          {rows.map((r) => {
            const checked = sel.isSelected(r.id);
            return (
              <li key={r.id} className="flex items-start gap-3 px-4 py-3.5">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => sel.toggle(r.id)}
                  aria-label="Select review"
                  className="mt-2"
                />
                <ReviewModal review={{ ...r, is_flagged: !!r.is_flagged } as any}>
                  <div className="flex flex-1 cursor-pointer items-start gap-3 active:bg-muted/50 -m-1 p-1 rounded-md">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={r.user?.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {initials(r.user?.name ?? r.user?.email ?? '?')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {r.user?.name ?? r.user?.email ?? 'Anon'}
                        </p>
                        <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold tabular-nums text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {r.rating}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.menu_item?.name ? `${r.menu_item.name} · ` : ''}
                        {r.location?.name ?? 'Unknown'}
                      </p>
                      {r.text && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          "{r.text}"
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {r.is_flagged ? (
                          <Badge variant="destructive">Flagged</Badge>
                        ) : r.rating <= 2 ? (
                          <Badge variant="warning">Low rating</Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelative(r.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </ReviewModal>
              </li>
            );
          })}
        </ul>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${sel.count} review${sel.count === 1 ? '' : 's'}?`}
        description="This permanently removes the selected reviews and their photos & replies."
        confirmLabel="Delete"
        destructive
        onConfirm={bulkDelete}
      />
    </div>
  );
}

