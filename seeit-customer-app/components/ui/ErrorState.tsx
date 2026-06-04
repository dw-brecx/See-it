import * as React from 'react';
import { View, Text } from 'react-native';
import { CloudOff } from 'lucide-react-native';
import { Button } from './Button';

export function ErrorState({
  title = "Couldn't load this",
  subtitle = 'Pull down to refresh, or try again in a moment.',
  onRetry,
}: {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 12 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#FEF2F2',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CloudOff size={32} color="#B91C1C" />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>
        {subtitle}
      </Text>
      {onRetry && <Button label="Try again" variant="outline" onPress={onRetry} />}
    </View>
  );
}
