'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Activity,
  Building2,
  CreditCard,
  LayoutDashboard,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn, initials } from '@/lib/utils';

type Nav = {
  kind: 'nav';
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  group: string;
};

type Result = {
  kind: 'store' | 'location' | 'user' | 'review';
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  avatarUrl?: string | null;
  fallback?: string;
};

const NAV_ITEMS: Nav[] = [
  { kind: 'nav', id: 'nav-dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Go to' },
  { kind: 'nav', id: 'nav-stores', label: 'Stores', href: '/dashboard/brands', icon: Building2, group: 'Go to' },
  { kind: 'nav', id: 'nav-locations', label: 'Locations', href: '/dashboard/locations', icon: MapPin, group: 'Go to' },
  { kind: 'nav', id: 'nav-reviews', label: 'Reviews', href: '/dashboard/reviews', icon: MessageSquare, group: 'Go to' },
  { kind: 'nav', id: 'nav-users', label: 'Users', href: '/dashboard/users', icon: Users, group: 'Go to' },
  { kind: 'nav', id: 'nav-subscriptions', label: 'Subscriptions', href: '/dashboard/subscriptions', icon: CreditCard, group: 'Go to' },
  { kind: 'nav', id: 'nav-activity', label: 'Activity', href: '/dashboard/activity', icon: Activity, group: 'Go to' },
  { kind: 'nav', id: 'nav-settings', label: 'Settings', href: '/dashboard/settings', icon: Settings, group: 'Go to' },
  { kind: 'nav', id: 'nav-plans', label: 'Plans & pricing', href: '/dashboard/settings?tab=plans', icon: CreditCard, group: 'Manage' },
  { kind: 'nav', id: 'nav-codes', label: 'Discount codes', href: '/dashboard/settings?tab=codes', icon: Sparkles, group: 'Manage' },
  { kind: 'nav', id: 'nav-add-store', label: 'Add new store', href: '/dashboard/brands', icon: Building2, group: 'Quick actions' },
  { kind: 'nav', id: 'nav-add-location', label: 'Add new location', href: '/dashboard/locations/new', icon: MapPin, group: 'Quick actions' },
  { kind: 'nav', id: 'nav-invite-user', label: 'Invite user', href: '/dashboard/users', icon: UserPlus, group: 'Quick actions' },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Result[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [focused, setFocused] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Open on Cmd/Ctrl+K
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Reset state when opening
  React.useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setFocused(0);
      // Defer focus to next tick so the input is mounted
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Search across stores / locations / users / reviews when the query changes
  React.useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const run = async () => {
      const supabase = createClient();
      const like = `%${q}%`;
      const [storesRes, locsRes, usersRes] = await Promise.all([
        supabase
          .from('brands')
          .select('id, name, logo_url, primary_cuisine')
          .or(`name.ilike.${like},primary_cuisine.ilike.${like}`)
          .limit(5),
        supabase
          .from('locations')
          .select('id, name, city, state, brand:brands(name)')
          .or(`name.ilike.${like},city.ilike.${like},address.ilike.${like}`)
          .limit(5),
        supabase
          .from('users')
          .select('id, name, email, avatar_url, role')
          .or(`name.ilike.${like},email.ilike.${like}`)
          .limit(5),
      ]);
      if (cancelled) return;
      const next: Result[] = [];
      for (const b of storesRes.data ?? []) {
        next.push({
          kind: 'store',
          id: b.id,
          label: b.name,
          sublabel: b.primary_cuisine ?? 'Store',
          href: `/dashboard/brands/${b.id}`,
          avatarUrl: b.logo_url,
          fallback: initials(b.name),
        });
      }
      for (const l of (locsRes.data ?? []) as any[]) {
        next.push({
          kind: 'location',
          id: l.id,
          label: l.name,
          sublabel: `${l.brand?.name ? l.brand.name + ' · ' : ''}${l.city ?? ''}${l.state ? `, ${l.state}` : ''}`,
          href: `/dashboard/brands`, // detail route doesn't exist yet — open stores list
          fallback: initials(l.name),
        });
      }
      for (const u of usersRes.data ?? []) {
        next.push({
          kind: 'user',
          id: u.id,
          label: u.name ?? u.email,
          sublabel: `${u.email}${u.role ? ` · ${u.role}` : ''}`,
          href: `/dashboard/users/${u.id}`,
          avatarUrl: u.avatar_url,
          fallback: initials(u.name ?? u.email),
        });
      }
      setResults(next);
      setFocused(0);
      setLoading(false);
    };
    const handle = setTimeout(run, 180);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, open]);

  const navMatches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_ITEMS;
    return NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(q));
  }, [query]);

  const flat: { kind: 'nav'; item: Nav }[] | any[] = React.useMemo(() => {
    const a = navMatches.map((n) => ({ kind: 'nav', item: n }));
    const b = results.map((r) => ({ kind: 'result', item: r }));
    return [...a, ...b];
  }, [navMatches, results]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocused((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocused((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = flat[focused];
      if (it?.kind === 'nav') go(it.item.href);
      else if (it?.kind === 'result') go(it.item.href);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[15%] z-50 w-[92%] max-w-[640px] translate-x-[-50%] overflow-hidden rounded-2xl border border-border bg-card shadow-soft-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
          onKeyDown={onKeyDown}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stores, locations, users, or jump to…"
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/70"
            />
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            <kbd className="hidden rounded border border-border bg-warm-50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
              esc
            </kbd>
          </div>

          <div className="max-h-[440px] overflow-y-auto p-2">
            {flat.length === 0 ? (
              <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                {query.trim().length < 2
                  ? 'Start typing to search…'
                  : 'Nothing matched.'}
              </p>
            ) : (
              renderGroups(flat, focused, go)
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-warm-50/60 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-border bg-card px-1 py-0.5 font-medium">↑</kbd>
              <kbd className="rounded border border-border bg-card px-1 py-0.5 font-medium">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-border bg-card px-1 py-0.5 font-medium">↵</kbd>
              open
            </span>
            <span className="hidden sm:inline">SeeIt Admin</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function renderGroups(
  items: { kind: 'nav' | 'result'; item: any }[],
  focused: number,
  go: (href: string) => void,
) {
  // Group items by group label for nav, or "Search results" for results
  const groups: Record<string, { kind: 'nav' | 'result'; item: any; index: number }[]> = {};
  items.forEach((it, i) => {
    const group =
      it.kind === 'nav' ? (it.item as Nav).group : labelForResult((it.item as Result).kind);
    if (!groups[group]) groups[group] = [];
    groups[group].push({ ...it, index: i });
  });

  const out: React.ReactNode[] = [];
  for (const [group, entries] of Object.entries(groups)) {
    out.push(
      <p
        key={`g-${group}`}
        className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
      >
        {group}
      </p>,
    );
    for (const entry of entries) {
      if (entry.kind === 'nav') {
        const n = entry.item as Nav;
        const Icon = n.icon;
        out.push(
          <button
            key={n.id}
            onClick={() => go(n.href)}
            onMouseEnter={() => {}}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-[13.5px] transition-colors',
              entry.index === focused
                ? 'bg-terracotta-50 text-terracotta-800'
                : 'hover:bg-warm-50',
            )}
          >
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">{n.label}</span>
          </button>,
        );
      } else {
        const r = entry.item as Result;
        out.push(
          <button
            key={`r-${r.kind}-${r.id}`}
            onClick={() => go(r.href)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors',
              entry.index === focused
                ? 'bg-terracotta-50 text-terracotta-800'
                : 'hover:bg-warm-50',
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-warm-100 text-[10px] font-semibold text-warm-700">
              {r.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                r.fallback ?? '?'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium">{r.label}</p>
              {r.sublabel && (
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {r.sublabel}
                </p>
              )}
            </div>
          </button>,
        );
      }
    }
  }
  return out;
}

function labelForResult(kind: Result['kind']) {
  switch (kind) {
    case 'store':
      return 'Stores';
    case 'location':
      return 'Locations';
    case 'user':
      return 'Users';
    case 'review':
      return 'Reviews';
  }
}
