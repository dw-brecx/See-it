import * as React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { useTheme } from '../brand/ThemeProvider';
import { tapLight } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

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
  const theme = useTheme();
  const heights = { sm: 36, md: 48, lg: 56 };
  const padX = { sm: 12, md: 18, lg: 22 };
  const fontSize = { sm: 14, md: 15, lg: 17 };

  const handle = () => {
    if (disabled || loading) return;
    if (haptic) tapLight();
    onPress?.();
  };

  const bg =
    variant === 'primary'
      ? theme.accent
      : variant === 'destructive'
      ? '#EF4444'
      : variant === 'secondary'
      ? '#F3F3EE'
      : 'transparent';
  const border =
    variant === 'outline' ? '#E5E5E0' : variant === 'ghost' || variant === 'secondary' ? 'transparent' : 'transparent';
  const fg =
    variant === 'primary' || variant === 'destructive'
      ? '#FFFFFF'
      : variant === 'outline' || variant === 'secondary' || variant === 'ghost'
      ? '#1A1A1A'
      : '#1A1A1A';

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        height: heights[size],
        paddingHorizontal: padX[size],
        backgroundColor: bg,
        borderRadius: 12,
        borderWidth: variant === 'outline' ? 1 : 0,
        borderColor: border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        gap: 8,
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
