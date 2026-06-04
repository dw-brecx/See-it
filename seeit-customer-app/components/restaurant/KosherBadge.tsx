import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { tapLight } from '@/lib/utils/haptics';

export function KosherBadge({ locationId, agency }: { locationId: string; agency?: string }) {
  return (
    <Pressable
      onPress={() => {
        tapLight();
        router.push(`/kosher-sheet/${locationId}`);
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#EFF6FF',
        borderRadius: 999,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#3B82F6',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ShieldCheck size={14} color="#FFFFFF" />
      </View>
      <Text style={{ fontWeight: '700', color: '#1D4ED8' }}>Kosher</Text>
      {agency ? <Text style={{ fontSize: 12, color: '#1D4ED8' }}>· {agency}</Text> : null}
    </Pressable>
  );
}
