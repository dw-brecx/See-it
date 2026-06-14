import * as React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { selection } from '@/lib/utils/haptics';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  leadingIcon?: React.ReactNode;
};

const C = {
  bgIdle: '#F3F3EE',
  bgSelected: '#1A1A1A',
  textIdle: '#1A1A1A',
  textSelected: '#FFFFFF',
  borderIdle: '#E5E7EB',
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  idle: { backgroundColor: C.bgIdle, borderColor: C.borderIdle },
  selected: { backgroundColor: C.bgSelected, borderColor: C.bgSelected },
});

export function Chip({ label, selected, onPress, onRemove, leadingIcon }: Props) {
  return (
    <Pressable
      onPress={() => {
        selection();
        onPress?.();
      }}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!selected } : undefined}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.idle,
        pressed && { opacity: 0.8 },
      ]}
    >
      {leadingIcon}
      <Text
        style={{
          color: selected ? C.textSelected : C.textIdle,
          fontSize: 13,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={8}>
          <X size={14} color={selected ? C.textSelected : '#6B7280'} />
        </Pressable>
      )}
    </Pressable>
  );
}
