import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search as SearchIcon, Map } from 'lucide-react-native';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { HorizontalCardScroll } from '@/components/home/HorizontalCardScroll';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNearbyBrands } from '@/lib/hooks/useNearby';
import { useDeviceLocation } from '@/lib/hooks/useLocation';
import { fetchNewlyVerifiedBrands, fetchNewBrands } from '@/lib/api/brands';
import { tapLight } from '@/lib/utils/haptics';

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
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (status === 'idle') void request();
  }, [status, request]);

  const nearby = useNearbyBrands(10);
  const verified = useQuery({
    queryKey: ['newly-verified'],
    queryFn: () => fetchNewlyVerifiedBrands(12),
  });
  const newBrands = useQuery({
    queryKey: ['new-brands'],
    queryFn: () => fetchNewBrands(12),
  });

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([nearby.refetch(), verified.refetch(), newBrands.refetch()]);
    setRefreshing(false);
  }

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
              void request();
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <MapPin size={16} color="#E85D3A" />
            <Text style={{ fontWeight: '700', color: '#1A1A1A', fontSize: 14 }}>
              {coords ? 'Near you' : status === 'denied' ? 'Tap to enable location' : 'Locating…'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(public)/(tabs)/search')}
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#F3F3EE',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Map size={18} color="#1A1A1A" />
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

        {/* Near You */}
        <SectionHeader
          title="Near You"
          subtitle={coords ? 'Closest spots first' : 'Enable location to see this section'}
        />
        {nearby.isLoading ? (
          <CardRowSkeleton />
        ) : nearby.data && nearby.data.length > 0 ? (
          <HorizontalCardScroll>
            {nearby.data.slice(0, 12).map((r) => (
              <RestaurantCard
                key={r.brand.id}
                brand={r.brand}
                nearest={r.nearest}
                distance_miles={r.distance_miles}
              />
            ))}
          </HorizontalCardScroll>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon={<MapPin size={28} color="#E85D3A" />}
              title={status === 'denied' ? 'Location off' : 'Nothing nearby yet'}
              subtitle={
                status === 'denied'
                  ? 'Enable location in Settings to see restaurants nearby.'
                  : 'Try another area or check back as more restaurants join.'
              }
            />
          </View>
        )}

        {/* Newly Verified */}
        <SectionHeader title="Newly Verified ✓" subtitle="Spots with the SeeIt blue check" />
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
        ) : newBrands.data && newBrands.data.length > 0 ? (
          <HorizontalCardScroll>
            {newBrands.data.map((b) => (
              <RestaurantCard key={b.id} brand={b} />
            ))}
          </HorizontalCardScroll>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
