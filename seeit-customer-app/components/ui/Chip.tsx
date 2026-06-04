import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { selection } from '@/lib/utils/haptics';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  leadingIcon?: React.ReactNode;
};

export function Chip({ label, selected, onPress, onRemove, leadingIcon }: Props) {
  return (
    <Pressable
      onPress={() => {
        selection();
        onPress?.();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: selected ? '#1A1A1A' : '#F3F3EE',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {leadingIcon}
      <Text
        style={{
          color: selected ? '#FFFFFF' : '#1A1A1A',
          fontSize: 13,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={8}>
          <X size={14} color={selected ? '#FFFFFF' : '#6B7280'} />
        </Pressable>
      )}
    </Pressable>
  );
}
