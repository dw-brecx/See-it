import * as React from 'react';
import { View } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, number> = { sm: 14, md: 18, lg: 24 };

/**
 * SeeIt's blue check — Twitter-style filled icon with a subtle pop on mount.
 * Rendered next to a brand name iff `brands.is_verified === true`.
 */
export function VerifiedBadge({ size = 'md' }: { size?: Size }) {
  const scale = useSharedValue(0.6);
  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 220 });
  }, [scale]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const px = SIZES[size];
  return (
    <Animated.View style={animatedStyle}>
      <View
        style={{
          width: px,
          height: px,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityLabel="Verified store"
      >
        <BadgeCheck size={px} color="#3B82F6" fill="#3B82F6" strokeWidth={2} />
        {/* Inner white tick is drawn by the icon's path mask via `color` (stroke)
            over `fill`. Lucide's BadgeCheck renders both already. */}
      </View>
    </Animated.View>
  );
}
