import {
  Building2,
  MapPin,
  Users,
  MessageSquare,
  CreditCard,
  Camera,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { formatRelative, initials } from '@/lib/utils';
import { RoleBadge } from '@/components/RoleBadge';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchOverview() {
  const supabase = createClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Run all count queries in parallel for speed
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
      .limit(10),
    supabase
      .from('users')
      .select('id, name, email, avatar_url, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return {
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

export default async function DashboardHome() {
  const data = await fetchOverview();

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle="Real-time overview of the SeeIt platform"
      />
      <div className="flex-1 space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
        {data.error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn't load some stats: {data.error}
          </div>
        )}

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
            hint="Customer + restaurant uploads"
          />
          <StatCard
            label="New signups (5 recent)"
            value={data.recentSignups.length}
            icon={UserPlus}
            hint={
              data.recentSignups[0]
                ? `Latest: ${formatRelative(data.recentSignups[0].created_at)}`
                : 'No signups yet'
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle>Recent reviews</CardTitle>
              <Link
                href="/dashboard/reviews"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all →
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
                    <li key={r.id} className="flex items-start gap-3 px-6 py-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={r.user?.avatar_url ?? undefined} />
                        <AvatarFallback>
                          {initials(r.user?.name ?? r.user?.email ?? '?')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm">
                          <span className="font-semibold">
                            {r.user?.name ?? r.user?.email ?? 'Unknown'}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="inline-flex items-center gap-0.5 text-amber-600">
                            ★ {r.rating}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="truncate text-muted-foreground">
                            {r.location?.name ?? 'Unknown location'}
                          </span>
                        </p>
                        {r.text && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            "{r.text}"
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {formatRelative(r.created_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle>Newest users</CardTitle>
              <Link
                href="/dashboard/users"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all →
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
                    <li key={u.id} className="flex items-start gap-3 px-6 py-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url ?? undefined} />
                        <AvatarFallback>
                          {initials(u.name ?? u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {u.name ?? u.email}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
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
