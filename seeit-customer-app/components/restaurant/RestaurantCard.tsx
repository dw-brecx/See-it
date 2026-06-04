import * as React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { StarRating } from '../ui/StarRating';
import { VerifiedBadge } from '../brand/VerifiedBadge';
import { Brand, Location } from '@/lib/types';
import { formatDistance } from '@/lib/utils/formatDistance';
import { tapLight } from '@/lib/utils/haptics';

type Props = {
  brand: Brand;
  nearest?: Location | null;
  distance_miles?: number | null;
  width?: number;
};

export function RestaurantCard({ brand, nearest, distance_miles, width = 280 }: Props) {
  const cover = brand.cover_photo_url ?? nearest?.cover_photo_url ?? null;
  return (
    <Pressable
      onPress={() => {
        tapLight();
        router.push(`/restaurant/${brand.id}`);
      }}
      style={({ pressed }) => ({
        width,
        opacity: pressed ? 0.95 : 1,
      })}
    >
      <View
        style={{
          width,
          aspectRatio: 16 / 10,
          borderRadius: 16,
          backgroundColor: brand.theme_color ?? '#F3F3EE',
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        {cover && <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} />}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#1A1A1A',
            flexShrink: 1,
            letterSpacing: -0.2,
          }}
          numberOfLines={1}
        >
          {brand.name}
        </Text>
        {brand.is_verified ? <VerifiedBadge size="sm" /> : null}
      </View>
      <Text style={{ fontSize: 12.5, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
        {[brand.primary_cuisine, formatDistance(distance_miles ?? null)]
          .filter(Boolean)
          .join('  ·  ')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
        <StarRating
          value={nearest?.average_rating ?? 0}
          showNumber
          size={12}
          numberSuffix={` (${nearest?.review_count ?? 0})`}
        />
      </View>
    </Pressable>
  );
}
