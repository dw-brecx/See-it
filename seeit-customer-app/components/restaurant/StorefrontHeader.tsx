import * as React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Brand } from '@/lib/types';
import { VerifiedBadge } from '../brand/VerifiedBadge';
import { useTheme } from '../brand/ThemeProvider';
import { StarRating } from '../ui/StarRating';

export function StorefrontHeader({
  brand,
  averageRating,
  reviewCount,
  distanceLabel,
}: {
  brand: Brand;
  averageRating?: number | null;
  reviewCount?: number;
  distanceLabel?: string;
}) {
  const theme = useTheme();
  const cover = brand.cover_photo_url;
  return (
    <View>
      <View
        style={{
          height: 280,
          backgroundColor: brand.theme_color ?? '#F3F3EE',
          overflow: 'hidden',
        }}
      >
        {cover ? (
          <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} />
        ) : null}
      </View>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          marginTop: -36,
        }}
      >
        {brand.logo_url ? (
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#FFFFFF',
              borderWidth: 4,
              borderColor: '#FFFFFF',
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={{ fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.6 }}
          >
            {brand.name}
          </Text>
          {brand.is_verified ? <VerifiedBadge size="lg" /> : null}
        </View>
        {brand.tagline ? (
          <Text
            style={{
              fontSize: 15,
              color: theme.accent,
              fontStyle: 'italic',
              marginTop: 4,
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
            marginTop: 10,
            flexWrap: 'wrap',
          }}
        >
          {brand.primary_cuisine ? (
            <Text style={{ fontSize: 13, color: '#1A1A1A', fontWeight: '600' }}>
              {brand.primary_cuisine}
            </Text>
          ) : null}
          {(averageRating ?? 0) > 0 ? (
            <>
              <View style={{ width: 3, height: 3, backgroundColor: '#D1D5DB', borderRadius: 2 }} />
              <StarRating
                value={averageRating ?? 0}
                showNumber
                size={13}
                numberSuffix={` (${reviewCount ?? 0})`}
              />
            </>
          ) : null}
          {distanceLabel ? (
            <>
              <View style={{ width: 3, height: 3, backgroundColor: '#D1D5DB', borderRadius: 2 }} />
              <Text style={{ fontSize: 13, color: '#6B7280' }}>{distanceLabel}</Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}
