import * as React from 'react';
import { View, Text, Image } from 'react-native';
import { Brand } from '@/lib/types';
import { VerifiedBadge } from '../brand/VerifiedBadge';
import { CuisineChip } from '../shared/CuisineChip';
import { DistanceChip } from '../shared/DistanceChip';
import { StarRating } from '../ui/StarRating';
import { PhotoPlaceholder } from '../shared/PhotoPlaceholder';
import { colors } from '@/lib/utils/colors';
import { pluralize } from '@/lib/utils/pluralize';

export function StorefrontHeader({
  brand,
  averageRating,
  reviewCount,
  distanceMiles,
}: {
  brand: Brand;
  averageRating?: number | null;
  reviewCount?: number;
  distanceMiles?: number | null;
}) {
  const cover = brand.cover_photo_url;
  return (
    <View>
      <View
        style={{
          height: 280,
          backgroundColor: brand.theme_color ?? colors.surfaceMuted,
          overflow: 'hidden',
        }}
      >
        {cover ? (
          <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <PhotoPlaceholder cuisine={brand.primary_cuisine} rounded={0} />
        )}
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, marginTop: -36 }}>
        {brand.logo_url ? (
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.surface,
              borderWidth: 4,
              borderColor: colors.surface,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
              marginBottom: 12,
            }}
          >
            <Image source={{ uri: brand.logo_url }} style={{ width: '100%', height: '100%' }} />
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: colors.text,
              letterSpacing: -0.6,
            }}
          >
            {brand.name}
          </Text>
          {brand.is_verified ? <VerifiedBadge variant="pill" size="md" /> : null}
        </View>

        {brand.tagline ? (
          <Text
            style={{
              fontSize: 16,
              color: colors.textSecondary,
              fontStyle: 'italic',
              marginTop: 6,
              fontWeight: '400',
              lineHeight: 22,
            }}
          >
            {brand.tagline}
          </Text>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
            flexWrap: 'wrap',
          }}
        >
          {brand.primary_cuisine ? <CuisineChip label={brand.primary_cuisine} /> : null}
          {distanceMiles != null ? <DistanceChip miles={distanceMiles} /> : null}
        </View>

        {(reviewCount ?? 0) > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
            }}
          >
            <StarRating value={averageRating ?? 0} size={14} showNumber />
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
              ({pluralize(reviewCount ?? 0, 'review')})
            </Text>
          </View>
        ) : (
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 13,
              fontWeight: '600',
              marginTop: 10,
            }}
          >
            No reviews yet
          </Text>
        )}
      </View>
    </View>
  );
}
