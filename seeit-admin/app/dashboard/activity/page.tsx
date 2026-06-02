import Link from 'next/link';
import {
  MessageSquare,
  UserPlus,
  Building2,
  MapPin,
  Activity as ActivityIcon,
  ShieldAlert,
  Star,
  Trash2,
  Pencil,
  Plus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

async function fetchPlatform(): Promise<{ items: ActivityItem[]; error: string | null }> {
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
          review at <strong>{r.location?.name ?? 'Unknown'}</strong>
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
          New store <strong>{b.name}</strong> created
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

type AuditRow = {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  target_label: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor: { id: string; name: string | null; email: string; avatar_url: string | null } | null;
};

async function fetchAudit(): Promise<{ rows: AuditRow[]; error: string | null; missing: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select(
      'id, action, target_type, target_id, target_label, metadata, created_at, actor:users!admin_audit_log_actor_id_fkey(id, name, email, avatar_url)',
    )
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    // 42P01 = table does not exist → migration not run yet
    return {
      rows: [],
      error: error.message,
      missing: error.code === '42P01',
    };
  }
  return { rows: (data ?? []) as any, error: null, missing: false };
}

function iconFor(kind: ActivityItem['kind']) {
  if (kind === 'review') return MessageSquare;
  if (kind === 'signup') return UserPlus;
  if (kind === 'brand') return Building2;
  return MapPin;
}

function actionIcon(action: string) {
  if (action === 'delete') return Trash2;
  if (action === 'suspend' || action === 'unsuspend') return ShieldAlert;
  if (action === 'create') return Plus;
  return Pencil;
}

function actionTone(action: string) {
  if (action === 'delete') return 'destructive' as const;
  if (action === 'suspend' || action === 'flag') return 'warning' as const;
  if (action === 'unsuspend' || action === 'reopen' || action === 'unflag') return 'success' as const;
  if (action === 'create') return 'success' as const;
  return 'default' as const;
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const initialTab = searchParams.tab === 'audit' ? 'audit' : 'platform';
  const [platform, audit] = await Promise.all([fetchPlatform(), fetchAudit()]);

  return (
    <>
      <TopBar
        title="Activity"
        subtitle="Platform-wide events and admin actions"
      />
      <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
        <Tabs defaultValue={initialTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="platform">Platform activity</TabsTrigger>
            <TabsTrigger value="audit">
              Audit log
              {audit.rows.length > 0 && (
                <Badge variant="default" className="ml-2 px-1.5 text-[10px]">
                  {audit.rows.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="platform" className="space-y-4">
            {platform.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Failed to load activity: {platform.error}
              </div>
            )}
            <Card className="overflow-hidden p-0">
              {platform.items.length === 0 ? (
                <EmptyState
                  icon={ActivityIcon}
                  title="Nothing yet"
                  description="As people use the platform, activity will land here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {platform.items.map((item) => {
                    const Icon = iconFor(item.kind);
                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 px-6 py-3.5"
                      >
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
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card className="overflow-hidden p-0">
              {audit.missing ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    Run migration 004 first
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The <code className="rounded bg-warm-100 px-1.5 py-0.5">admin_audit_log</code> table
                    doesn't exist yet. Paste{' '}
                    <code className="rounded bg-warm-100 px-1.5 py-0.5">migrations/004_audit_log.sql</code>{' '}
                    into Supabase to enable this view.
                  </p>
                </div>
              ) : audit.rows.length === 0 ? (
                <EmptyState
                  icon={ShieldAlert}
                  title="No admin actions yet"
                  description="Bulk deletes, suspends, role changes, and other admin operations land here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {audit.rows.map((r) => {
                    const Icon = actionIcon(r.action);
                    const tone = actionTone(r.action);
                    const count = (r.metadata as any)?.count as number | undefined;
                    return (
                      <li
                        key={r.id}
                        className="flex items-start gap-3 px-6 py-3.5"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={r.actor?.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-warm-100 text-warm-700 text-[11px]">
                            {initials(r.actor?.name ?? r.actor?.email ?? '?')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                            <strong>{r.actor?.name ?? r.actor?.email ?? 'Unknown'}</strong>
                            <Badge variant={tone} className="gap-1 capitalize">
                              <Icon className="h-3 w-3" />
                              {r.action.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-muted-foreground">
                              {count ? `${count} ` : ''}
                              {r.target_type}
                              {count && count !== 1 ? 's' : ''}
                            </span>
                            {r.target_label && (
                              <span className="text-muted-foreground/70">·</span>
                            )}
                            {r.target_label && (
                              <span className="truncate">{r.target_label}</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {formatRelative(r.created_at)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
