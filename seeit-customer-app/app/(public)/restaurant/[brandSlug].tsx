import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  RefreshControl,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  BookmarkPlus,
  Share2,
  MapPin,
  ArrowLeft,
} from 'lucide-react-native';
import { BrandThemeProvider } from '@/components/brand/ThemeProvider';
import { StorefrontHeader } from '@/components/restaurant/StorefrontHeader';
import { TemporarilyClosedBanner } from '@/components/restaurant/TemporarilyClosedBanner';
import { LocationPicker } from '@/components/restaurant/LocationPicker';
import { KosherCertChipRow } from '@/components/restaurant/KosherCertChipRow';
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
import {
  useToggleSavedLocation,
  useSavedLocationId,
  useSetWantToTry,
} from '@/lib/hooks/useSavedItems';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/lib/hooks/useAuth';
import { distanceMiles } from '@/lib/utils/distance';
import { formatDistance } from '@/lib/utils/formatDistance';
import { pickWhatsGood } from '@/lib/utils/whatsGood';
import { tapLight, tapMedium } from '@/lib/utils/haptics';
import { supabase } from '@/lib/supabase/client';
import { KosherCert, HalalCert } from '@/lib/types';
import { colors } from '@/lib/utils/colors';
import { pluralize } from '@/lib/utils/pluralize';
import { fetchReviewsForBrand } from '@/lib/api/reviews';
import { fetchAllPhotosForBrand } from '@/lib/api/menuItems';
import { toast } from '@/components/ui/Toast';
import { debugLog } from '@/lib/utils/debugLog';

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
          backgroundColor: active ? colors.primary : colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          size={18}
          color={active ? '#FFFFFF' : colors.text}
          fill={active ? '#FFFFFF' : 'transparent'}
        />
      </View>
      <Text style={{ fontSize: 11, color: colors.text, fontWeight: '600' }}>{label}</Text>
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
    if (!locationsQ.data || locationsQ.data.length === 0) return;
    // If the previously-selected location was deleted in a refetch, drop
    // back to nearest. Also picks the nearest on first run.
    const stillExists =
      activeLocationId && locationsQ.data.some((l) => l.id === activeLocationId);
    if (stillExists) return;
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
  }, [locationsQ.data, coords, activeLocationId]);

  const activeLocation = locationsQ.data?.find((l) => l.id === activeLocationId);
  const menuQ = useMenu(activeLocationId ?? undefined);

  const [tab, setTab] = React.useState<Tab>('menu');
  // Lazy queries — reviewsQ, brandReviewsQ, photosQ only fire when the
  // user actually opens that tab (or once for the header average).
  const reviewsQ = useLocationReviews(activeLocationId ?? undefined);

  const brandReviewsQ = useQuery({
    queryKey: ['reviews.brand', brandId],
    queryFn: () => fetchReviewsForBrand(brandId),
    // Fire on mount so the header average renders, then it's cached.
    enabled: !!brandId,
  });
  const brandReviews = brandReviewsQ.data ?? [];
  const liveAverage =
    brandReviews.length === 0
      ? 0
      : brandReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / brandReviews.length;

  // Photos tab lazy — only fetch when user opens Photos.
  const photosQ = useQuery({
    queryKey: ['photos.brand', brandId],
    queryFn: () => fetchAllPhotosForBrand(brandId),
    enabled: !!brandId && tab === 'photos',
  });

  // Certs for the active location
  const certs = useQuery({
    queryKey: ['certs', activeLocationId],
    queryFn: async () => {
      if (!activeLocationId)
        return { kosher: null as KosherCert | null, halal: null as HalalCert | null };
      const [k, h] = await Promise.all([
        supabase
          .from('kosher_certifications')
          .select('*')
          .eq('location_id', activeLocationId)
          .maybeSingle(),
        Promise.resolve(
          supabase
            .from('halal_certifications')
            .select('*')
            .eq('location_id', activeLocationId)
            .maybeSingle(),
        ).catch(() => ({ data: null })),
      ]);
      return {
        kosher: (k.data ?? null) as KosherCert | null,
        halal: ((h as any).data ?? null) as HalalCert | null,
      };
    },
    enabled: !!activeLocationId,
  });

  const toggleSaved = useToggleSavedLocation();
  const setWantToTry = useSetWantToTry();
  const { savedId, wantToTry } = useSavedLocationId(activeLocationId);
  const [whatsGoodOpen, setWhatsGoodOpen] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const distance = React.useMemo(() => {
    if (!coords || activeLocation?.latitude == null || activeLocation?.longitude == null) return null;
    return distanceMiles(coords.latitude, coords.longitude, activeLocation.latitude, activeLocation.longitude);
  }, [coords, activeLocation]);

  React.useEffect(() => {
    debugLog('storefront.render', 'state', {
      brandId,
      activeLocationId,
      coords: coords ? { lat: coords.latitude, lng: coords.longitude } : null,
      distance,
      reviewCount: brandReviews.length,
      liveAverage,
    });
  }, [brandId, activeLocationId, coords, distance, brandReviews.length, liveAverage]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([
      brandQ.refetch(),
      locationsQ.refetch(),
      menuQ.refetch(),
      reviewsQ.refetch(),
      brandReviewsQ.refetch(),
      photosQ.refetch(),
    ]);
    setRefreshing(false);
  }

  if (brandQ.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ErrorState
          title="Couldn't load this spot"
          subtitle="Pull down to refresh or try again in a moment."
          onRetry={() => brandQ.refetch()}
        />
      </View>
    );
  }

  if (brandQ.isLoading || !brandQ.data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
  const photos = photosQ.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <StorefrontHeader
          brand={brand}
          averageRating={liveAverage}
          reviewCount={brandReviews.length}
          distanceMiles={distance}
        />

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
          <ArrowLeft size={18} color={colors.text} />
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
            label={savedId ? 'Saved' : 'Save'}
            active={!!savedId}
            onPress={() => {
              if (!user) {
                toast.info('Sign in to save your favorites');
                router.push('/(auth)/signin');
                return;
              }
              const wasSaved = !!savedId;
              toggleSaved.mutate(
                { locationId: activeLocationId!, currentId: savedId, wantToTry: false },
                {
                  onSuccess: () =>
                    toast.success(wasSaved ? 'Removed from saved' : 'Saved'),
                  onError: (e: any) => toast.error(e?.message ?? "Couldn't save"),
                },
              );
            }}
          />
          <ActionButton
            Icon={BookmarkPlus}
            label={wantToTry ? 'On list' : 'Want to try'}
            active={wantToTry}
            onPress={() => {
              if (!user) {
                toast.info('Sign in to save your favorites');
                router.push('/(auth)/signin');
                return;
              }
              if (savedId) {
                // Already saved — just flip the want-to-try flag in place.
                setWantToTry.mutate(
                  { id: savedId, want: !wantToTry },
                  {
                    onSuccess: () =>
                      toast.success(
                        wantToTry ? 'Removed from Want to try' : 'Added to Want to try',
                      ),
                    onError: (e: any) => toast.error(e?.message ?? 'Could not update'),
                  },
                );
              } else {
                // Not saved yet — create a new saved row marked as want-to-try.
                toggleSaved.mutate(
                  { locationId: activeLocationId!, currentId: null, wantToTry: true },
                  {
                    onSuccess: () => toast.success('Added to Want to try'),
                    onError: (e: any) => toast.error(e?.message ?? 'Could not add'),
                  },
                );
              }
            }}
          />
          <ActionButton
            Icon={Share2}
            label="Share"
            onPress={() => {
              Linking.openURL(`seeit://storefront/${brand.id}`).catch(() => {});
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

        {/* Kosher cert row — inline chips, tappable */}
        {certs.data?.kosher && activeLocationId ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
            <KosherCertChipRow cert={certs.data.kosher} locationId={activeLocationId} />
          </View>
        ) : null}
        {certs.data?.halal && activeLocationId ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <HalalBadge
              locationId={activeLocationId}
              agency={certs.data.halal.agency_other ?? certs.data.halal.agency}
            />
          </View>
        ) : null}

        {/* Temporarily closed banner */}
        {activeLocation?.is_temporarily_closed && (
          <TemporarilyClosedBanner reopeningDate={activeLocation.reopening_date} />
        )}

        {/* Story */}
        {brand.story ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22 }}>{brand.story}</Text>
          </View>
        ) : null}

        {/* What's good here */}
        <View style={{ paddingTop: 20 }}>
          <WhatsGoodHereButton onPress={() => setWhatsGoodOpen(true)} />
        </View>

        {/* Tabs with underline-on-label */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingTop: 28,
            gap: 4,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
          }}
        >
          {(['menu', 'reviews', 'photos', 'info'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                tapLight();
                setTab(t);
              }}
              style={{ paddingVertical: 12, paddingHorizontal: 12, marginBottom: -1 }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: tab === t ? colors.text : colors.textSecondary,
                    textTransform: 'capitalize',
                  }}
                >
                  {t}
                  {t === 'photos' && photos.length > 0 ? ` (${photos.length})` : ''}
                  {t === 'reviews' && brandReviews.length > 0 ? ` (${brandReviews.length})` : ''}
                </Text>
                {tab === t ? (
                  <View
                    style={{
                      height: 2,
                      backgroundColor: colors.primary,
                      marginTop: 10,
                      borderRadius: 1,
                    }}
                  />
                ) : null}
              </View>
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
            <EmptyState
              title="No menu yet"
              subtitle="This restaurant hasn't added their menu."
            />
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
            {brandReviews.length > 0 ? (
              <>
                <RatingBreakdown reviews={brandReviews} />
                {brandReviews.map((r) => (
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
          <PhotosTab photos={photos} loading={photosQ.isLoading} />
        )}

        {tab === 'info' && (
          <View style={{ padding: 20, gap: 20 }}>
            <View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.textSecondary,
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
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 8,
                  }}
                >
                  Address
                </Text>
                <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
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
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 8,
                  }}
                >
                  Phone
                </Text>
                <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>
                  {activeLocation.phone}
                </Text>
              </Pressable>
            )}
            <View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.textSecondary,
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
            <Text style={{ color: colors.textSecondary }}>
              Not enough data yet — check back as photos & reviews roll in.
            </Text>
          ) : (
            whatsGoodItems.map((item) => (
              <DishCard
                key={item.id}
                item={item as any}
                brand_name={brand.name}
                cuisine={brand.primary_cuisine}
                width={(Dimensions.get('window').width - 20 * 2 - 14) / 2}
              />
            ))
          )}
        </View>
      </BottomSheet>
    </View>
  );
}

