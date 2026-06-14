import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BookmarkPlus, Plus, Heart, PenSquare } from 'lucide-react-native';
import { PhotoCarousel } from '@/components/shared/PhotoCarousel';
import { Skeleton } from '@/components/ui/Skeleton';
import { StarRating } from '@/components/ui/StarRating';
import { DietaryTagChips } from '@/components/shared/DietaryTagChips';
import { AllergyWarningBanner } from '@/components/restaurant/AllergyWarningBanner';
import { ReviewCard } from '@/components/review/ReviewCard';
import { Button } from '@/components/ui/Button';
import { useMenuItem } from '@/lib/hooks/useMenu';
import { useMenuItemReviews } from '@/lib/hooks/useReviews';
import { useAllergyWarnings } from '@/lib/hooks/useAllergyWarnings';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils/formatPrice';
import { tapMedium, success } from '@/lib/utils/haptics';

export default function DishDetailScreen() {
  const params = useLocalSearchParams<{ menuItemId: string }>();
  const menuItemId = String(params.menuItemId ?? '');
  const insets = useSafeAreaInsets();
  const itemQ = useMenuItem(menuItemId);
  const reviewsQ = useMenuItemReviews(menuItemId);
  const warningsFor = useAllergyWarnings();
  const { user } = useAuth();
  const setOrderLocation = useAppStore((s) => s.setOrderLocation);
  const addOrderItem = useAppStore((s) => s.addOrderItem);

  if (itemQ.isLoading || !itemQ.data) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <Skeleton height={360} borderRadius={0} />
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton height={28} width={220} />
          <Skeleton height={14} width={140} />
        </View>
      </View>
    );
  }

  const item = itemQ.data;
  const warnings = warningsFor(item.dietary_tags);

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <PhotoCarousel
          photos={(item.photos ?? []).map((p) => ({ id: p.id, photo_url: p.photo_url }))}
          aspectRatio={1}
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
          <ArrowLeft size={18} color="#1A1A1A" />
        </Pressable>

        <View style={{ padding: 20, gap: 12 }}>
          <Text
            style={{ fontSize: 26, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 }}
          >
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1A1A' }}>
              {formatPrice(item.price)}
            </Text>
            {(item.review_count ?? 0) > 0 && (
              <StarRating
                value={item.average_rating ?? 0}
                showNumber
                size={14}
                numberSuffix={` (${item.review_count})`}
              />
            )}
          </View>
          <Pressable onPress={() => router.push(`/restaurant/${item.brand_id}`)}>
            <Text style={{ fontSize: 14, color: '#E85D3A', fontWeight: '600' }}>
              From {item.brand_name}
            </Text>
          </Pressable>

          {warnings.length > 0 && <AllergyWarningBanner allergies={warnings} />}

          {item.description ? (
            <Text style={{ fontSize: 15, color: '#1A1A1A', lineHeight: 22, marginTop: 4 }}>
              {item.description}
            </Text>
          ) : null}

          <DietaryTagChips tags={item.dietary_tags} max={6} />

          <View style={{ marginTop: 12 }}>
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
              Reviews
            </Text>
            <View style={{ gap: 14 }}>
              {reviewsQ.data && reviewsQ.data.length > 0 ? (
                reviewsQ.data.map((r) => <ReviewCard key={r.id} review={r} />)
              ) : (
                <Text style={{ fontSize: 13, color: '#6B7280' }}>
                  No reviews on this dish yet. Be the first to share.
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom action bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: 'rgba(250, 250, 247, 0.96)',
          borderTopWidth: 1,
          borderTopColor: '#F3F3EE',
          flexDirection: 'row',
          gap: 10,
        }}
      >
        <Pressable
          onPress={() => {
            if (!user) router.push('/(auth)/signin');
          }}
          hitSlop={6}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: '#F3F3EE',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart size={20} color="#1A1A1A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button
            label="Add to order list"
            fullWidth
            leadingIcon={<Plus size={18} color="#FFFFFF" />}
            onPress={() => {
              tapMedium();
              if (item.location_id) setOrderLocation(item.location_id);
              addOrderItem(item.id);
              success();
            }}
          />
        </View>
        <Pressable
          onPress={() => {
            if (!user) {
              router.push('/(auth)/signin');
              return;
            }
            router.push({
              pathname: '/(auth)/write-review',
              params: { locationId: item.location_id, menuItemId: item.id },
            });
          }}
          hitSlop={6}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: '#F3F3EE',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PenSquare size={20} color="#1A1A1A" />
        </Pressable>
      </View>
    </View>
  );
}
