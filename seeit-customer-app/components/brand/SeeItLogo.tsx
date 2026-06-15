import * as React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/lib/utils/colors';

/**
 * SeeIt wordmark — terracotta block "S" with the rest of the name in
 * charcoal. Used as the home-screen logo so users see the brand the moment
 * they open the app. Inline SVG-free so it scales correctly across all
 * Android densities and renders identically on every iPhone.
 */
export function SeeItLogo({ size = 22 }: { size?: number }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center' }}
      accessibilityRole="header"
      accessibilityLabel="SeeIt"
    >
      <View
        style={{
          width: size + 6,
          height: size + 6,
          borderRadius: 8,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 6,
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontWeight: '900',
            fontSize: size - 2,
            letterSpacing: -0.5,
          }}
        >
          S
        </Text>
      </View>
      <Text
        style={{
          fontSize: size,
          fontWeight: '900',
          color: colors.text,
          letterSpacing: -0.8,
        }}
      >
        See
        <Text style={{ color: colors.primary }}>It</Text>
      </Text>
    </View>
  );
}
