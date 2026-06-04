import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Star } from 'lucide-react-native';
import { selection } from '@/lib/utils/haptics';

type Props = {
  value: number; // 0–5; may be fractional in read-only mode
  size?: number;
  showNumber?: boolean;
  numberSuffix?: string;
  onChange?: (next: number) => void; // make it interactive
};

export function StarRating({ value, size = 14, showNumber, numberSuffix, onChange }: Props) {
  const interactive = !!onChange;
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ flexDirection: 'row' }}>
        {stars.map((i) =>
          interactive ? (
            <Pressable
              key={i}
              onPress={() => {
                selection();
                onChange?.(i);
              }}
              hitSlop={8}
              style={{ marginRight: 2 }}
            >
              <Star
                size={size}
                color="#F59E0B"
                fill={i <= value ? '#F59E0B' : 'transparent'}
                strokeWidth={2}
              />
            </Pressable>
          ) : (
            <Star
              key={i}
              size={size}
              color="#F59E0B"
              fill={i <= Math.floor(value) ? '#F59E0B' : 'transparent'}
              strokeWidth={2}
              style={{ marginRight: 2 }}
            />
          ),
        )}
      </View>
      {showNumber && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1A1A' }}>
          {value.toFixed(1)}
          {numberSuffix ? <Text style={{ color: '#6B7280' }}>{numberSuffix}</Text> : null}
        </Text>
      )}
    </View>
  );
}
