import * as React from 'react';
import {
  View,
  Text,
  Pressable,
  Linking,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { X, Zap, ZapOff, Keyboard } from 'lucide-react-native';
import { colors } from '@/lib/utils/colors';
import { toast } from '@/components/ui/Toast';
import { success, error as errorHaptic } from '@/lib/utils/haptics';
import { debugLog } from '@/lib/utils/debugLog';

const SEEIT_PREFIXES = [
  'seeit://storefront/',
  'seeit://location/',
  'seeit://restaurant/',
  'https://seeit.app/s/',
];

function parseSeeItLink(raw: string): { kind: 'brand' | 'location' | null; id: string | null } {
  const v = raw.trim();
  if (!v) return { kind: null, id: null };
  if (v.startsWith('seeit://storefront/') || v.startsWith('seeit://restaurant/')) {
    return { kind: 'brand', id: v.split('/').filter(Boolean).pop() ?? null };
  }
  if (v.startsWith('seeit://location/')) {
    return { kind: 'location', id: v.split('/').filter(Boolean).pop() ?? null };
  }
  if (v.startsWith('https://seeit.app/s/')) {
    return { kind: 'brand', id: v.split('/').filter(Boolean).pop() ?? null };
  }
  return { kind: null, id: null };
}

/** L-shaped corner marker for the scan frame. */
function FrameCorner({ rotation }: { rotation: 0 | 90 | 180 | 270 }) {
  return (
    <View
      style={{
        position: 'absolute',
        width: 28,
        height: 28,
        transform: [{ rotate: `${rotation}deg` }],
        borderColor: colors.primary,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderTopLeftRadius: 4,
      }}
    />
  );
}

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = React.useState(false);
  const [scanned, setScanned] = React.useState(false);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualValue, setManualValue] = React.useState('');
  const [active, setActive] = React.useState(false);
  const [requested, setRequested] = React.useState(false);

  // Fire the OS permission prompt the first time the user opens Scan.
  // Without this they sit on a black screen until they go hunt down the
  // permission setting themselves.
  React.useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain && !requested) {
      setRequested(true);
      void requestPermission();
    }
  }, [permission, requested, requestPermission]);

  // Auto-pause when leaving the tab, resume on return.
  useFocusEffect(
    React.useCallback(() => {
      setActive(true);
      setScanned(false);
      return () => {
        setActive(false);
      };
    }, []),
  );

  // Pulsing frame border to communicate "we're scanning."
  const pulse = useSharedValue(0.85);
  React.useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.05, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);
  const frameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  function handleResult(value: string) {
    if (scanned) return;
    debugLog('scan.code', 'detected', { value: value.slice(0, 60) });
    const { kind, id } = parseSeeItLink(value);
    if (!kind || !id) {
      errorHaptic();
      toast.error("This isn't a SeeIt QR code");
      // Keep scanning; the user can try again immediately.
      return;
    }
    setScanned(true);
    success();
    if (kind === 'brand') {
      router.push(`/restaurant/${id}`);
    } else {
      router.push(`/restaurant/location/${id}`);
    }
  }

  // Permission states
  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }
  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0F0F10',
          paddingTop: insets.top + 24,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 22,
            fontWeight: '800',
            textAlign: 'center',
            letterSpacing: -0.4,
          }}
        >
          Camera access needed
        </Text>
        <Text
          style={{
            color: '#9CA3AF',
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          We use the camera to scan SeeIt QR codes — that's it, no recording.
        </Text>
        <Pressable
          onPress={async () => {
            const res = await requestPermission();
            if (!res.granted) Linking.openSettings();
          }}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 12,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
            Allow camera
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {active && (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => handleResult(data)}
        />
      )}

      {/* Dim overlay outside the frame */}
      <View
        pointerEvents="none"
        style={{
          ...StyleSheetAbsoluteFill,
          backgroundColor: 'rgba(0,0,0,0.45)',
        }}
      />

      {/* Top controls */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 16,
          right: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>Scan</Text>
        <Pressable
          onPress={() => router.replace('/(public)/(tabs)/home')}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Pulsing scan frame */}
      <View
        pointerEvents="none"
        style={{ ...StyleSheetAbsoluteFill, alignItems: 'center', justifyContent: 'center' }}
      >
        <Animated.View
          style={[
            {
              width: 248,
              height: 248,
              borderRadius: 24,
            },
            frameStyle,
          ]}
        >
          {/* 4 L-shaped corners */}
          <View style={{ position: 'absolute', top: 0, left: 0 }}>
            <FrameCorner rotation={0} />
          </View>
          <View style={{ position: 'absolute', top: 0, right: 0 }}>
            <FrameCorner rotation={90} />
          </View>
          <View style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <FrameCorner rotation={180} />
          </View>
          <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
            <FrameCorner rotation={270} />
          </View>
        </Animated.View>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '600',
            marginTop: 24,
            textAlign: 'center',
          }}
        >
          Point at a SeeIt QR code
        </Text>
      </View>

      {/* Bottom controls */}
      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: insets.bottom + 32,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={() => {
            setManualValue('');
            setManualOpen(true);
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Keyboard size={18} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>
            Enter code manually
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTorch((t) => !t)}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: torch ? '#FFFFFF' : 'rgba(255,255,255,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {torch ? (
            <Zap size={20} color={colors.text} />
          ) : (
            <ZapOff size={20} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {/* Manual entry modal */}
      <Modal
        visible={manualOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setManualOpen(false)}
      >
        <Pressable
          onPress={() => setManualOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
        />
        <View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            top: '40%',
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            gap: 14,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            Paste a SeeIt link
          </Text>
          <TextInput
            value={manualValue}
            onChangeText={setManualValue}
            placeholder="seeit://storefront/…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoFocus
            style={{
              backgroundColor: colors.surfaceMuted,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 14,
              color: colors.text,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <Pressable
              onPress={() => setManualOpen(false)}
              style={{ paddingVertical: 10, paddingHorizontal: 12 }}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setManualOpen(false);
                handleResult(manualValue);
              }}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Go</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
