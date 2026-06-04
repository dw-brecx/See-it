import * as React from 'react';
import { View, Text, Image } from 'react-native';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({
  url,
  name,
  size = 40,
  borderColor,
}: {
  url?: string | null;
  name?: string | null;
  size?: number;
  borderColor?: string;
}) {
  const display = name ?? '?';
  const style = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: '#F3F3EE',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    borderWidth: borderColor ? 2 : 0,
    borderColor: borderColor ?? 'transparent',
  };
  if (url) {
    return (
      <View style={style}>
        <Image source={{ uri: url }} style={{ width: size, height: size }} resizeMode="cover" />
      </View>
    );
  }
  return (
    <View style={style}>
      <Text style={{ fontWeight: '700', color: '#6B7280', fontSize: size * 0.36 }}>
        {initials(display)}
      </Text>
    </View>
  );
}
