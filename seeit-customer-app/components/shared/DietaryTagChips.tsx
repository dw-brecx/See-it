import * as React from 'react';
import { View } from 'react-native';
import { Chip } from '../ui/Chip';

export function DietaryTagChips({
  tags,
  max = 4,
}: {
  tags: string[] | null | undefined;
  max?: number;
}) {
  if (!tags?.length) return null;
  const shown = tags.slice(0, max);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {shown.map((t) => (
        <Chip key={t} label={t} />
      ))}
    </View>
  );
}
