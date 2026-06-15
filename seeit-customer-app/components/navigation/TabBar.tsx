import * as React from 'react';
import { View, Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';
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
  { name: 'scan', label: 'Scan', Icon: ScanLine }, // Index 2 — center.
  { name: 'saved', label: 'Saved', Icon: Bookmark },
  { name: 'profile', label: 'Profile', Icon: User },
] as const;

const INDICATOR_TAB_ORDER: Record<string, number> = {
  home: 0,
  search: 1,
  saved: 2,
  profile: 3,
};

const C = {
  surface: '#FFFFFF',
  primary: '#E85D3A',
  textMuted: '#9CA3AF',
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.surface,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -2 },
    elevation: 12,
  },
  tabCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  tabCellInner: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.2,
  },
  labelActive: { color: C.primary },
  scanWrap: {
    position: 'absolute',
    top: -20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  scanLabel: {
    position: 'absolute',
    fontSize: 10.5,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.2,
  },
});

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const barHeight = 70 + insets.bottom;
  const cellWidth = screenWidth / 5;

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

  // Indicator slides between 4 non-center tabs (skipping cell index 2).
  const indicatorW = 24;
  const cellCenterX = (slotIdx: number) => {
    const realSlot = slotIdx < 2 ? slotIdx : slotIdx + 1;
    return realSlot * cellWidth + cellWidth / 2 - indicatorW / 2;
  };
  const translateX = useSharedValue(
    focusedIdx >= 0 ? cellCenterX(focusedIdx) : -100,
  );
  React.useEffect(() => {
    if (focusedIdx >= 0) {
      translateX.value = withSpring(cellCenterX(focusedIdx), {
        damping: 18,
        stiffness: 220,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedIdx, cellWidth]);
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        styles.bar,
        { height: barHeight, paddingBottom: insets.bottom > 0 ? insets.bottom : 6 },
      ]}
    >
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
              backgroundColor: C.primary,
            },
            indicatorStyle,
          ]}
        />
      )}

      {TABS.map((t, i) => {
        const isCenter = i === 2;
        const focused = focusedRoute === t.name;

        if (isCenter) {
          return (
            <View key={t.name} style={{ width: cellWidth, alignItems: 'center' }}>
              <Pressable
                onPress={() => goTo('scan')}
                accessibilityRole="button"
                accessibilityLabel="Scan QR code"
                style={({ pressed }) => [
                  styles.scanWrap,
                  pressed && { opacity: 0.92, transform: [{ scale: 0.96 }] },
                ]}
              >
                <ScanLine size={28} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          );
        }

        return (
          <Pressable
            key={t.name}
            onPress={() => goTo(t.name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={t.label}
            style={({ pressed }) => [
              styles.tabCell,
              { width: cellWidth, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.tabCellInner}>
              <t.Icon
                size={24}
                color={focused ? C.primary : C.textMuted}
                strokeWidth={focused ? 2.4 : 1.8}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>
                {t.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
