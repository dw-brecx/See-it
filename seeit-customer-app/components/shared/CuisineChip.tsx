import * as React from 'react';
import { View, Text } from 'react-native';
import { getCuisineColor } from '@/lib/utils/cuisineColor';

export function CuisineChip({ label }: { label: string }) {
  const { bg, fg } = getCuisineColor(label);
  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: fg, fontSize: 11.5, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}
