import * as React from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { colors } from '@/lib/utils/colors';
import { formatDistance } from '@/lib/utils/formatDistance';

export function DistanceChip({ miles }: { miles: number | null | undefined }) {
  if (miles == null) return null;
  const label = miles < 0.05 ? 'Right here' : formatDistance(miles);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        alignSelf: 'flex-start',
      }}
    >
      <MapPin size={11} color="#1D4ED8" strokeWidth={2.4} />
      <Text style={{ color: '#1D4ED8', fontSize: 11.5, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}
