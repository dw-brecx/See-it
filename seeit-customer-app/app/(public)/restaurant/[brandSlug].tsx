import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Heart, BookmarkPlus, Share2, MapPin, ArrowLeft, Sparkles } from 'lucide-react-native';
import { BrandThemeProvider, useTheme } from '@/components/brand/ThemeProvider';
import { StorefrontHeader } from '@/components/restaurant/StorefrontHeader';
import { TemporarilyClosedBanner } from '@/components/restaurant/TemporarilyClosedBanner';
import { LocationPicker } from '@/components/restaurant/LocationPicker';
import { KosherBadge } from '@/components/restaurant/KosherBadge';
import { HalalBadge } from '@/components/restaurant/HalalBadge';
import { MenuList } from '@/components/restaurant/MenuList';
import { HoursDisplay } from '@/components/restaurant/HoursDisplay';
import { SocialLinks } from '@/components/restaurant/SocialLinks';
import { WhatsGoodHereButton } from '@/components/restaurant/WhatsGoodHereButton';
import { ReviewCard } from '@/components/review/ReviewCard';
import { RatingBreakdown } from '@/components/review/RatingBreakdown';
import { DishCard } from '@/components/restaurant/DishCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useBrand, useBrandLocations } from '@/lib/hooks/useBrand';
import { useMenu } from '@/lib/hooks/useMenu';
import { useLocationReviews } from '@/lib/hooks/useReviews';
import { useAppStore } from '@/lib/store';
import { useToggleSavedLocation } from '@/lib/hooks/useSavedItems';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDeviceLocation } from '@/lib/hooks/useLocation';
import { distanceMiles } from '@/lib/utils/distance';
import { formatDistance } from '@/lib/utils/formatDistance';
import { pickWhatsGood } from '@/lib/utils/whatsGood';
import { tapLight, tapMedium } from '@/lib/utils/haptics';
import { supabase } from '@/lib/supabase/client';
import { KosherCert, HalalCert } from '@/lib/types';

type Tab = 'menu' | 'reviews' | 'photos' | 'info';

