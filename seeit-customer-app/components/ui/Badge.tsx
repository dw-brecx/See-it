import * as React from 'react';
import { View, Text } from 'react-native';

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'verified';

const COLORS: Record<Variant, { bg: string; fg: string }> = {
  neutral: { bg: '#F3F3EE', fg: '#1A1A1A' },
  success: { bg: '#ECFDF5', fg: '#047857' },
  warning: { bg: '#FFFBEB', fg: '#B45309' },
  danger: { bg: '#FEF2F2', fg: '#B91C1C' },
  info: { bg: '#EFF6FF', fg: '#1D4ED8' },
  verified: { bg: '#EFF6FF', fg: '#1D4ED8' },
};

export function Badge({
  label,
  variant = 'neutral',
  icon,
}: {
  label: string;
  variant?: Variant;
  icon?: React.ReactNode;
}) {
  const c = COLORS[variant];
  return (
    <View
      style={{
        backgroundColor: c.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
      }}
    >
      {icon}
      <Text style={{ color: c.fg, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
