import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { create } from 'zustand';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import { colors } from '@/lib/utils/colors';

type ToastKind = 'success' | 'error' | 'info';
type ToastState = {
  open: boolean;
  message: string;
  kind: ToastKind;
  show: (message: string, kind?: ToastKind) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  open: false,
  message: '',
  kind: 'info',
  show: (message, kind = 'info') => set({ open: true, message, kind }),
  hide: () => set({ open: false }),
}));

export const toast = {
  success: (m: string) => useToastStore.getState().show(m, 'success'),
  error: (m: string) => useToastStore.getState().show(m, 'error'),
  info: (m: string) => useToastStore.getState().show(m, 'info'),
};

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const { open, message, kind, hide } = useToastStore();
  const translateY = useSharedValue(-120);

  React.useEffect(() => {
    if (open) {
      translateY.value = withTiming(0, { duration: 260 });
      const t = setTimeout(() => {
        translateY.value = withTiming(-120, { duration: 220 }, (finished) => {
          if (finished) runOnJS(hide)();
        });
      }, 3200);
      return () => clearTimeout(t);
    } else {
      translateY.value = withTiming(-120, { duration: 220 });
    }
  }, [open, hide, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!open) return null;

  const tint =
    kind === 'success' ? colors.success : kind === 'error' ? colors.danger : colors.text;
  const Icon = kind === 'success' ? CheckCircle2 : kind === 'error' ? AlertCircle : Info;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          top: insets.top + 8,
          left: 16,
          right: 16,
          zIndex: 9999,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
          borderLeftWidth: 3,
          borderLeftColor: tint,
        }}
      >
        <Icon size={18} color={tint} />
        <Text
          style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' }}
          numberOfLines={2}
        >
          {message}
        </Text>
        <Pressable onPress={hide} hitSlop={8}>
          <X size={16} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