function ActionButton({
  Icon,
  label,
  onPress,
  active,
}: {
  Icon: any;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        tapMedium();
        onPress();
      }}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: active ? theme.accent : '#F3F3EE',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color={active ? '#FFFFFF' : '#1A1A1A'} fill={active ? '#FFFFFF' : 'transparent'} />
      </View>
      <Text style={{ fontSize: 11, color: '#1A1A1A', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

function InnerScreen() {
  const params = useLocalSearchParams<{ brandSlug: string }>();
  const brandId = String(params.brandSlug ?? '');
  const insets = useSafeAreaInsets();
  const coords = useAppStore((s) => s.coords);
  const { user } = useAuth();

  const brandQ = useBrand(brandId);
  const locationsQ = useBrandLocations(brandId);
  const [activeLocationId, setActiveLocationId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!activeLocationId && locationsQ.data && locationsQ.data.length > 0) {
      // Default to nearest if we have coords, else first
      if (coords) {
        let best = locationsQ.data[0];
        let bestD = Infinity;
        for (const l of locationsQ.data) {
          if (l.latitude != null && l.longitude != null) {
            const d = distanceMiles(coords.latitude, coords.longitude, l.latitude, l.longitude);
            if (d < bestD) {
              bestD = d;
              best = l;
            }
          }
        }
        setActiveLocationId(best.id);
      } else {
        setActiveLocationId(locationsQ.data[0].id);
      }
    }
  }, [locationsQ.data, coords, activeLocationId]);

  const activeLocation = locationsQ.data?.find((l) => l.id === activeLocationId);
  const menuQ = useMenu(activeLocationId ?? undefined);
  const reviewsQ = useLocationReviews(activeLocationId ?? undefined);

  // Certs for the active location
  const certs = useQuery({
    queryKey: ['certs', activeLocationId],
    queryFn: async () => {
      if (!activeLocationId) return { kosher: null as KosherCert | null, halal: null as HalalCert | null };
      const [k, h] = await Promise.all([
        supabase.from('kosher_certifications').select('*').eq('location_id', activeLocationId).maybeSingle(),
        Promise.resolve(
          supabase.from('halal_certifications').select('*').eq('location_id', activeLocationId).maybeSingle(),
        ).catch(() => ({ data: null })),
      ]);
      return { kosher: (k.data ?? null) as KosherCert | null, halal: ((h as any).data ?? null) as HalalCert | null };
    },
    enabled: !!activeLocationId,
  });

  const toggleSaved = useToggleSavedLocation();
  const [tab, setTab] = React.useState<Tab>('menu');
  const [whatsGoodOpen, setWhatsGoodOpen] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const distanceLabel = React.useMemo(() => {
    if (!coords || !activeLocation?.latitude || !activeLocation?.longitude) return undefined;
    const d = distanceMiles(coords.latitude, coords.longitude, activeLocation.latitude, activeLocation.longitude);
    return formatDistance(d);
  }, [coords, activeLocation]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([brandQ.refetch(), locationsQ.refetch(), menuQ.refetch(), reviewsQ.refetch()]);
    setRefreshing(false);
  }

  if (brandQ.isLoading || !brandQ.data) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <Skeleton height={280} borderRadius={0} />
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton height={28} width={200} />
          <Skeleton height={14} width={140} />
          <Skeleton height={14} width={240} />
        </View>
      </View>
    );
  }

  const brand = brandQ.data;
  const locations = locationsQ.data ?? [];
  const whatsGoodItems =
    menuQ.data && whatsGoodOpen
      ? pickWhatsGood(
          menuQ.data.items.map((i) => ({ ...i, photo_count: i.photos.length })),
          brand.featured_menu_item_ids ?? [],
          5,
        )
      : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E85D3A" />}
      >
        <StorefrontHeader
          brand={brand}
          averageRating={activeLocation?.average_rating}
          reviewCount={activeLocation?.review_count ?? 0}
          distanceLabel={distanceLabel}
        />

        {/* Back button overlay */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: 16,
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: 'rgba(255,255,255,0.92)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
        >
          <ArrowLeft size={18} color="#1A1A1A" />
        </Pressable>

        {/* Action bar */}
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 4,
          }}
        >
          <ActionButton
            Icon={Heart}
            label="Save"
            onPress={() => {
              if (!user) {
                router.push('/(auth)/signin');
                return;
              }
              toggleSaved.mutate({ locationId: activeLocationId!, currentId: null });
            }}
          />
          <ActionButton
            Icon={BookmarkPlus}
            label="Want to try"
            onPress={() => {
              if (!user) {
                router.push('/(auth)/signin');
                return;
              }
            }}
          />
          <ActionButton
            Icon={Share2}
            label="Share"
            onPress={() => {
              Linking.openURL(`seeit://restaurant/${brand.id}`).catch(() => {});
            }}
          />
          <ActionButton
            Icon={MapPin}
            label="Directions"
            onPress={() => {
              if (!activeLocation) return;
              const q = encodeURIComponent(
                `${activeLocation.address}${activeLocation.city ? `, ${activeLocation.city}` : ''}`,
              );
              Linking.openURL(`https://maps.apple.com/?q=${q}`).catch(() => {});
            }}
          />
        </View>

        {/* Multi-location picker */}
        {locations.length > 1 && (
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            <LocationPicker
              locations={locations}
              selectedId={activeLocationId}
              onSelect={setActiveLocationId}
            />
          </View>
        )}

        {/* Temporarily closed banner */}
        {activeLocation?.is_temporarily_closed && (
          <TemporarilyClosedBanner reopeningDate={activeLocation.reopening_date} />
        )}

        {/* Story */}
        {brand.story ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <Text style={{ fontSize: 15, color: '#1A1A1A', lineHeight: 22 }}>{brand.story}</Text>
          </View>
        ) : null}

        {/* Dietary badges row */}
        {(certs.data?.kosher || certs.data?.halal) && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingTop: 16 }}>
            {certs.data.kosher && (
              <KosherBadge
                locationId={activeLocationId!}
                agency={certs.data.kosher.agency_other ?? certs.data.kosher.agency}
              />
            )}
            {certs.data.halal && (
              <HalalBadge
                locationId={activeLocationId!}
                agency={certs.data.halal.agency_other ?? certs.data.halal.agency}
              />
            )}
          </View>
        )}

        {/* What's good here */}
        <View style={{ paddingTop: 20 }}>
          <WhatsGoodHereButton onPress={() => setWhatsGoodOpen(true)} />
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 20,
            paddingTop: 28,
            paddingBottom: 12,
            gap: 4,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F3EE',
            marginHorizontal: 0,
          }}
        >
          {(['menu', 'reviews', 'photos', 'info'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                tapLight();
                setTab(t);
              }}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderBottomWidth: 2,
                borderBottomColor: tab === t ? '#1A1A1A' : 'transparent',
                marginBottom: -1,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: tab === t ? '#1A1A1A' : '#6B7280',
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab body */}
        {tab === 'menu' &&
          (menuQ.isLoading ? (
            <View style={{ padding: 20, gap: 14 }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={84} />
              ))}
            </View>
          ) : !menuQ.data || menuQ.data.items.length === 0 ? (
            <EmptyState title="No menu yet" subtitle="This restaurant hasn't added their menu." />
          ) : (
            <View style={{ paddingTop: 20 }}>
              <MenuList
                categories={menuQ.data.categories}
                items={menuQ.data.items}
                locationId={activeLocationId!}
              />
            </View>
          ))}

        {tab === 'reviews' && (
          <View style={{ padding: 20, gap: 14 }}>
            {reviewsQ.data && reviewsQ.data.length > 0 ? (
              <>
                <RatingBreakdown reviews={reviewsQ.data} />
                {reviewsQ.data.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </>
            ) : (
              <EmptyState
                title="Be the first to review"
                subtitle="Share what you ate and help others discover this spot."
                ctaLabel={user ? 'Write a review' : 'Sign in to review'}
                onCtaPress={() =>
                  user
                    ? router.push({
                        pathname: '/(auth)/write-review',
                        params: { locationId: activeLocationId! },
                      })
                    : router.push('/(auth)/signin')
                }
              />
            )}
          </View>
        )}

        {tab === 'photos' && (
          <View style={{ padding: 20 }}>
            <EmptyState title="No photos yet" subtitle="Customer photos will show up here as people start sharing." />
          </View>
        )}

        {tab === 'info' && (
          <View style={{ padding: 20, gap: 20 }}>
            <View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                Hours
              </Text>
              <HoursDisplay hours={activeLocation?.hours} />
            </View>
            {activeLocation && (
              <View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 8,
                  }}
                >
                  Address
                </Text>
                <Text style={{ fontSize: 14, color: '#1A1A1A', lineHeight: 20 }}>
                  {activeLocation.address}
                  {activeLocation.city ? `\n${activeLocation.city}` : ''}
                  {activeLocation.state ? `, ${activeLocation.state}` : ''}
                  {activeLocation.zip ? ` ${activeLocation.zip}` : ''}
                </Text>
              </View>
            )}
            {activeLocation?.phone && (
              <Pressable
                onPress={() => Linking.openURL(`tel:${activeLocation.phone}`)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 8,
                  }}
                >
                  Phone
                </Text>
                <Text style={{ fontSize: 14, color: '#E85D3A', fontWeight: '600' }}>
                  {activeLocation.phone}
                </Text>
              </Pressable>
            )}
            <View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Connect
              </Text>
              <SocialLinks brand={brand} />
            </View>
          </View>
        )}
      </ScrollView>

      <BottomSheet open={whatsGoodOpen} onClose={() => setWhatsGoodOpen(false)} title="What's good here?">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingTop: 8 }}>
          {whatsGoodItems.length === 0 ? (
            <Text style={{ color: '#6B7280' }}>Not enough data yet — check back as photos & reviews roll in.</Text>
          ) : (
            whatsGoodItems.map((item) => (
              <DishCard
                key={item.id}
                item={item as any}
                brand_name={brand.name}
                width={(360 - 20 * 2 - 14) / 2}
              />
            ))
          )}
        </View>
      </BottomSheet>
    </View>
  );
}

export default function BrandStorefrontScreen() {
  // We need brand info inside InnerScreen to read theme_color, but the
  // ThemeProvider has to wrap it. Do a tiny double-render: first read brand,
  // then re-render with theme.
  const params = useLocalSearchParams<{ brandSlug: string }>();
  const { data: brand } = useBrand(String(params.brandSlug ?? ''));
  return (
    <BrandThemeProvider themeColor={brand?.theme_color}>
      <InnerScreen />
    </BrandThemeProvider>
  );
}
