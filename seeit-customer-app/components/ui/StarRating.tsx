import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Star } from 'lucide-react-native';
import { selection } from '@/lib/utils/haptics';
import { colors } from '@/lib/utils/colors';

type Props = {
  value: number;
  size?: number;
  showNumber?: boolean;
  numberSuffix?: string;
  onChange?: (next: number) => void;
};

export function StarRating({
  value,
  size = 14,
  showNumber,
  numberSuffix,
  onChange,
}: Props) {
  const interactive = !!onChange;
  const stars = [1, 2, 3, 4, 5];
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
      accessible={interactive}
      accessibilityRole={interactive ? 'radiogroup' : undefined}
    >
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
              accessibilityRole="radio"
              accessibilityState={{ checked: i <= value }}
              accessibilityLabel={`${i} ${i === 1 ? 'star' : 'stars'}`}
            >
              <Star
                size={size}
                color={colors.starFilled}
                fill={i <= value ? colors.starFilled : 'transparent'}
                strokeWidth={2}
              />
            </Pressable>
          ) : (
            <Star
              key={i}
              size={size}
              color={colors.starFilled}
              fill={i <= Math.floor(value) ? colors.starFilled : 'transparent'}
              strokeWidth={2}
              style={{ marginRight: 2 }}
            />
          ),
        )}
      </View>
      {showNumber && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
          {value.toFixed(1)}
          {numberSuffix ? (
            <Text style={{ color: colors.textSecondary }}>{numberSuffix}</Text>
          ) : null}
        </Text>
      )}
    </View>
  );
}
