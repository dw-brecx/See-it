import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useDeviceLocation } from '@/lib/hooks/useLocation';

export default function LocationPermissionScreen() {
  const insets = useSafeAreaInsets();
  const { request } = useDeviceLocation();

  async function ask() {
    await request();
    router.replace('/(public)/(tabs)/home');
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FAFAF7',
        paddingTop: insets.top + 32,
        paddingHorizontal: 24,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: '#FDF2EE',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MapPin size={48} color="#E85D3A" />
        </View>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '800',
            color: '#1A1A1A',
            textAlign: 'center',
            letterSpacing: -0.5,
          }}
        >
          Show me what's nearby
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: '#6B7280',
            textAlign: 'center',
            lineHeight: 22,
            paddingHorizontal: 8,
          }}
        >
          We use your location to find restaurants close to you. We never share your location and
          don't track you anywhere else.
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        <Button label="Enable location" fullWidth onPress={ask} />
        <Pressable
          onPress={() => router.replace('/(public)/(tabs)/home')}
          hitSlop={8}
          style={{ alignItems: 'center', paddingVertical: 8 }}
        >
          <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '600' }}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}
