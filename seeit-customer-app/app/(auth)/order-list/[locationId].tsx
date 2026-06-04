import * as React from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabase/client';
import { MenuItem } from '@/lib/types';
import { formatPrice } from '@/lib/utils/formatPrice';
import { selection, tapMedium } from '@/lib/utils/haptics';

export default function OrderListScreen() {
  const params = useLocalSearchParams<{ locationId: string }>();
  const locationId = String(params.locationId ?? '');
  const insets = useSafeAreaInsets();
  const order = useAppStore((s) => s.orderList);
  const update = useAppStore((s) => s.updateOrderItem);
  const remove = useAppStore((s) => s.removeOrderItem);
  const clear = useAppStore((s) => s.clearOrderList);

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
  const total = order.items.reduce((sum, it) => {
    const m = itemMap.get(it.menu_item_id);
    return sum + (m?.price ?? 0) * it.quantity;
  }, 0);

  if (order.items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#F3F3EE',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} color="#1A1A1A" />
          </Pressable>
        </View>
        <EmptyState
          title="Your order list is empty"
          subtitle="Tap + on any dish to add it here. Build a list everyone at the table can see."
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#F3F3EE',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={18} color="#1A1A1A" />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>Order list</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}>
        {order.items.map((it) => {
          const m = itemMap.get(it.menu_item_id);
          return (
            <View
              key={it.menu_item_id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                gap: 10,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: '#1A1A1A', fontSize: 15 }}>
                    {m?.name ?? '…'}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    {formatPrice(m?.price)}
                  </Text>
                </View>
                <Pressable onPress={() => remove(it.menu_item_id)} hitSlop={8}>
                  <Trash2 size={18} color="#EF4444" />
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable
                  onPress={() => {
                    selection();
                    update(it.menu_item_id, { quantity: Math.max(1, it.quantity - 1) });
                  }}
                  hitSlop={10}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#F3F3EE',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Minus size={14} color="#1A1A1A" />
                </Pressable>
                <Text style={{ fontWeight: '700', minWidth: 24, textAlign: 'center' }}>
                  {it.quantity}
                </Text>
                <Pressable
                  onPress={() => {
                    selection();
                    update(it.menu_item_id, { quantity: it.quantity + 1 });
                  }}
                  hitSlop={10}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#1A1A1A',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={14} color="#FFFFFF" />
                </Pressable>
              </View>
              <TextInput
                value={it.notes ?? ''}
                onChangeText={(v) => update(it.menu_item_id, { notes: v || null })}
                placeholder="Notes (no onions, well done…)"
                placeholderTextColor="#9CA3AF"
                style={{
                  backgroundColor: '#F3F3EE',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: '#1A1A1A',
                }}
              />
              <TextInput
                value={it.assigned_to ?? ''}
                onChangeText={(v) => update(it.menu_item_id, { assigned_to: v || null })}
                placeholder="For whom? (Me, Mom, etc.)"
                placeholderTextColor="#9CA3AF"
                style={{
                  backgroundColor: '#F3F3EE',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: '#1A1A1A',
                }}
              />
            </View>
          );
        })}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: '#FAFAF7',
          borderTopWidth: 1,
          borderTopColor: '#F3F3EE',
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>Total (est.)</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A1A1A' }}>
            ${total.toFixed(2)}
          </Text>
        </View>
        <Button
          label="Show server"
          fullWidth
          onPress={() => {
            tapMedium();
            router.push('/(auth)/order-list/show-server');
          }}
        />
        <Pressable onPress={clear} hitSlop={8} style={{ alignItems: 'center' }}>
          <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '600' }}>Clear list</Text>
        </Pressable>
      </View>
    </View>
  );
}
