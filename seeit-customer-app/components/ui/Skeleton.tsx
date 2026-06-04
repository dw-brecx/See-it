import * as React from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function Skeleton({
  width,
  height,
  borderRadius = 12,
  style,
}: {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const opacity = useSharedValue(0.5);
  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        {
          width: (width as any) ?? '100%',
          height,
          borderRadius,
          backgroundColor: '#EAEAE4',
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
