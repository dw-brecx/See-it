import * as React from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

export function AllergyWarningBanner({ allergies }: { allergies: string[] }) {
  if (allergies.length === 0) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 14,
        padding: 14,
      }}
    >
      <AlertTriangle size={20} color="#B91C1C" />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#B91C1C', fontWeight: '700', fontSize: 13 }}>
          Heads up — your allergies
        </Text>
        <Text style={{ color: '#7F1D1D', fontSize: 12.5, marginTop: 2 }}>
          This dish may contain {allergies.join(', ')}. Ask the restaurant before ordering.
        </Text>
      </View>
    </View>
  );
}
