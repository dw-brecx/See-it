import Link from 'next/link';
import {
  MessageSquare,
  UserPlus,
  Building2,
  MapPin,
  Activity as ActivityIcon,
  Star,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/EmptyState';
import { formatRelative, initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ActivityItem = {
  id: string;
  kind: 'review' | 'signup' | 'brand' | 'location';
  ts: string;
  title: React.ReactNode;
  meta?: string;
  avatarUrl?: string | null;
  avatarFallback: string;
};

async function fetchActivity(): Promise<{ items: ActivityItem[]; error: string | null }> {
  const supabase = createClient();
  const [reviewsRes, signupsRes, brandsRes, locsRes] = await Promise.all([
    supabase
      .from('reviews')
      .select(
        'id, rating, text, created_at, user:users(name, email, avatar_url), location:locations(id, name)',
      )
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('users')
      .select('id, name, email, avatar_url, role, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('brands')
      .select('id, name, logo_url, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('locations')
      .select('id, name, address, created_at, brand:brands(id, name)')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (reviewsRes.error || signupsRes.error || brandsRes.error || locsRes.error) {
    return {
      items: [],
      error:
        reviewsRes.error?.message ||
        signupsRes.error?.message ||
        brandsRes.error?.message ||
        locsRes.error?.message ||
        'Failed to load activity',
    };
  }

  const items: ActivityItem[] = [];

  (reviewsRes.data ?? []).forEach((r: any) => {
    items.push({
      id: `rev-${r.id}`,
      kind: 'review',
      ts: r.created_at,
      avatarUrl: r.user?.avatar_url,
      avatarFallback: initials(r.user?.name ?? r.user?.email ?? '?'),
      title: (
        <>
          <strong>{r.user?.name ?? r.user?.email ?? 'Anon'}</strong> left a{' '}
          <span className="inline-flex items-center gap-0.5 align-middle text-amber-600">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="font-semibold tabular-nums">{r.rating}</span>
          </span>{' '}
          review at{' '}
          <strong>{r.location?.name ?? 'Unknown'}</strong>
        </>
      ),
      meta: r.text ? `"${r.text.slice(0, 100)}${r.text.length > 100 ? '…' : ''}"` : undefined,
    });
  });

  (signupsRes.data ?? []).forEach((u: any) => {
    items.push({
      id: `usr-${u.id}`,
      kind: 'signup',
      ts: u.created_at,
      avatarUrl: u.avatar_url,
      avatarFallback: initials(u.name ?? u.email),
      title: (
        <>
          <strong>{u.name ?? u.email}</strong> joined as{' '}
          <span className="capitalize text-muted-foreground">{u.role.replace('_', ' ')}</span>
        </>
      ),
      meta: u.email,
    });
  });

  (brandsRes.data ?? []).forEach((b: any) => {
    items.push({
      id: `brd-${b.id}`,
      kind: 'brand',
      ts: b.created_at,
      avatarUrl: b.logo_url,
      avatarFallback: initials(b.name),
      title: (
        <>
          New brand <strong>{b.name}</strong> created
        </>
      ),
    });
  });

  (locsRes.data ?? []).forEach((l: any) => {
    items.push({
      id: `loc-${l.id}`,
      kind: 'location',
      ts: l.created_at,
      avatarUrl: null,
      avatarFallback: 'L',
      title: (
        <>
          New location <strong>{l.name}</strong>
          {l.brand && (
            <>
              {' '}for{' '}
              <Link
                href={`/dashboard/brands/${l.brand.id}`}
                className="text-primary hover:underline"
              >
                {l.brand.name}
              </Link>
            </>
          )}
        </>
      ),
      meta: l.address,
    });
  });

  items.sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
  return { items: items.slice(0, 60), error: null };
}

function iconFor(kind: ActivityItem['kind']) {
  if (kind === 'review') return MessageSquare;
  if (kind === 'signup') return UserPlus;
  if (kind === 'brand') return Building2;
  return MapPin;
}

export default async function ActivityPage() {
  const { items, error } = await fetchActivity();

  return (
    <>
      <TopBar
        title="Activity"
        subtitle="Recent activity across the platform — newest first"
      />
      <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load activity: {error}
          </div>
        )}

        <Card className="overflow-hidden p-0">
          {items.length === 0 ? (
            <EmptyState
              icon={ActivityIcon}
              title="Nothing yet"
              description="As people use the platform, activity will land here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const Icon = iconFor(item.kind);
                return (
                  <li key={item.id} className="flex items-start gap-3 px-6 py-3.5">
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={item.avatarUrl ?? undefined} />
                        <AvatarFallback>{item.avatarFallback}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-500 text-white">
                        <Icon className="h-2.5 w-2.5" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{item.title}</p>
                      {item.meta && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {item.meta}
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatRelative(item.ts)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
