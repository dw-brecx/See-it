import * as React from 'react';
import { View, Pressable, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Bookmark, User, ScanLine } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { tapLight } from '@/lib/utils/haptics';
import { colors } from '@/lib/utils/colors';

const TABS = [
  { name: 'home', label: 'Home', Icon: Home },
  { name: 'search', label: 'Search', Icon: Search },
  { name: 'scan', label: 'Scan', Icon: ScanLine },
  { name: 'saved', label: 'Saved', Icon: Bookmark },
  { name: 'profile', label: 'Profile', Icon: User },
] as const;

// 4 non-center tabs are visible (Home/Search/Saved/Profile). The animated
// indicator only tracks those — center Scan is a separate raised button.
const INDICATOR_TAB_ORDER: Record<string, number> = {
  home: 0,
  search: 1,
  saved: 2,
  profile: 3,
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const barHeight = 64 + insets.bottom;

  function goTo(routeName: string) {
    tapLight();
    const target = state.routes.find((r) => r.name === routeName);
    if (target) navigation.navigate(target.name as never);
  }

  const focusedRoute = state.routes[state.index]?.name;
  const focusedIdx =
    focusedRoute && focusedRoute in INDICATOR_TAB_ORDER
      ? INDICATOR_TAB_ORDER[focusedRoute]
      : -1;

  // Each non-center tab takes 1/5 of the screen width. Indicator slides
  // between the centers of those 4 cells (skipping the center).
  const cellW = screenWidth / 5;
  const indicatorW = 24;
  const cellCenterX = (slotIdx: number) => {
    // Slots 0, 1, 3, 4 (skip 2 — that's the center Scan)
    const realSlot = slotIdx < 2 ? slotIdx : slotIdx + 1;
    return realSlot * cellW + cellW / 2 - indicatorW / 2;
  };

  const translateX = useSharedValue(
    focusedIdx >= 0 ? cellCenterX(focusedIdx) : -100,
  );
  React.useEffect(() => {
    if (focusedIdx >= 0) {
      translateX.value = withSpring(cellCenterX(focusedIdx), {
        damping: 16,
        stiffness: 200,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedIdx, cellW]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: barHeight,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        paddingBottom: insets.bottom,
        paddingTop: 8,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
        elevation: 12,
      }}
    >
      {/* Sliding indicator */}
      {focusedIdx >= 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 4,
              height: 3,
              width: indicatorW,
              borderRadius: 2,
              backgroundColor: colors.primary,
            },
            indicatorStyle,
          ]}
        />
      )}

      {TABS.map((t, i) => {
        const isCenter = i === 2;
        const focused = focusedRoute === t.name;
        if (isCenter) return <View key={t.name} style={{ flex: 1 }} />;
        return (
          <Pressable
            key={t.name}
            onPress={() => goTo(t.name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={t.label}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
              gap: 3,
            })}
          >
            <t.Icon
              size={22}
              color={focused ? colors.primary : colors.textMuted}
              strokeWidth={focused ? 2.4 : 1.8}
            />
            <Text
              style={{
                fontSize: 10.5,
                color: focused ? colors.primary : colors.textMuted,
                fontWeight: focused ? '700' : '500',
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        onPress={() => goTo('scan')}
        accessibilityRole="button"
        accessibilityLabel="Scan QR code"
        style={({ pressed }) => ({
          position: 'absolute',
          alignSelf: 'center',
          top: -18,
          left: '50%',
          marginLeft: -32,
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.primary,
          shadowOpacity: 0.45,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        <ScanLine size={28} color="#FFFFFF" strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
