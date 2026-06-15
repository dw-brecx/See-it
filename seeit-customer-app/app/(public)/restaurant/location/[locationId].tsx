import * as React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { View, Text } from 'react-native';
import { fetchLocationDetail } from '@/lib/api/locations';
import { colors } from '@/lib/utils/colors';

/**
 * Deep-link alias: `seeit://location/<uuid>` → resolve brand + redirect
 * to the storefront with the location pre-selected via query param.
 * The storefront accepts `?location=<id>` and uses it as the initial
 * activeLocationId.
 */
export default function LocationDirectPage() {
  const params = useLocalSearchParams<{ locationId: string }>();
  const locationId = String(params.locationId ?? '');
  const { data, isLoading } = useQuery({
    queryKey: ['loc-detail', locationId],
    queryFn: () => fetchLocationDetail(locationId),
    enabled: !!locationId,
  });

  if (isLoading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!data) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 16, color: colors.textSecondary }}>
          This location isn't available.
        </Text>
      </View>
    );
  }
  return (
    <Redirect href={`/restaurant/${data.brand.id}?location=${locationId}` as any} />
  );
}
