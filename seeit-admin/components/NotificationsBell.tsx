'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Building2,
  CheckCheck,
  MapPin,
  MessageSquare,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { formatRelative } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Notif = {
  id: string;
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

export function NotificationsBell() {
  const router = useRouter();
  const [items, setItems] = React.useState<Notif[]>([]);
  const [open, setOpen] = React.useState(false);
  const unread = React.useMemo(
    () => items.filter((n) => !n.is_read).length,
    [items],
  );

  // Fetch + subscribe to live updates
  React.useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, related_id, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (cancelled) return;
      setItems((data ?? []) as Notif[]);
    }

    load();

    // Refresh whenever the dropdown opens
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function markAllRead() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setItems((cur) => cur.map((n) => ({ ...n, is_read: true })));
    router.refresh();
  }

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setItems((cur) =>
      cur.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[10px] font-bold leading-none text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0" sideOffset={6}>
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <div>
            <p className="text-[13px] font-semibold">Notifications</p>
            {unread > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {unread} unread
              </p>
            )}
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold text-muted-foreground hover:bg-warm-50 hover:text-foreground"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto h-7 w-7 text-muted-foreground/40" />
              <p className="mt-2 text-[12.5px] text-muted-foreground">
                Nothing yet. You'll get pinged when something important happens.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const Icon = iconForType(n.type);
                return (
                  <li
                    key={n.id}
                    className={cn(
                      'flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-warm-50/60',
                      !n.is_read && 'bg-terracotta-50/30',
                    )}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-warm-100 text-warm-700">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-[13px] font-medium leading-tight">
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-[11.5px] text-muted-foreground">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                        {formatRelative(n.created_at)}
                      </p>
                    </button>
                    {!n.is_read && (
                      <span
                        aria-label="Unread"
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta-500"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Link
          href="/dashboard/notifications"
          onClick={() => setOpen(false)}
          className="block border-t border-border bg-warm-50/60 px-3 py-2 text-center text-[12px] font-semibold text-terracotta-700 hover:bg-warm-50"
        >
          View all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
