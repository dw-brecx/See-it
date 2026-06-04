import * as React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

type Props = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
};

export function EmptyState({ icon, title, subtitle, ctaLabel, onCtaPress }: Props) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 12 }}>
      {icon && (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#FDF2EE',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
          }}
        >
          {icon}
        </View>
      )}
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>
          {subtitle}
        </Text>
      )}
      {ctaLabel && onCtaPress && (
        <View style={{ marginTop: 4 }}>
          <Button label={ctaLabel} onPress={onCtaPress} />
        </View>
      )}
    </View>
  );
}
