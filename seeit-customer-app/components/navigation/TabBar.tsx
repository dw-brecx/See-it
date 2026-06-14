import * as React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Bookmark, User, ScanLine } from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { tapLight } from '@/lib/utils/haptics';
import { colors } from '@/lib/utils/colors';

/**
 * Custom 5-tab bar. The center tab (Scan) renders as an absolute-positioned
 * floating circle that breaks out of the bar's normal row, lifted 18px above
 * so it visually pops. The 4 standard tabs sit at equal flex around it.
 *
 * Layout math:
 *   - barHeight = 64 + safeAreaBottom
 *   - 5 children, each with flex 1
 *   - the 3rd cell is intentionally empty in the row — the floating
 *     button is rendered separately in an overlay
 *   - safeAreaBottom adds padding so labels never sit on the home indicator
 */

const TABS = [
  { name: 'home', label: 'Home', Icon: Home },
  { name: 'search', label: 'Search', Icon: Search },
  { name: 'scan', label: 'Scan', Icon: ScanLine }, // index 2 — gets the floating button
  { name: 'saved', label: 'Saved', Icon: Bookmark },
  { name: 'profile', label: 'Profile', Icon: User },
] as const;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const barHeight = 64 + insets.bottom;

  function goTo(routeName: string) {
    tapLight();
    const target = state.routes.find((r) => r.name === routeName);
    if (target) navigation.navigate(target.name as never);
  }

  const focusedRoute = state.routes[state.index]?.name;

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
      {TABS.map((t, i) => {
        const isCenter = i === 2;
        const focused = focusedRoute === t.name;
        if (isCenter) {
          return <View key={t.name} style={{ flex: 1 }} />;
        }
        return (
          <Pressable
            key={t.name}
            onPress={() => goTo(t.name)}
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

      {/* Floating center Scan button — absolute-positioned, breaks the row */}
      <Pressable
        onPress={() => goTo('scan')}
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
