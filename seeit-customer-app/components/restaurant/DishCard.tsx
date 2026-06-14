import * as React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StarRating } from '../ui/StarRating';
import { PhotoPlaceholder } from '../shared/PhotoPlaceholder';
import { MenuItem, MenuItemPhoto } from '@/lib/types';
import { formatPrice } from '@/lib/utils/formatPrice';
import { tapLight } from '@/lib/utils/haptics';
import { colors } from '@/lib/utils/colors';

type Props = {
  item: MenuItem & { photos?: MenuItemPhoto[]; cover_photo_url?: string | null };
  brand_name?: string;
  cuisine?: string | null;
  width?: number;
};

export function DishCard({ item, brand_name, cuisine, width = 168 }: Props) {
  const cover =
    item.cover_photo_url ??
    item.photos?.find((p) => p.is_featured)?.photo_url ??
    item.photos?.[0]?.photo_url ??
    null;
  return (
    <Pressable
      onPress={() => {
        tapLight();
        router.push(`/restaurant/dish/${item.id}`);
      }}
      style={({ pressed }) => ({
        width,
        opacity: pressed ? 0.97 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        style={{
          width,
          aspectRatio: 1,
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: 8,
          backgroundColor: colors.surfaceMuted,
        }}
      >
        {cover ? (
          <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <PhotoPlaceholder cuisine={cuisine} rounded={14} />
        )}
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
          letterSpacing: -0.2,
        }}
        numberOfLines={1}
      >
        {item.name}
      </Text>
      {brand_name && (
        <Text
          style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}
          numberOfLines={1}
        >
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
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
          {formatPrice(item.price)}
        </Text>
        {(item.review_count ?? 0) > 0 && (
          <StarRating value={item.average_rating ?? 0} size={11} showNumber />
        )}
      </View>
    </Pressable>
  );
}
