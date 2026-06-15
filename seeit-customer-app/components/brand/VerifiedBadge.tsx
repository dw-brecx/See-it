import * as React from 'react';
import { View, Text } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';
import { colors } from '@/lib/utils/colors';

type Size = 'sm' | 'md' | 'lg';

/**
 * SeeIt verified pill. No mount animation — the spring "jump" the user
 * saw on every render of the home feed was distracting. Static now.
 */
export function VerifiedBadge({
  size = 'md',
  variant = 'icon',
}: {
  size?: Size;
  variant?: 'icon' | 'pill';
}) {
  const iconPx = size === 'sm' ? 13 : size === 'lg' ? 18 : 15;
  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 13 : 12;
  const padX = size === 'sm' ? 6 : 8;
  const padY = size === 'sm' ? 3 : 4;

  if (variant === 'pill') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: colors.verifiedBlue,
          paddingHorizontal: padX,
          paddingVertical: padY,
          borderRadius: 999,
        }}
        accessibilityLabel="Verified store"
      >
        <BadgeCheck size={iconPx} color="#FFFFFF" strokeWidth={2.5} />
        <Text
          style={{
            color: '#FFFFFF',
            fontSize,
            fontWeight: '800',
            letterSpacing: 0.2,
          }}
        >
          Verified
        </Text>
      </View>
    );
  }

  const iconOnly = size === 'sm' ? 14 : size === 'lg' ? 22 : 17;
  return (
    <View
      style={{
        width: iconOnly,
        height: iconOnly,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityLabel="Verified store"
    >
      <BadgeCheck
        size={iconOnly}
        color={colors.verifiedBlue}
        fill={colors.verifiedBlue}
        strokeWidth={2}
      />
    </View>
  );
}
