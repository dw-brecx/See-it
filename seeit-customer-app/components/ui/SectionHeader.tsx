import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { tapLight } from '@/lib/utils/haptics';

export function SectionHeader({
  title,
  subtitle,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 12,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ fontSize: 19, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.3 }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{subtitle}</Text>
        )}
      </View>
      {onSeeAll && (
        <Pressable
          onPress={() => {
            tapLight();
            onSeeAll();
          }}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
        >
          <Text style={{ fontSize: 13, color: '#E85D3A', fontWeight: '600' }}>See all</Text>
          <ChevronRight size={16} color="#E85D3A" />
        </Pressable>
      )}
    </View>
  );
}
