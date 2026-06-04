import * as React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StarRating } from '../ui/StarRating';
import { MenuItem, MenuItemPhoto } from '@/lib/types';
import { formatPrice } from '@/lib/utils/formatPrice';
import { tapLight } from '@/lib/utils/haptics';

type Props = {
  item: MenuItem & { photos?: MenuItemPhoto[] };
  brand_name?: string;
  width?: number;
};

export function DishCard({ item, brand_name, width = 168 }: Props) {
  const cover =
    item.photos?.find((p) => p.is_featured)?.photo_url ?? item.photos?.[0]?.photo_url ?? null;
  return (
    <Pressable
      onPress={() => {
        tapLight();
        router.push(`/restaurant/dish/${item.id}`);
      }}
      style={({ pressed }) => ({
        width,
        opacity: pressed ? 0.95 : 1,
      })}
    >
      <View
        style={{
          width,
          aspectRatio: 1,
          borderRadius: 14,
          backgroundColor: '#F3F3EE',
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        {cover && <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} />}
      </View>
      <Text
        style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.2 }}
        numberOfLines={1}
      >
        {item.name}
      </Text>
      {brand_name && (
        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }} numberOfLines={1}>
          {brand_name}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1A1A' }}>
          {formatPrice(item.price)}
        </Text>
        {(item.review_count ?? 0) > 0 && (
          <StarRating value={item.average_rating ?? 0} size={11} showNumber />
        )}
      </View>
    </Pressable>
  );
}
