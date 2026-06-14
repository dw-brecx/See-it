import * as React from 'react';
import { View } from 'react-native';
import { Utensils } from 'lucide-react-native';
import { getCuisineColor } from '@/lib/utils/cuisineColor';
import { colors } from '@/lib/utils/colors';

/**
 * Used wherever we'd otherwise render a blank gray box (cards with no photo,
 * search results, dish thumbnails). Picks a soft palette tied to the cuisine
 * (so the same restaurant always uses the same color) and centers a
 * fork-and-knife icon. Never a flat empty rectangle.
 */
export function PhotoPlaceholder({
  cuisine,
  size,
  rounded = 12,
}: {
  cuisine?: string | null;
  size?: number; // optional fixed size for square; otherwise fills parent
  rounded?: number;
}) {
  const { bg, fg } = getCuisineColor(cuisine ?? undefined);
  const iconSize = size ? Math.max(18, Math.round(size * 0.32)) : 28;
  return (
    <View
      style={{
        ...(size ? { width: size, height: size } : { ...({} as any), flex: 1 }),
        width: size ?? '100%',
        height: size ?? '100%',
        backgroundColor: bg,
        borderRadius: rounded,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Utensils size={iconSize} color={fg} strokeWidth={2} />
    </View>
  );
}
