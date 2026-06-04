import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { X, Sun, Moon } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase/client';
import { MenuItem } from '@/lib/types';
import { tapLight } from '@/lib/utils/haptics';

export default function ShowServerScreen() {
  const insets = useSafeAreaInsets();
  const order = useAppStore((s) => s.orderList);
  const [bright, setBright] = React.useState(false);

  const itemIds = order.items.map((i) => i.menu_item_id);
  const { data: items } = useQuery({
    queryKey: ['order-items', itemIds.join(',')],
    queryFn: async () => {
      if (itemIds.length === 0) return [] as MenuItem[];
      const { data } = await supabase.from('menu_items').select('*').in('id', itemIds);
      return (data ?? []) as MenuItem[];
    },
    enabled: itemIds.length > 0,
  });
  const itemMap = new Map((items ?? []).map((i) => [i.id, i]));

  return (
    <View style={{ flex: 1, backgroundColor: bright ? '#FFFFFF' : '#0F0F10' }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={() => {
            tapLight();
            setBright((b) => !b);
          }}
          hitSlop={10}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: bright ? '#F3F3EE' : 'rgba(255,255,255,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {bright ? <Moon size={18} color="#1A1A1A" /> : <Sun size={18} color="#FFFFFF" />}
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: bright ? '#F3F3EE' : 'rgba(255,255,255,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} color={bright ? '#1A1A1A' : '#FFFFFF'} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
          gap: 24,
        }}
      >
        {order.items.map((it) => {
          const m = itemMap.get(it.menu_item_id);
          return (
            <View key={it.menu_item_id}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '900',
                  color: bright ? '#1A1A1A' : '#FFFFFF',
                  letterSpacing: -0.5,
                }}
              >
                {it.quantity}× {m?.name ?? '…'}
              </Text>
              {it.notes && (
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '600',
                    color: bright ? '#6B7280' : '#9CA3AF',
                    marginTop: 8,
                  }}
                >
                  {it.notes}
                </Text>
              )}
              {it.assigned_to && (
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '600',
                    color: bright ? '#E85D3A' : '#F59E0B',
                    marginTop: 4,
                  }}
                >
                  For {it.assigned_to}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
