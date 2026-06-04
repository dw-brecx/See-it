import * as React from 'react';
import { View, ViewStyle, Pressable } from 'react-native';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  elevation?: 'none' | 'sm' | 'md';
  noPadding?: boolean;
};

export function Card({ children, style, onPress, elevation = 'sm', noPadding }: Props) {
  const shadow =
    elevation === 'none'
      ? {}
      : elevation === 'md'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        };
  const inner = {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: noPadding ? 0 : 16,
    overflow: 'hidden' as const,
  };
  const merged = [inner, shadow, ...(Array.isArray(style) ? style : [style])];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [merged, { opacity: pressed ? 0.96 : 1 }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={merged}>{children}</View>;
}
