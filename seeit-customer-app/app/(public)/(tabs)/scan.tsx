import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScanLine, X } from 'lucide-react-native';
import { router } from 'expo-router';

/**
 * Camera-based QR scanner. expo-camera is configured in app.json. The full
 * scan flow (CameraView with onBarcodeScanned + scanner overlay) is wired up
 * for v2 — for v1 we render a friendly placeholder so the tab is usable.
 */
export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F10' }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>Scan</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <View
          style={{
            width: 240,
            height: 240,
            borderRadius: 24,
            borderWidth: 3,
            borderColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ScanLine size={48} color="#FFFFFF" />
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 24, textAlign: 'center' }}>
          Point at a SeeIt QR code
        </Text>
        <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 6, textAlign: 'center' }}>
          Scan a code at the table to jump to a restaurant's menu instantly.
        </Text>
      </View>
    </View>
  );
}
