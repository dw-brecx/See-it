import * as React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function TemporarilyClosedBanner({ reopeningDate }: { reopeningDate?: string | null }) {
  const reopen = formatDate(reopeningDate);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginTop: 16,
      }}
    >
      <AlertCircle size={20} color="#B91C1C" />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#B91C1C', fontWeight: '700', fontSize: 14 }}>
          Temporarily closed
        </Text>
        <Text style={{ color: '#7F1D1D', fontSize: 13, marginTop: 2, lineHeight: 18 }}>
          {reopen ? `Reopens on ${reopen}.` : 'Check back soon for updates.'}
        </Text>
      </View>
    </View>
  );
}
