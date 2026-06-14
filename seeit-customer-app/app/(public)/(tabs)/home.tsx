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
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useNearbyBrands } from '@/lib/hooks/useNearby';
import { useDeviceLocation } from '@/lib/hooks/useLocation';
import { fetchNewlyVerifiedBrands, fetchNewBrands, fetchAllBrandsRaw } from '@/lib/api/brands';
import { useAppStore } from '@/lib/store';
import { tapLight, selection } from '@/lib/utils/haptics';
import { distanceMiles } from '@/lib/utils/distance';
import { PRESET_CITIES } from '@/lib/utils/cities';

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

  const nearby = useNearbyBrands(devMode ? 10000 : 25);
  const verified = useQuery({
    queryKey: ['newly-verified'],
    queryFn: () => fetchNewlyVerifiedBrands(12),
  });
  const newBrands = useQuery({
    queryKey: ['new-brands'],
    queryFn: () => fetchNewBrands(24),
  });
  // Loaded only when we need to fall back (no nearby + no devMode coverage)
  const allBrands = useQuery({
    queryKey: ['all-brands-raw'],
    queryFn: () => fetchAllBrandsRaw(50),
    enabled: devMode || !coords,
  });

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([nearby.refetch(), verified.refetch(), newBrands.refetch(), allBrands.refetch()]);
    setRefreshing(false);
  }

  // Compose the "Near You" rail:
  //  1. If devMode is on → show every brand (raw, no visibility filter), so
  //     seed data without storefront_published=true still appears.
  //  2. If we have coords + nearby results → show nearby.
  //  3. Otherwise fall back to all published brands sorted by created_at.
  //     This is the "never show empty if data exists" guarantee.
  const nearbyData = nearby.data ?? [];
  const newBrandsList = newBrands.data ?? [];
  const allBrandsList = allBrands.data ?? [];

  let railItems: { brand: any; nearest: any; distance_miles: number | null }[];
  let railFallbackNote: string | null = null;

  if (devMode) {
    railItems = allBrandsList.map((b) => ({ brand: b, nearest: null, distance_miles: null }));
    railFallbackNote = 'Dev mode — showing every brand in the database';
  } else if (coords && nearbyData.length > 0) {
    railItems = nearbyData;
    railFallbackNote = null;
  } else {
    railItems = newBrandsList.map((b) => ({ brand: b, nearest: null, distance_miles: null }));
    railFallbackNote = coords
      ? 'No spots in your area yet — showing recent additions'
      : 'Enable location for personalized nearby results';
  }

  const locationChipLabel = manualLabel ?? (coords ? 'Near you' : status === 'denied' ? 'Choose a city' : 'Locating…');

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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E85D3A" />
        }
      >
        {/* Hero / personalised greeting */}
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

        {/* Near You (or fallback) */}
        <SectionHeader
          title={devMode ? 'Every brand' : coords && nearbyData.length > 0 ? 'Near You' : 'Discover'}
          subtitle={railFallbackNote ?? 'Closest spots first'}
        />
        {(nearby.isLoading || (allBrands.isLoading && railItems.length === 0)) ? (
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
              title="No spots to show yet"
              subtitle="Once restaurants publish their storefronts, they'll show up here."
            />
          </View>
        )}

        {/* Newly Verified */}
        <SectionHeader title="Newly Verified ✓" subtitle="Recently verified spots" />
        {verified.isLoading ? (
          <CardRowSkeleton />
        ) : verified.data && verified.data.length > 0 ? (
          <HorizontalCardScroll>
            {verified.data.map((b) => (
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

        {/* New on SeeIt */}
        <SectionHeader title="New on SeeIt" subtitle="Fresh spots joining the community" />
        {newBrands.isLoading ? (
          <CardRowSkeleton />
        ) : newBrandsList.length > 0 ? (
          <HorizontalCardScroll>
            {newBrandsList.map((b) => (
              <RestaurantCard key={b.id} brand={b} />
            ))}
          </HorizontalCardScroll>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>Nothing here yet — check back soon.</Text>
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
            <Text style={{ fontWeight: '700', color: '#1A1A1A', flex: 1 }}>Use my location</Text>
          </Pressable>
          {PRESET_CITIES.map((c) => {
            const isActive = manualLabel === c.label;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  selection();
                  setManualLocation(c.label, { latitude: c.latitude, longitude: c.longitude });
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
