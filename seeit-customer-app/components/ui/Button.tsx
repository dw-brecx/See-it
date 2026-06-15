import * as React from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
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

// Brand palette pinned at module load — never computed at render time so a
// theme provider can't accidentally swap the primary bg to "transparent".
const C = {
  primary: '#E85D3A',
  primaryPressed: '#C9461F',
  destructive: '#EF4444',
  destructivePressed: '#B91C1C',
  secondary: '#F3F3EE',
  outlineBorder: '#E5E7EB',
  text: '#1A1A1A',
  white: '#FFFFFF',
};

const SIZE_H = { sm: 36, md: 48, lg: 56 } as const;
const SIZE_PAD = { sm: 12, md: 18, lg: 22 } as const;
const SIZE_FONT = { sm: 14, md: 15, lg: 17 } as const;

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: {
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryPressed: { backgroundColor: C.primaryPressed },
  destructive: {
    backgroundColor: C.destructive,
    shadowColor: C.destructive,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  destructivePressed: { backgroundColor: C.destructivePressed },
  secondary: { backgroundColor: C.secondary },
  secondaryPressed: { opacity: 0.85 },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.outlineBorder },
  outlinePressed: { opacity: 0.8 },
  ghost: { backgroundColor: 'transparent' },
  ghostPressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  stretch: { alignSelf: 'stretch' },
});

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
  const handle = () => {
    if (disabled || loading) return;
    if (haptic) tapLight();
    onPress?.();
  };

  const variantBase =
    variant === 'primary'
      ? styles.primary
      : variant === 'destructive'
      ? styles.destructive
      : variant === 'secondary'
      ? styles.secondary
      : variant === 'outline'
      ? styles.outline
      : styles.ghost;

  const variantPressed =
    variant === 'primary'
      ? styles.primaryPressed
      : variant === 'destructive'
      ? styles.destructivePressed
      : variant === 'secondary'
      ? styles.secondaryPressed
      : variant === 'outline'
      ? styles.outlinePressed
      : styles.ghostPressed;

  const fg =
    variant === 'primary' || variant === 'destructive' ? C.white : C.text;

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height: SIZE_H[size],
          paddingHorizontal: SIZE_PAD[size],
        },
        variantBase,
        pressed && variantPressed,
        disabled && styles.disabled,
        fullWidth && styles.stretch,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {leadingIcon ? <View>{leadingIcon}</View> : null}
          <Text
            style={{
              color: fg,
              fontSize: SIZE_FONT[size],
              fontWeight: '700',
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
