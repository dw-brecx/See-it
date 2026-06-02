'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Building2,
  CheckCheck,
  MapPin,
  MessageSquare,
  Trash2,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActionBar } from '@/components/BulkActionBar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useRowSelection } from '@/hooks/useRowSelection';
import { createClient } from '@/lib/supabase/client';
import { formatRelative } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Notif = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  related_id: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

function iconForType(type: string): LucideIcon {
  if (type.includes('review')) return MessageSquare;
  if (type.includes('signup') || type.includes('user')) return UserPlus;
  if (type.includes('brand') || type.includes('store')) return Building2;
  if (type.includes('location')) return MapPin;
  return Bell;
}

export function NotificationsList({ items }: { items: Notif[] }) {
  const router = useRouter();
  const ids = React.useMemo(() => items.map((i) => i.id), [items]);
  const sel = useRowSelection(ids);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  async function bulkMarkRead(read: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: read })
      .in('id', sel.selectedIds);
    if (error) {
      toast.error(`Failed: ${error.message}`);
      return;
    }
    toast.success(
      `Marked ${sel.count} as ${read ? 'read' : 'unread'}`,
    );
    sel.clear();
    router.refresh();
  }

  async function bulkDelete() {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', sel.selectedIds);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    toast.success(`Deleted ${sel.count} notification${sel.count === 1 ? '' : 's'}`);
    setConfirmDelete(false);
    sel.clear();
    router.refresh();
  }

  async function markAllRead() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    if (error) {
      toast.error(`Failed: ${error.message}`);
      return;
    }
    toast.success('Marked all as read');
    router.refresh();
  }

  const hasUnread = items.some((i) => !i.is_read);

  return (
    <div className="space-y-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="gap-1.5"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>
      )}

      <BulkActionBar count={sel.count} onClear={sel.clear}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => bulkMarkRead(true)}
          className="h-8 gap-1.5"
        >
          <CheckCheck className="h-3.5 w-3.5" /> Mark read
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => bulkMarkRead(false)}
          className="h-8 gap-1.5"
        >
          Mark unread
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </BulkActionBar>

      <Card className="overflow-hidden p-0">
        <ul className="divide-y divide-border">
          {items.map((n) => {
            const Icon = iconForType(n.type);
            const checked = sel.isSelected(n.id);
            return (
              <li
                key={n.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-warm-50/60 sm:px-6',
                  !n.is_read && 'bg-terracotta-50/30',
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => sel.toggle(n.id)}
                  className="mt-1"
                  aria-label="Select notification"
                />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-warm-100 text-warm-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium leading-tight">
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatRelative(n.created_at)} ·{' '}
                    <span className="capitalize">{n.type.replace(/_/g, ' ')}</span>
                  </p>
                </div>
                {!n.is_read && (
                  <span
                    aria-label="Unread"
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-terracotta-500"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${sel.count} notification${sel.count === 1 ? '' : 's'}?`}
        description="This permanently removes the selected notifications."
        confirmLabel="Delete"
        destructive
        onConfirm={bulkDelete}
      />
    </div>
  );
}
