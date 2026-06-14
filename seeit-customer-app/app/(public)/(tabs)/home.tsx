import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search as SearchIcon, ChevronDown } from 'lucide-react-native';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { HorizontalCardScroll } from '@/components/home/HorizontalCardScroll';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { DishCard } from '@/components/restaurant/DishCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useNearbyBrands } from '@/lib/hooks/useNearby';
import { useDeviceLocation } from '@/lib/hooks/useLocation';
import {
  fetchNewlyVerifiedBrands,
  fetchPublishedBrands,
  fetchAllBrandsRaw,
} from '@/lib/api/brands';
import { fetchTrendingDishes, fetchNewDishes } from '@/lib/api/dishes';
import { useAppStore } from '@/lib/store';
import { tapLight, selection } from '@/lib/utils/haptics';
import { PRESET_CITIES } from '@/lib/utils/cities';
import { debugLog } from '@/lib/utils/debugLog';
import { colors } from '@/lib/utils/colors';

function CardRowSkeleton() {
  return (
    <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: 20 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 260 }}>
          <Skeleton height={160} borderRadius={16} />
          <View style={{ marginTop: 10, gap: 6 }}>
            <Skeleton height={14} width={180} />
            <Skeleton height={12} width={120} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { coords, status, request } = useDeviceLocation();
  const manualLabel = useAppStore((s) => s.manualLocationLabel);
  const setManualLocation = useAppStore((s) => s.setManualLocation);
  const devMode = useAppStore((s) => s.devMode);
  const [refreshing, setRefreshing] = React.useState(false);
  const [cityPickerOpen, setCityPickerOpen] = React.useState(false);

  React.useEffect(() => {
    if (status === 'idle' && !manualLabel) void request();
  }, [status, request, manualLabel]);

  // Three parallel queries — every section gets its own + we layer them as
  // fallbacks for the Discover rail. publishedQ and rawQ run unconditionally
  // so the fallback is instant when nearby comes back empty.
  const nearby = useNearbyBrands(devMode ? 10000 : 25);
  const verified = useQuery({
    queryKey: ['home.verified'],
    queryFn: () => fetchNewlyVerifiedBrands(12),
  });
  const published = useQuery({
    queryKey: ['home.published'],
    queryFn: () => fetchPublishedBrands(24),
  });
  const raw = useQuery({
    queryKey: ['home.raw'],
    queryFn: () => fetchAllBrandsRaw(50),
  });
  // Two dish rails — these are what make the home screen feel like a food
  // app instead of a store directory. Fetch unconditionally so the rails
  // populate the moment we land on home.
  const trending = useQuery({
    queryKey: ['home.trending-dishes'],
    queryFn: () => fetchTrendingDishes(20),
  });
  const newDishes = useQuery({
    queryKey: ['home.new-dishes'],
    queryFn: () => fetchNewDishes(20),
  });
  const verifiedData: any[] = (verified.data as any[] | undefined) ?? [];

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([
      nearby.refetch(),
      verified.refetch(),
      published.refetch(),
      raw.refetch(),
      trending.refetch(),
      newDishes.refetch(),
    ]);
    setRefreshing(false);
  }

  /**
   * Discover rail fallback chain:
   *   1. Dev mode → raw (every brand, no filter)
   *   2. Got device coords + nearby has results → nearby (with distance)
   *   3. published has results → published (sorted by created_at)
   *   4. raw has results → raw (last resort, no visibility filter)
   *   5. Truly nothing → empty state
   *
   * This guarantees: if any brand row exists in the DB, the rail renders
   * something. The diagnostic logs tell us exactly which path won.
   */
  const nearbyData = nearby.data ?? [];
  const publishedData = published.data ?? [];
  const rawData = raw.data ?? [];

  let railItems: { brand: any; nearest?: any; distance_miles?: number | null }[] = [];
  let railSource: 'devMode' | 'nearby' | 'published' | 'raw' | 'empty' = 'empty';
  let railSubtitle = '';
  let railTitle = 'Discover';

  if (devMode && rawData.length > 0) {
    railItems = rawData.map((b) => ({ brand: b }));
    railSource = 'devMode';
    railTitle = 'Every spot';
    railSubtitle = 'Dev mode — distance filtering off';
  } else if (coords && nearbyData.length > 0) {
    railItems = nearbyData;
    railSource = 'nearby';
    railTitle = 'Near You';
    railSubtitle = 'Closest spots first';
  } else if (publishedData.length > 0) {
    railItems = publishedData.map((b) => ({ brand: b }));
    railSource = 'published';
    railTitle = 'Discover';
    railSubtitle = coords
      ? 'No spots in your area yet — showing recent additions'
      : 'Pick a location for personalized nearby results';
  } else if (rawData.length > 0) {
    railItems = rawData.map((b) => ({ brand: b }));
    railSource = 'raw';
    railTitle = 'Discover';
    railSubtitle = 'Showing every spot we know about';
  }

  // One terminal-friendly summary line per render so the user can scan
  // and see which path the rail took on each reload.
  React.useEffect(() => {
    debugLog('home.render', 'rail decision', {
      source: railSource,
      itemCount: railItems.length,
      coords: !!coords,
      devMode,
      counts: {
        nearby: nearbyData.length,
        published: publishedData.length,
        raw: rawData.length,
        verified: verifiedData.length,
      },
    });
  }, [
    railSource,
    railItems.length,
    coords,
    devMode,
    nearbyData.length,
    publishedData.length,
    rawData.length,
    verified.data?.length,
  ]);

  const locationChipLabel =
    manualLabel ?? (coords ? 'Near you' : status === 'denied' ? 'Choose a city' : 'Locating…');
  const isAnyLoading =
    nearby.isLoading || published.isLoading || raw.isLoading || verified.isLoading;

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          backgroundColor: '#FAFAF7',
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={() => {
              tapLight();
              setCityPickerOpen(true);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <MapPin size={14} color="#E85D3A" />
            <Text style={{ fontWeight: '700', color: '#1A1A1A', fontSize: 13 }}>
              {locationChipLabel}
            </Text>
            <ChevronDown size={14} color="#6B7280" />
          </Pressable>
        </View>
        <Pressable
          onPress={() => router.push('/(public)/(tabs)/search')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#F3F3EE',
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <SearchIcon size={18} color="#6B7280" />
          <Text style={{ fontSize: 14, color: '#6B7280', flex: 1 }}>
            Search restaurants or dishes
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E85D3A"
          />
        }
      >
        {/* Hero */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: '#1A1A1A',
              letterSpacing: -0.6,
            }}
          >
            See it before you{'\n'}order it.
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 6 }}>
            Real photos, real reviews — find your next favorite dish.
          </Text>
        </View>

        {/* Discover / Near You */}
        <SectionHeader title={railTitle} subtitle={railSubtitle || 'Closest spots first'} />
        {isAnyLoading && railItems.length === 0 ? (
          <CardRowSkeleton />
        ) : railItems.length > 0 ? (
          <HorizontalCardScroll>
            {railItems.slice(0, 16).map((r) => (
              <RestaurantCard
                key={r.brand.id}
                brand={r.brand}
                nearest={r.nearest ?? undefined}
                distance_miles={r.distance_miles ?? undefined}
              />
            ))}
          </HorizontalCardScroll>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon={<MapPin size={28} color="#E85D3A" />}
              title="No spots yet"
              subtitle="We're adding new restaurants every week — pull down to refresh, or try a different city from the location pill above."
              ctaLabel="Try a different city"
              onCtaPress={() => setCityPickerOpen(true)}
            />
          </View>
        )}

        {/* Newly Verified */}
        <SectionHeader
          title="Newly Verified ✓"
          subtitle="Recently verified stores"
        />
        {verified.isLoading && (verifiedData.length) === 0 ? (
          <CardRowSkeleton />
        ) : (verifiedData.length) > 0 ? (
          <HorizontalCardScroll>
            {verifiedData.map((b) => (
              <RestaurantCard key={b.id} brand={b} />
            ))}
          </HorizontalCardScroll>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>
              No verified stores yet — check back soon.
            </Text>
          </View>
        )}

        {/* "Just joined" — same data as Discover fallback but separate visual */}
        <SectionHeader title="Just joined" subtitle="Fresh spots on the app" />
        {published.isLoading && publishedData.length === 0 ? (
          <CardRowSkeleton />
        ) : publishedData.length > 0 ? (
          <HorizontalCardScroll>
            {publishedData.map((b) => (
              <RestaurantCard key={b.id} brand={b} />
            ))}
          </HorizontalCardScroll>
        ) : rawData.length > 0 ? (
          <HorizontalCardScroll>
            {rawData.map((b) => (
              <RestaurantCard key={b.id} brand={b} />
            ))}
          </HorizontalCardScroll>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>
              Nothing here yet — check back soon.
            </Text>
          </View>
        )}

        {/* Trending dishes — the food rail. This is the difference between
            a restaurant directory and SeeIt. Dishes with photos appear
            first so the rail is visually loud. */}
        <SectionHeader
          title="Trending dishes"
          subtitle="What people are ordering right now"
        />
        {trending.isLoading ? (
          <CardRowSkeleton />
        ) : (trending.data?.length ?? 0) > 0 ? (
          <HorizontalCardScroll>
            {trending.data!.map((d) => (
              <DishCard
                key={d.id}
                item={{
                  id: d.id,
                  name: d.name,
                  description: d.description,
                  price: d.price,
                  dietary_tags: d.dietary_tags,
                  average_rating: d.average_rating,
                  review_count: d.review_count,
                  location_id: d.location_id,
                  is_visible: true,
                  category_id: null,
                  cover_photo_url: d.cover_photo_url,
                }}
                brand_name={d.brand_name}
                cuisine={d.cuisine}
                width={200}
              />
            ))}
          </HorizontalCardScroll>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              No dishes with photos yet — once owners upload menu photos
              they'll show up here.
            </Text>
          </View>
        )}

        {/* Newest dishes — most recently added by restaurants */}
        <SectionHeader title="Fresh on the menu" subtitle="Recently added dishes" />
        {newDishes.isLoading ? (
          <CardRowSkeleton />
        ) : (newDishes.data?.length ?? 0) > 0 ? (
          <HorizontalCardScroll>
            {newDishes.data!.map((d) => (
              <DishCard
                key={d.id}
                item={{
                  id: d.id,
                  name: d.name,
                  description: d.description,
                  price: d.price,
                  dietary_tags: d.dietary_tags,
                  average_rating: d.average_rating,
                  review_count: d.review_count,
                  location_id: d.location_id,
                  is_visible: true,
                  category_id: null,
                  cover_photo_url: d.cover_photo_url,
                }}
                brand_name={d.brand_name}
                cuisine={d.cuisine}
                width={200}
              />
            ))}
          </HorizontalCardScroll>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              No new dishes yet — check back soon.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomSheet
        open={cityPickerOpen}
        onClose={() => setCityPickerOpen(false)}
        title="Pick a city"
      >
        <View style={{ gap: 8, paddingTop: 4 }}>
          <Pressable
            onPress={() => {
              selection();
              setManualLocation(null, coords);
              setCityPickerOpen(false);
              void request();
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 14,
              backgroundColor: !manualLabel ? '#FDF2EE' : '#FFFFFF',
              borderWidth: 1,
              borderColor: !manualLabel ? '#E85D3A' : '#E5E5E0',
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <MapPin size={18} color="#E85D3A" />
            <Text style={{ fontWeight: '700', color: '#1A1A1A', flex: 1 }}>
              Use my location
            </Text>
          </Pressable>
          {PRESET_CITIES.map((c) => {
            const isActive = manualLabel === c.label;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  selection();
                  setManualLocation(c.label, {
                    latitude: c.latitude,
                    longitude: c.longitude,
                  });
                  setCityPickerOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: isActive ? '#FDF2EE' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: isActive ? '#E85D3A' : '#E5E5E0',
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text style={{ fontWeight: '600', color: '#1A1A1A' }}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}
