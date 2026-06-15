import * as React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { StarRating } from '../ui/StarRating';
import { VerifiedBadge } from '../brand/VerifiedBadge';
import { CuisineChip } from '../shared/CuisineChip';
import { DistanceChip } from '../shared/DistanceChip';
import { PhotoPlaceholder } from '../shared/PhotoPlaceholder';
import { Brand, Location } from '@/lib/types';
import { tapLight } from '@/lib/utils/haptics';
import { colors } from '@/lib/utils/colors';
import { pluralize } from '@/lib/utils/pluralize';
import { useBrandRating } from '@/lib/hooks/useBrandRating';

type Props = {
  brand: Brand;
  nearest?: Location | null;
  distance_miles?: number | null;
  width?: number;
};

export function RestaurantCard({ brand, nearest, distance_miles, width = 280 }: Props) {
  const cover = brand.cover_photo_url ?? nearest?.cover_photo_url ?? null;
  // Live rating — bypasses the stale locations.average_rating /
  // review_count fields that never get updated.
  const { data: rating } = useBrandRating(brand.id);
  const ratingValue = rating?.rating ?? 0;
  const reviewCount = rating?.count ?? 0;
  return (
    <Pressable
      onPress={() => {
        tapLight();
        router.push(`/restaurant/${brand.id}`);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Open ${brand.name}`}
      style={({ pressed }) => ({
        width,
        opacity: pressed ? 0.97 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        style={{
          width,
          aspectRatio: 16 / 10,
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 10,
          backgroundColor: colors.surfaceMuted,
        }}
      >
        {cover ? (
          <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <PhotoPlaceholder cuisine={brand.primary_cuisine} rounded={16} />
        )}
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
            flexShrink: 1,
            letterSpacing: -0.2,
          }}
          numberOfLines={1}
        >
          {brand.name}
        </Text>
        {brand.is_verified ? <VerifiedBadge variant="pill" size="sm" /> : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {brand.primary_cuisine ? <CuisineChip label={brand.primary_cuisine} /> : null}
        {distance_miles != null ? <DistanceChip miles={distance_miles} /> : null}
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}
      >
        {reviewCount > 0 ? (
          <StarRating
            value={ratingValue}
            showNumber
            size={12}
            numberSuffix={` · ${pluralize(reviewCount, 'review')}`}
          />
        ) : (
          <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600' }}>
            New — no reviews yet
          </Text>
        )}
      </View>
    </Pressable>
  );
}
