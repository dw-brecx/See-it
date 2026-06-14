import * as React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { colors } from '@/lib/utils/colors';
import { PhotoPlaceholder } from '@/components/shared/PhotoPlaceholder';
import { StarRating } from '@/components/ui/StarRating';
import { CuisineChip } from '@/components/shared/CuisineChip';
import { tapLight } from '@/lib/utils/haptics';
import { formatPrice } from '@/lib/utils/formatPrice';

type Props = {
  savedId: string;
  itemType: 'location' | 'menu_item';
  locationId: string | null;
  menuItemId: string | null;
  notes: string | null;
  wantToTry: boolean;
  onRemove: () => void;
};

/**
 * One card on the Saved tab. Hydrates the location or menu_item lazily
 * via its own useQuery so the list can render hundreds of saves without
 * blocking the parent screen on a giant joined query.
 */
export function SavedItemCard(props: Props) {
  if (props.itemType === 'location') {
    return <SavedLocationCard {...props} />;
  }
  return <SavedDishCard {...props} />;
}

function SavedLocationCard({ savedId, locationId, wantToTry, onRemove }: Props) {
  const { data } = useQuery({
    queryKey: ['saved.location.hydrate', locationId],
    queryFn: async () => {
      if (!locationId) return null;
      const { data } = await supabase
        .from('locations')
        .select(
          'id, name, address, city, state, cover_photo_url, average_rating, review_count, brand:brands(id, name, primary_cuisine, logo_url, is_verified)',
        )
        .eq('id', locationId)
        .maybeSingle();
      return data as any;
    },
    enabled: !!locationId,
  });

  return (
    <Pressable
      onPress={() => {
        if (!data?.brand?.id) return;
        tapLight();
        router.push(`/restaurant/${data.brand.id}`);
      }}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        opacity: pressed ? 0.97 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
      accessibilityRole="button"
      accessibilityLabel={
        data ? `Open ${data.brand?.name ?? data.name}` : 'Saved location, loading'
      }
    >
      <View style={{ flexDirection: 'row', gap: 12, padding: 12 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: colors.surfaceMuted,
          }}
        >
          {data?.cover_photo_url ? (
            <Image
              source={{ uri: data.cover_photo_url }}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <PhotoPlaceholder
              cuisine={data?.brand?.primary_cuisine}
              rounded={12}
            />
          )}
        </View>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: colors.text,
                letterSpacing: -0.2,
              }}
            >
              {data?.brand?.name ?? '…'}
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 2 }}
            >
              {data?.name}
              {data?.city ? ` · ${data.city}` : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {data?.brand?.primary_cuisine ? (
              <CuisineChip label={data.brand.primary_cuisine} />
            ) : null}
            {(data?.review_count ?? 0) > 0 ? (
              <StarRating value={data.average_rating ?? 0} size={11} showNumber />
            ) : null}
            {wantToTry ? (
              <View
                style={{
                  backgroundColor: colors.primarySoft,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{ color: colors.primaryDark, fontSize: 10, fontWeight: '700' }}
                >
                  WANT TO TRY
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Remove from saved"
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-start',
          }}
        >
          <Trash2 size={14} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function SavedDishCard({ savedId, menuItemId, wantToTry, onRemove }: Props) {
  const { data } = useQuery({
    queryKey: ['saved.dish.hydrate', menuItemId],
    queryFn: async () => {
      if (!menuItemId) return null;
      const { data } = await supabase
        .from('menu_items')
        .select(
          'id, name, description, price, dietary_tags, average_rating, review_count, photos:menu_item_photos(photo_url, is_featured), location:locations(brand:brands(id, name, primary_cuisine))',
        )
        .eq('id', menuItemId)
        .maybeSingle();
      return data as any;
    },
    enabled: !!menuItemId,
  });

  const cover =
    data?.photos?.find((p: any) => p.is_featured)?.photo_url ??
    data?.photos?.[0]?.photo_url ??
    null;

  return (
    <Pressable
      onPress={() => {
        if (!menuItemId) return;
        tapLight();
        router.push(`/restaurant/dish/${menuItemId}`);
      }}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        opacity: pressed ? 0.97 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
      accessibilityRole="button"
      accessibilityLabel={data ? `Open ${data.name}` : 'Saved dish, loading'}
    >
      <View style={{ flexDirection: 'row', gap: 12, padding: 12 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: colors.surfaceMuted,
          }}
        >
          {cover ? (
            <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <PhotoPlaceholder
              cuisine={data?.location?.brand?.primary_cuisine}
              rounded={12}
            />
          )}
        </View>
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: colors.text,
                letterSpacing: -0.2,
              }}
            >
              {data?.name ?? '…'}
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 2 }}
            >
              {data?.location?.brand?.name ?? ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: 13 }}>
              {formatPrice(data?.price)}
            </Text>
            {(data?.review_count ?? 0) > 0 ? (
              <StarRating value={data.average_rating ?? 0} size={11} showNumber />
            ) : null}
            {wantToTry ? (
              <View
                style={{
                  backgroundColor: colors.primarySoft,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{ color: colors.primaryDark, fontSize: 10, fontWeight: '700' }}
                >
                  WANT TO TRY
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Remove from saved"
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-start',
          }}
        >
          <Trash2 size={14} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Pressable>
  );
}
