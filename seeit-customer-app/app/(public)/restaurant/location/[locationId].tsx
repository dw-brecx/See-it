import * as React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchLocationDetail } from '@/lib/api/locations';
import { View, Text } from 'react-native';

/**
 * Direct-link route — resolves the location's brand and redirects to the
 * brand storefront (which picks up the location via the multi-location
 * picker). Keeps deep links like seeit://restaurant/location/<uuid> working.
 */
export default function LocationDirectPage() {
  const params = useLocalSearchParams<{ locationId: string }>();
  const locationId = String(params.locationId ?? '');
  const { data, isLoading } = useQuery({
    queryKey: ['loc-detail', locationId],
    queryFn: () => fetchLocationDetail(locationId),
    enabled: !!locationId,
  });

  if (isLoading) return <View style={{ flex: 1, backgroundColor: '#FAFAF7' }} />;
  if (!data) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, color: '#6B7280' }}>This location isn't available.</Text>
      </View>
    );
  }
  return <Redirect href={`/restaurant/${data.brand.id}`} />;
}
