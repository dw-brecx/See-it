import * as React from 'react';
import { Modal, View, Pressable, Text, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 0..1 — fraction of screen height. Defaults to 0.75. */
  heightFraction?: number;
};

/**
 * Lightweight bottom sheet — Modal-based for portability. Not draggable in v1,
 * but has the visual handle and tap-to-dismiss backdrop. Swap to
 * @gorhom/bottom-sheet later if we need physics-based drag.
 */
export function BottomSheet({ open, onClose, title, children, heightFraction = 0.75 }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} />
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: `${heightFraction * 100}%`,
            paddingBottom: insets.bottom + 12,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#E5E5E0',
              }}
            />
          </View>
          {(title || onClose) && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 8,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>
                {title ?? ''}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F3F3EE',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color="#1A1A1A" />
              </Pressable>
            </View>
          )}
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
