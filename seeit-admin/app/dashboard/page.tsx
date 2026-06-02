import {
  Building2,
  MapPin,
  Users,
  MessageSquare,
  CreditCard,
  Camera,
  UserPlus,
  ArrowRight,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/EmptyState';
import { formatRelative, initials } from '@/lib/utils';
import { RoleBadge } from '@/components/RoleBadge';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchOverview() {
  const supabase = createClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    brandsCount,
    locationsCount,
    activeSubsCount,
    usersTotal,
    customersCount,
    ownersCount,
    adminsCount,
    reviewsCount,
    photosWeekCount,
    recentReviews,
    recentSignups,
    me,
  ] = await Promise.all([
    supabase.from('brands').select('*', { count: 'exact', head: true }),
    supabase.from('locations').select('*', { count: 'exact', head: true }),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'trialing']),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer'),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'restaurant_owner'),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase
      .from('menu_item_photos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo),
    supabase
      .from('reviews')
      .select(
        'id, rating, text, created_at, user:users(id, name, email, avatar_url), location:locations(id, name)',
      )
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('users')
      .select('id, name, email, avatar_url, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.auth.getUser(),
  ]);

  // Resolve the signed-in admin's display name for the greeting
  let myName: string | null = null;
  const meId = me.data.user?.id;
  if (meId) {
    const { data: profile } = await supabase
      .from('users')
      .select('name')
      .eq('id', meId)
      .maybeSingle();
    myName = profile?.name ?? null;
  }

  return {
    myName,
    brands: brandsCount.count ?? 0,
    locations: locationsCount.count ?? 0,
    activeSubs: activeSubsCount.count ?? 0,
    users: usersTotal.count ?? 0,
    customers: customersCount.count ?? 0,
    owners: ownersCount.count ?? 0,
    admins: adminsCount.count ?? 0,
    reviews: reviewsCount.count ?? 0,
    photosWeek: photosWeekCount.count ?? 0,
    recentReviews: (recentReviews.data ?? []) as any[],
    recentSignups: (recentSignups.data ?? []) as any[],
    error:
      brandsCount.error?.message ??
      locationsCount.error?.message ??
      activeSubsCount.error?.message ??
      usersTotal.error?.message ??
      reviewsCount.error?.message ??
      null,
  };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardHome() {
  const data = await fetchOverview();
  const firstName = data.myName?.split(' ')[0] ?? null;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <TopBar title="Dashboard" subtitle="Real-time overview of the SeeIt platform" />
      <div className="flex-1 space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        {data.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            Couldn't load some stats: {data.error}
          </div>
        )}

        {/* Greeting hero */}
        <div className="flex flex-col gap-1">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {today}
          </p>
          <h2 className="text-[26px] font-bold tracking-tight text-foreground sm:text-[28px]">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}.
          </h2>
          <p className="text-[14px] text-muted-foreground">
            Here's what's happening across the platform today.
          </p>
        </div>

        {/* Primary stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total brands"
            value={data.brands.toLocaleString()}
            icon={Building2}
          />
          <StatCard
            label="Active subscriptions"
            value={data.activeSubs.toLocaleString()}
            icon={CreditCard}
          />
          <StatCard
            label="Total locations"
            value={data.locations.toLocaleString()}
            icon={MapPin}
          />
          <StatCard
            label="Total reviews"
            value={data.reviews.toLocaleString()}
            icon={MessageSquare}
          />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total users"
            value={data.users.toLocaleString()}
            icon={Users}
            hint={`${data.customers} customers · ${data.owners} owners · ${data.admins} admins`}
          />
          <StatCard
            label="Photos this week"
            value={data.photosWeek.toLocaleString()}
            icon={Camera}
            hint="Customer and restaurant uploads in the last 7 days"
          />
          <StatCard
            label="Newest signups"
            value={data.recentSignups.length}
            icon={UserPlus}
            hint={
              data.recentSignups[0]
                ? `Latest: ${formatRelative(data.recentSignups[0].created_at)}`
                : 'No signups yet'
            }
          />
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-0.5">
                <CardTitle>Recent reviews</CardTitle>
                <p className="text-[12.5px] text-muted-foreground">
                  Most recent customer feedback across the platform
                </p>
              </div>
              <Link
                href="/dashboard/reviews"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12.5px] font-semibold text-primary transition-colors hover:bg-terracotta-50"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="px-0 pt-0">
              {data.recentReviews.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No reviews yet"
                  description="Reviews will appear here as customers post them."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentReviews.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-start gap-3 px-6 py-3.5 transition-colors hover:bg-warm-50/60"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={r.user?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-terracotta-50 text-terracotta-700 text-[11px] font-semibold">
                          {initials(r.user?.name ?? r.user?.email ?? '?')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-[13.5px] font-semibold text-foreground">
                            {r.user?.name ?? r.user?.email ?? 'Unknown'}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-amber-600">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span className="text-[12.5px] font-semibold tabular-nums">
                              {r.rating}
                            </span>
                          </span>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="truncate text-[12.5px] text-muted-foreground">
                            {r.location?.name ?? 'Unknown location'}
                          </span>
                        </div>
                        {r.text && (
                          <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted-foreground">
                            "{r.text}"
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                          {formatRelative(r.created_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-0.5">
                <CardTitle>Newest users</CardTitle>
                <p className="text-[12.5px] text-muted-foreground">
                  Most recent signups
                </p>
              </div>
              <Link
                href="/dashboard/users"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12.5px] font-semibold text-primary transition-colors hover:bg-terracotta-50"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="px-0 pt-0">
              {data.recentSignups.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="No users yet"
                  description="Signups will land here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentSignups.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-start gap-3 px-6 py-3.5 transition-colors hover:bg-warm-50/60"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-warm-100 text-warm-700 text-[11px] font-semibold">
                          {initials(u.name ?? u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold text-foreground">
                          {u.name ?? u.email}
                        </p>
                        <p className="truncate text-[12px] text-muted-foreground">
                          {u.email}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <RoleBadge role={u.role} />
                          <span className="text-[11px] text-muted-foreground">
                            {formatRelative(u.created_at)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
