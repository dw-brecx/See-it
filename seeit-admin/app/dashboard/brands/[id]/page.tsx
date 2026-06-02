import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Users,
  Activity as ActivityIcon,
  ChevronLeft,
  Star,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SubscriptionStatusBadge, SuspendedBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { BrandActions } from './brand-actions';
import { LocationsPanel } from './locations-panel';
import { MenuPanel } from './menu-panel';
import { formatDate, initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function fetchBrand(id: string) {
  const supabase = createClient();
  const [brandRes, locationsRes, teamRes, reviewsRes] = await Promise.all([
    supabase
      .from('brands')
      .select(
        'id, name, logo_url, description, primary_cuisine, secondary_cuisines, is_suspended, subscription_status, created_at, owner_id, owner:users!brands_owner_id_fkey(id, email, name, avatar_url, phone)',
      )
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('locations')
      .select(
        'id, brand_id, name, address, city, state, zip, country, phone, latitude, longitude, cover_photo_url, description, dietary_tags, style_tags, is_temporarily_closed, reopening_date, hours, average_rating, review_count',
      )
      .eq('brand_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('team_members')
      .select(
        'id, role, location_ids, created_at, user:users(id, name, email, avatar_url, is_suspended)',
      )
      .eq('brand_id', id),
    supabase
      .from('reviews')
      .select(
        'id, rating, text, created_at, location:locations!inner(id, name, brand_id), user:users(name, email, avatar_url)',
      )
      .eq('location.brand_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (!brandRes.data) return null;

  return {
    brand: brandRes.data as any,
    locations: (locationsRes.data ?? []) as any[],
    team: (teamRes.data ?? []) as any[],
    reviews: (reviewsRes.data ?? []) as any[],
  };
}

export default async function BrandDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await fetchBrand(params.id);
  if (!data) notFound();

  const { brand, locations, team, reviews } = data;
  const locationOptions = locations.map((l) => ({
    id: l.id,
    name: l.name,
    city: l.city,
  }));

  return (
    <>
      <TopBar title={brand.name} subtitle="Brand details" />
      <div className="flex-1 space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
        <Link
          href="/dashboard/brands"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All brands
        </Link>

        {/* Header card */}
        <Card>
          <CardContent className="flex flex-col gap-5 p-4 sm:p-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 rounded-lg sm:h-16 sm:w-16">
                {brand.logo_url ? (
                  <AvatarImage src={brand.logo_url} alt={brand.name} />
                ) : null}
                <AvatarFallback className="rounded-lg bg-terracotta-100 text-xl text-terracotta-700 sm:text-2xl">
                  {initials(brand.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                    {brand.name}
                  </h2>
                  <SuspendedBadge suspended={!!brand.is_suspended} />
                  <SubscriptionStatusBadge status={brand.subscription_status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {brand.primary_cuisine ?? 'No cuisine set'} ·{' '}
                  {locations.length} location{locations.length === 1 ? '' : 's'} · Joined{' '}
                  {formatDate(brand.created_at)}
                </p>
                {brand.owner && (
                  <p className="mt-2 truncate text-sm">
                    <span className="text-muted-foreground">Owner:</span>{' '}
                    <Link
                      href={`/dashboard/users/${brand.owner.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {brand.owner.name ?? brand.owner.email}
                    </Link>
                  </p>
                )}
              </div>
            </div>
            <BrandActions
              brand={{
                id: brand.id,
                name: brand.name,
                description: brand.description,
                primary_cuisine: brand.primary_cuisine,
                secondary_cuisines: brand.secondary_cuisines,
                logo_url: brand.logo_url,
                owner_id: brand.owner_id,
                subscription_status: brand.subscription_status,
                is_suspended: !!brand.is_suspended,
              }}
              ownerEmail={brand.owner?.email ?? null}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList className="flex w-full overflow-x-auto sm:inline-flex sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="locations">
              Locations ({locations.length})
            </TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="team">Team ({team.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="whitespace-pre-line text-muted-foreground">
                  {brand.description ?? 'No description set.'}
                </p>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Primary cuisine
                  </p>
                  <p>{brand.primary_cuisine ?? '—'}</p>
                </div>
                {brand.secondary_cuisines &&
                  brand.secondary_cuisines.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Secondary cuisines
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {brand.secondary_cuisines.map((c: string) => (
                          <Badge key={c} variant="default">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <SubscriptionStatusBadge status={brand.subscription_status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Account state</span>
                  <SuspendedBadge suspended={!!brand.is_suspended} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Locations</span>
                  <span className="font-semibold tabular-nums">{locations.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Team members</span>
                  <span className="font-semibold tabular-nums">{team.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="font-semibold">{formatDate(brand.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations">
            <LocationsPanel brandId={brand.id} locations={locations} />
          </TabsContent>

          <TabsContent value="menu">
            <MenuPanel brandId={brand.id} locations={locationOptions} />
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardContent className="p-0">
                {team.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No team members"
                    description="The owner hasn't invited anyone yet."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {team.map((m) => (
                      <li
                        key={m.id}
                        className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={m.user?.avatar_url ?? undefined} />
                            <AvatarFallback>
                              {initials(m.user?.name ?? m.user?.email ?? '?')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {m.user?.name ?? m.user?.email ?? 'Unknown'}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {m.user?.email}
                            </p>
                          </div>
                        </div>
                        <div className="ml-auto flex shrink-0 items-center gap-2">
                          <Badge variant="default" className="capitalize">
                            {m.role}
                          </Badge>
                          {m.user?.is_suspended ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardContent className="p-0">
                {reviews.length === 0 ? (
                  <EmptyState
                    icon={ActivityIcon}
                    title="No activity yet"
                    description="Recent reviews will show up here."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {reviews.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-start gap-3 px-4 py-3 sm:px-6"
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={r.user?.avatar_url ?? undefined} />
                          <AvatarFallback>
                            {initials(r.user?.name ?? r.user?.email ?? '?')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">
                            <span className="font-semibold">
                              {r.user?.name ?? r.user?.email ?? 'Anon'}
                            </span>{' '}
                            <span className="inline-flex items-center gap-0.5 align-middle text-amber-600">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span className="font-semibold tabular-nums">{r.rating}</span>
                            </span>{' '}
                            <span className="text-muted-foreground">at</span>{' '}
                            <span className="text-muted-foreground">
                              {r.location?.name ?? '—'}
                            </span>
                          </p>
                          {r.text && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              "{r.text}"
                            </p>
                          )}
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {formatDate(r.created_at)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