function PhotosTab({
  photos,
  loading,
}: {
  photos: { id: string; photo_url: string; menu_item_id: string }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <View style={{ padding: 20, gap: 12 }}>
        {[0, 1].map((i) => (
          <Skeleton key={i} height={160} />
        ))}
      </View>
    );
  }
  if (photos.length === 0) {
    return (
      <View style={{ padding: 20 }}>
        <EmptyState
          title="No photos yet"
          subtitle="When customers share photos of dishes, they show up here."
        />
      </View>
    );
  }
  const width = (Dimensions.get('window').width - 16 * 2 - 8) / 2;
  return (
    <FlatList
      data={photos}
      keyExtractor={(p) => p.id}
      numColumns={2}
      contentContainerStyle={{ padding: 16, gap: 8 }}
      columnWrapperStyle={{ gap: 8 }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/restaurant/dish/${item.menu_item_id}`)}
        >
          <Image
            source={{ uri: item.photo_url }}
            style={{ width, height: width, borderRadius: 12, backgroundColor: colors.surfaceMuted }}
          />
        </Pressable>
      )}
      scrollEnabled={false}
    />
  );
}

export default function BrandStorefrontScreen() {
  const params = useLocalSearchParams<{ brandSlug: string }>();
  const { data: brand } = useBrand(String(params.brandSlug ?? ''));
  return (
    <BrandThemeProvider themeColor={brand?.theme_color}>
      <InnerScreen />
    </BrandThemeProvider>
  );
}
