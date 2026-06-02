'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Camera,
  MessageSquare,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { ALL_LOCATIONS, useBrand } from '@/components/BrandContext';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const TERRACOTTA = '#E85D3A';
const EMERALD = '#10B981';
const AMBER = '#F59E0B';

type ReviewRow = {
  rating: number;
  created_at: string | null;
  location_id: string;
};

type MenuItemRow = {
  id: string;
  name: string;
  review_count: number | null;
  photo_count: number | null;
};

type PhotoRow = { created_at: string | null };

type InsightsData = {
  reviews: ReviewRow[];
  reviewsAllTime: number;
  avgRating: number | null;
  totalPhotos: number;
  totalMenuItems: number;
  topItems: MenuItemRow[];
  photos: PhotoRow[];
};

function dayKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shortDay(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

function weekStart(d: Date): Date {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = copy.getUTCDay(); // 0=Sun
  const diff = (day + 6) % 7; // back to Monday
  copy.setUTCDate(copy.getUTCDate() - diff);
  return copy;
}

export function InsightsCharts() {
  const { currentBrand, currentBrandId, currentLocationId, brandLocations } = useBrand();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<InsightsData | null>(null);

  // Resolve which location IDs to query.
  const scopedLocationIds = React.useMemo(() => {
    if (!currentBrandId) return [];
    if (currentLocationId === ALL_LOCATIONS) {
      return brandLocations.map((l) => l.id);
    }
    return [currentLocationId];
  }, [currentBrandId, currentLocationId, brandLocations]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!currentBrandId || scopedLocationIds.length === 0) {
        if (!cancelled) {
          setData(null);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      const supabase = createClient();
      const ninetyDaysAgo = new Date(
        Date.now() - 90 * 24 * 60 * 60 * 1000,
      ).toISOString();

      // Reviews (last 90 days for trend, but we'll also need all-time count)
      const [reviewsRes, allReviewsCountRes, menuItemsRes] = await Promise.all([
        supabase
          .from('reviews')
          .select('rating, created_at, location_id')
          .in('location_id', scopedLocationIds)
          .gte('created_at', ninetyDaysAgo)
          .order('created_at', { ascending: true }),
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .in('location_id', scopedLocationIds),
        supabase
          .from('menu_items')
          .select('id, name, review_count, photo_count')
          .in('location_id', scopedLocationIds),
      ]);

      const reviews = (reviewsRes.data ?? []) as ReviewRow[];
      const items = (menuItemsRes.data ?? []) as MenuItemRow[];
      const reviewsAllTime = allReviewsCountRes.count ?? 0;

      // Avg rating from all-time reviews — we approximate using last-90-days
      // when total > 90d window, otherwise count is identical anyway.
      // For accuracy, fetch the global avg from a separate aggregation:
      let avgRating: number | null = null;
      if (reviewsAllTime > 0) {
        const { data: rated } = await supabase
          .from('reviews')
          .select('rating')
          .in('location_id', scopedLocationIds);
        const rows = (rated ?? []) as { rating: number }[];
        if (rows.length > 0) {
          avgRating =
            rows.reduce((s, r) => s + Number(r.rating), 0) / rows.length;
        }
      }

      // Photos via menu_items → menu_item_photos
      const itemIds = items.map((i) => i.id);
      let photos: PhotoRow[] = [];
      let totalPhotos = 0;
      if (itemIds.length > 0) {
        const thirtyDaysAgo = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const [recentPhotosRes, allPhotosCountRes] = await Promise.all([
          supabase
            .from('menu_item_photos')
            .select('created_at')
            .in('menu_item_id', itemIds)
            .gte('created_at', thirtyDaysAgo),
          supabase
            .from('menu_item_photos')
            .select('id', { count: 'exact', head: true })
            .in('menu_item_id', itemIds),
        ]);
        photos = (recentPhotosRes.data ?? []) as PhotoRow[];
        totalPhotos = allPhotosCountRes.count ?? 0;
      }

      // Top items by (review_count + photo_count)
      const topItems = [...items]
        .map((i) => ({
          ...i,
          _score: (i.review_count ?? 0) + (i.photo_count ?? 0),
        }))
        .sort((a, b) => b._score - a._score)
        .slice(0, 8);

      if (!cancelled) {
        setData({
          reviews,
          reviewsAllTime,
          avgRating,
          totalPhotos,
          totalMenuItems: items.length,
          topItems,
          photos,
        });
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [currentBrandId, scopedLocationIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentBrand) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Store}
            title="Pick a store first"
            description="Choose a brand from the switcher above to see insights."
          />
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <InsightsSkeleton />;
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Store}
            title="No locations yet"
            description="Add a location to start collecting insights."
          />
        </CardContent>
      </Card>
    );
  }

  // Derive chart data
  const now = new Date();
  const thirtyDayKeys: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    thirtyDayKeys.push(dayKey(d));
  }

  const reviewsPerDayMap = new Map<string, number>(
    thirtyDayKeys.map((k) => [k, 0]),
  );
  const thirtyDaysAgoMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  data.reviews.forEach((r) => {
    if (!r.created_at) return;
    const dt = new Date(r.created_at);
    if (dt.getTime() < thirtyDaysAgoMs) return;
    const k = dayKey(dt);
    if (reviewsPerDayMap.has(k)) {
      reviewsPerDayMap.set(k, (reviewsPerDayMap.get(k) ?? 0) + 1);
    }
  });
  const reviewsPerDay = thirtyDayKeys.map((k) => ({
    date: k,
    label: shortDay(k),
    count: reviewsPerDayMap.get(k) ?? 0,
  }));

  // Top viewed dishes (proxy = review_count + photo_count)
  const topItemsData = data.topItems.map((i) => ({
    name: i.name.length > 18 ? i.name.slice(0, 17) + '…' : i.name,
    fullName: i.name,
    score: (i.review_count ?? 0) + (i.photo_count ?? 0),
    reviews: i.review_count ?? 0,
    photos: i.photo_count ?? 0,
  }));

  // Weekly average rating, last 90 days
  const weekMap = new Map<string, { sum: number; count: number }>();
  data.reviews.forEach((r) => {
    if (!r.created_at) return;
    const w = weekStart(new Date(r.created_at));
    const k = dayKey(w);
    const cur = weekMap.get(k) ?? { sum: 0, count: 0 };
    cur.sum += Number(r.rating);
    cur.count += 1;
    weekMap.set(k, cur);
  });
  const ratingTrend = Array.from(weekMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => ({
      date: k,
      label: shortDay(k),
      avg: Number((v.sum / v.count).toFixed(2)),
    }));

  // Photos per day, last 30 days
  const photosPerDayMap = new Map<string, number>(
    thirtyDayKeys.map((k) => [k, 0]),
  );
  data.photos.forEach((p) => {
    if (!p.created_at) return;
    const k = dayKey(new Date(p.created_at));
    if (photosPerDayMap.has(k)) {
      photosPerDayMap.set(k, (photosPerDayMap.get(k) ?? 0) + 1);
    }
  });
  const photosPerDay = thirtyDayKeys.map((k) => ({
    date: k,
    label: shortDay(k),
    count: photosPerDayMap.get(k) ?? 0,
  }));

  const dataAccumulating = data.reviewsAllTime < 10;

  return (
    <>
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total reviews"
          value={data.reviewsAllTime.toLocaleString()}
          icon={MessageSquare}
          tone="terracotta"
          hint="All-time"
        />
        <StatCard
          label="Avg rating"
          value={data.avgRating != null ? data.avgRating.toFixed(1) : '—'}
          icon={Star}
          tone="amber"
        />
        <StatCard
          label="Total photos"
          value={data.totalPhotos.toLocaleString()}
          icon={Camera}
          tone="rose"
        />
        <StatCard
          label="Menu items"
          value={data.totalMenuItems.toLocaleString()}
          icon={UtensilsCrossed}
          tone="blue"
        />
      </div>

      {dataAccumulating && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Coming soon — data accumulating
          </span>{' '}
          You have {data.reviewsAllTime} review{data.reviewsAllTime === 1 ? '' : 's'} so far.
          Charts will fill in as more diners post.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="Reviews per day"
          subtitle="Last 30 days"
          icon={MessageSquare}
          faded={dataAccumulating}
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={reviewsPerDay}>
              <CartesianGrid stroke="#F0EDE3" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#79725F"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                stroke="#79725F"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                allowDecimals={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #E5E0D2',
                  fontSize: 12,
                }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={TERRACOTTA}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Top dishes"
          subtitle="By review + photo activity"
          icon={UtensilsCrossed}
          faded={dataAccumulating}
        >
          {topItemsData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-[13px] text-muted-foreground">
              No menu items yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topItemsData} layout="vertical" margin={{ left: 4 }}>
                <CartesianGrid stroke="#F0EDE3" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#79725F"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#79725F"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E5E0D2',
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [value, 'Popularity']}
                  labelFormatter={(_, payload) =>
                    (payload?.[0]?.payload as any)?.fullName ?? ''
                  }
                />
                <Bar
                  dataKey="score"
                  fill={TERRACOTTA}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Rating trend"
          subtitle="Weekly average · last 90 days"
          icon={TrendingUp}
          faded={dataAccumulating}
        >
          {ratingTrend.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-[13px] text-muted-foreground">
              Not enough reviews to chart a trend yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ratingTrend}>
                <CartesianGrid stroke="#F0EDE3" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#79725F"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  stroke="#79725F"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  width={20}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #E5E0D2',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke={EMERALD}
                  strokeWidth={2}
                  dot={{ r: 3, fill: EMERALD }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Photo activity"
          subtitle="Uploads per day · last 30 days"
          icon={Camera}
          faded={dataAccumulating}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={photosPerDay}>
              <defs>
                <linearGradient id="photoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AMBER} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F0EDE3" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#79725F"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                stroke="#79725F"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                allowDecimals={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #E5E0D2',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={AMBER}
                strokeWidth={2}
                fill="url(#photoGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  faded,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  faded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="flex items-center gap-2 text-[14px]">
            <Icon className="h-4 w-4 text-terracotta-600" />
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-[12px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn('pt-2', faded && 'opacity-40')}>
        {children}
      </CardContent>
    </Card>
  );
}

function InsightsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[112px] w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] w-full" />
        ))}
      </div>
    </>
  );
}
