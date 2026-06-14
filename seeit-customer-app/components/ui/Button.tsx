import * as React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { tapLight } from '@/lib/utils/haptics';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  haptic?: boolean;
};

// Hardcoded brand colors here instead of going through the theme context.
// The theme provider is great for restaurant-page accent overrides, but
// for global primary buttons (signup, signin, save review) we want a
// guaranteed-terracotta CTA that can't be silently overridden.
const TERRACOTTA = '#E85D3A';
const TERRACOTTA_PRESSED = '#C9461F';

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  leadingIcon,
  trailingIcon,
  haptic = true,
}: Props) {
  const heights = { sm: 36, md: 48, lg: 56 };
  const padX = { sm: 12, md: 18, lg: 22 };
  const fontSize = { sm: 14, md: 15, lg: 17 };

  const handle = () => {
    if (disabled || loading) return;
    if (haptic) tapLight();
    onPress?.();
  };

  const isPrimary = variant === 'primary';
  const isDestructive = variant === 'destructive';
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';

  const bg = isPrimary
    ? TERRACOTTA
    : isDestructive
    ? '#EF4444'
    : isSecondary
    ? '#F3F3EE'
    : 'transparent';
  const border = isOutline ? '#E5E5E0' : 'transparent';
  const fg = isPrimary || isDestructive ? '#FFFFFF' : '#1A1A1A';

  // Subtle terracotta glow under primary buttons — makes the CTA pop off
  // the warm-50 background without being garish.
  const shadow = isPrimary
    ? {
        shadowColor: TERRACOTTA,
        shadowOpacity: 0.28,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }
    : isDestructive
    ? {
        shadowColor: '#EF4444',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }
    : {};

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        height: heights[size],
        paddingHorizontal: padX[size],
        backgroundColor: pressed && isPrimary ? TERRACOTTA_PRESSED : bg,
        borderRadius: 12,
        borderWidth: isOutline ? 1 : 0,
        borderColor: border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        gap: 8,
        ...shadow,
      })}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {leadingIcon ? <View>{leadingIcon}</View> : null}
          <Text
            style={{
              color: fg,
              fontSize: fontSize[size],
              fontWeight: '600',
              letterSpacing: 0.1,
            }}
          >
            {label}
          </Text>
          {trailingIcon ? <View>{trailingIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
}
