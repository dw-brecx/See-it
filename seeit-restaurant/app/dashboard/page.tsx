import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  Camera,
  MessageSquare,
  Plus,
  Sparkles,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { formatRelative, initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchOverview() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Resolve accessible brands
  const [ownedRes, teamRes] = await Promise.all([
    supabase.from('brands').select('id, name').eq('owner_id', user.id),
    supabase.from('team_members').select('brand_id').eq('user_id', user.id),
  ]);
  const brandIds = new Set<string>();
  (ownedRes.data ?? []).forEach((b: any) => brandIds.add(b.id));
  (teamRes.data ?? []).forEach((t: any) => brandIds.add(t.brand_id));
  const ids = Array.from(brandIds);
  if (ids.length === 0) return null;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Locations for these brands
  const { data: locs } = await supabase
    .from('locations')
    .select('id, name, brand_id, average_rating, review_count')
    .in('brand_id', ids);
  const locationIds = (locs ?? []).map((l: any) => l.id);

  if (locationIds.length === 0) {
    return {
      hasLocations: false,
      brandName: ownedRes.data?.[0]?.name ?? null,
      brandCount: ids.length,
      avgRating: null,
      reviewsThisWeek: 0,
      reviewsThisMonth: 0,
      unrepliedCount: 0,
      photosThisWeek: 0,
      menuItemsHiddenOrIncomplete: 0,
      recentReviews: [],
    };
  }

  const [reviewsWeek, reviewsMonth, unreplied, photosWeek, recentReviews, menuItemsRes] =
    await Promise.all([
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .in('location_id', locationIds)
        .gte('created_at', sevenDaysAgo),
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .in('location_id', locationIds)
        .gte('created_at', thirtyDaysAgo),
      supabase
        .from('reviews')
        .select(
          'id, rating, text, created_at, user:users(name, email, avatar_url), location:locations(name), review_replies(id)',
        )
        .in('location_id', locationIds)
        .order('created_at', { ascending: false })
        .limit(20),
      (async () => {
        // Photos uploaded this week — need menu items first
        const { data: items } = await supabase
          .from('menu_items')
          .select('id')
          .in('location_id', locationIds);
        const itemIds = (items ?? []).map((m: any) => m.id);
        if (itemIds.length === 0) return { count: 0 };
        const { count } = await supabase
          .from('menu_item_photos')
          .select('id', { count: 'exact', head: true })
          .in('menu_item_id', itemIds)
          .gte('created_at', sevenDaysAgo);
        return { count: count ?? 0 };
      })(),
      supabase
        .from('reviews')
        .select(
          'id, rating, text, created_at, user:users(name, email, avatar_url), location:locations(id, name), review_replies(id)',
        )
        .in('location_id', locationIds)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('menu_items')
        .select('id, name, description, is_visible, menu_item_photos(id)')
        .in('location_id', locationIds),
    ]);

  const allRecent = (recentReviews.data ?? []) as any[];
  const unrepliedRows = (unreplied.data ?? []) as any[];
  const unrepliedCount = unrepliedRows.filter(
    (r) => !r.review_replies?.length,
  ).length;

  const items = (menuItemsRes.data ?? []) as any[];
  const menuItemsHiddenOrIncomplete = items.filter(
    (i) =>
      !i.is_visible ||
      !i.description ||
      i.description.length < 12 ||
      !i.menu_item_photos ||
      i.menu_item_photos.length === 0,
  ).length;

  const ratedLocs = (locs ?? []).filter((l: any) => l.average_rating != null) as any[];
  const avg =
    ratedLocs.length === 0
      ? null
      : ratedLocs.reduce((s, l) => s + Number(l.average_rating), 0) /
        ratedLocs.length;

  return {
    hasLocations: true,
    brandName: ownedRes.data?.[0]?.name ?? null,
    brandCount: ids.length,
    avgRating: avg,
    reviewsThisWeek: reviewsWeek.count ?? 0,
    reviewsThisMonth: reviewsMonth.count ?? 0,
    unrepliedCount,
    photosThisWeek: photosWeek.count,
    menuItemsHiddenOrIncomplete,
    recentReviews: allRecent.slice(0, 5),
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
  if (!data) redirect('/onboarding');

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user!.id)
    .maybeSingle();
  const firstName = profile?.name?.split(' ')[0] ?? null;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <TopBar title="Dashboard" subtitle="Your restaurant at a glance" />
      <div className="flex-1 space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-terracotta-100 bg-gradient-to-br from-terracotta-50 via-warm-25 to-card p-5 shadow-soft sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-terracotta-200/40 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl"
          />

          <div className="relative flex flex-col gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-terracotta-200 bg-white/60 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-terracotta-700 backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                {today}
              </div>
              <h2 className="mt-3 text-[28px] font-bold leading-[1.1] tracking-tight text-foreground sm:text-[32px]">
                {greeting()}
                {firstName ? `, ${firstName}` : ''}.
              </h2>
              <p className="mt-2 max-w-xl text-[14.5px] text-muted-foreground">
                Here's what's happening with your restaurant today.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <QuickAction
                href="/dashboard/menu"
                label="Add menu item"
                description="New dish or drink"
                icon={UtensilsCrossed}
                tone="terracotta"
              />
              <QuickAction
                href="/dashboard/photos"
                label="Upload photos"
                description="Show off your food"
                icon={Camera}
                tone="rose"
              />
              <QuickAction
                href="/dashboard/reviews"
                label="Reply to reviews"
                description={data.unrepliedCount > 0 ? `${data.unrepliedCount} waiting` : 'All caught up'}
                icon={MessageSquare}
                tone="amber"
              />
              <QuickAction
                href="/dashboard/ai-assistant"
                label="AI assistant"
                description="Improve your listing"
                icon={Sparkles}
                tone="violet"
              />
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Average rating"
            value={data.avgRating != null ? data.avgRating.toFixed(1) : '—'}
            icon={Star}
            tone="amber"
            hint="Across all locations"
          />
          <StatCard
            label="Reviews · 30d"
            value={data.reviewsThisMonth.toLocaleString()}
            icon={MessageSquare}
            tone="terracotta"
            hint={`${data.reviewsThisWeek} this week`}
          />
          <StatCard
            label="Photos this week"
            value={data.photosThisWeek.toLocaleString()}
            icon={Camera}
            tone="rose"
          />
          <StatCard
            label="Items to fix"
            value={data.menuItemsHiddenOrIncomplete.toLocaleString()}
            icon={UtensilsCrossed}
            tone="blue"
            hint="Missing photo or description"
          />
        </div>

        {/* Recent reviews */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-0.5">
              <CardTitle>Recent reviews</CardTitle>
              <p className="text-[12.5px] text-muted-foreground">
                Latest feedback from diners
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
                description="As customers post reviews, they'll show up here. Encourage diners to leave honest feedback."
              />
            ) : (
              <ul className="divide-y divide-border">
                {data.recentReviews.map((r: any) => {
                  const replied = r.review_replies?.length > 0;
                  return (
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
                            {r.user?.name ?? r.user?.email ?? 'Anonymous'}
                          </span>
                          <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-[11.5px] font-semibold tabular-nums">
                              {r.rating}
                            </span>
                          </span>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="truncate text-[12.5px] text-muted-foreground">
                            {r.location?.name}
                          </span>
                          {replied ? (
                            <Badge variant="success" className="ml-auto">
                              Replied
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="ml-auto">
                              Needs reply
                            </Badge>
                          )}
                        </div>
                        {r.text && (
                          <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">
                            "{r.text}"
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                          {formatRelative(r.created_at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function QuickAction({
  href,
  label,
  description,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  description: string;
  icon: any;
  tone: 'terracotta' | 'rose' | 'amber' | 'violet';
}) {
  const tones: Record<typeof tone, { bg: string; text: string; ring: string }> = {
    terracotta: {
      bg: 'bg-terracotta-50',
      text: 'text-terracotta-600',
      ring: 'ring-terracotta-100',
    },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100' },
  };
  const t = tones[tone];
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-border bg-card/90 p-3 shadow-xs backdrop-blur-sm transition-all hover:-translate-y-px hover:border-warm-200 hover:bg-card hover:shadow-soft"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${t.bg} ${t.text} ${t.ring}`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-foreground">{label}</p>
        <p className="truncate text-[11.5px] text-muted-foreground">
          {description}
        </p>
      </div>
      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-terracotta-600" />
    </Link>
  );
}
