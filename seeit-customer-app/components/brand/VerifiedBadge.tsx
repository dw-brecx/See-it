import * as React from 'react';
import { View, Text } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors } from '@/lib/utils/colors';

type Size = 'sm' | 'md' | 'lg';

/**
 * SeeIt's verified pill. Renders inline next to a brand name iff
 * `brands.is_verified === true`. The bare blue dot was illegible —
 * this is an explicit "Verified" word + checkmark, so users actually
 * understand what it means at a glance.
 *
 * Variants:
 *   icon  — checkmark only, for tight spaces (search cards, inline)
 *   pill  — checkmark + "Verified" label, for headers and detail views
 */
export function VerifiedBadge({
  size = 'md',
  variant = 'icon',
}: {
  size?: Size;
  variant?: 'icon' | 'pill';
}) {
  const scale = useSharedValue(0.6);
  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 220 });
  }, [scale]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconPx = size === 'sm' ? 13 : size === 'lg' ? 18 : 15;
  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 13 : 12;
  const padX = size === 'sm' ? 6 : 8;
  const padY = size === 'sm' ? 3 : 4;

  if (variant === 'pill') {
    return (
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: colors.verifiedBlue,
            paddingHorizontal: padX,
            paddingVertical: padY,
            borderRadius: 10,
          },
          animatedStyle,
        ]}
        accessibilityLabel="Verified store"
      >
        <BadgeCheck size={iconPx} color="#FFFFFF" strokeWidth={2.5} />
        <Text
          style={{
            color: '#FFFFFF',
            fontSize,
            fontWeight: '700',
            letterSpacing: 0.2,
          }}
        >
          Verified
        </Text>
      </Animated.View>
    );
  }

  const iconOnly = size === 'sm' ? 14 : size === 'lg' ? 22 : 17;
  return (
    <Animated.View
      style={[
        { width: iconOnly, height: iconOnly, alignItems: 'center', justifyContent: 'center' },
        animatedStyle,
      ]}
      accessibilityLabel="Verified store"
    >
      <BadgeCheck
        size={iconOnly}
        color={colors.verifiedBlue}
        fill={colors.verifiedBlue}
        strokeWidth={2}
      />
    </Animated.View>
  );
}
