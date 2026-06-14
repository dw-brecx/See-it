import * as React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Plus, AlertTriangle } from 'lucide-react-native';
import { MenuCategory, MenuItem, MenuItemPhoto } from '@/lib/types';
import { formatPrice } from '@/lib/utils/formatPrice';
import { tapLight, selection } from '@/lib/utils/haptics';
import { useAllergyWarnings } from '@/lib/hooks/useAllergyWarnings';
import { useAppStore } from '@/lib/store';
import { StarRating } from '../ui/StarRating';

type ItemRow = MenuItem & { photos: MenuItemPhoto[] };

export function MenuList({
  categories,
  items,
  locationId,
}: {
  categories: MenuCategory[];
  items: ItemRow[];
  locationId: string;
}) {
  const warningsFor = useAllergyWarnings();
  const setOrderLocation = useAppStore((s) => s.setOrderLocation);
  const addOrderItem = useAppStore((s) => s.addOrderItem);

  const grouped = React.useMemo(() => {
    const byCategory = new Map<string | null, ItemRow[]>();
    for (const i of items) {
      // Treat is_visible nullable as "visible" — the rule is "hidden only if
      // explicitly false", same shape as is_suspended.
      if (i.is_visible === false) continue;
      const key = i.category_id ?? null;
      const arr = byCategory.get(key) ?? [];
      arr.push(i);
      byCategory.set(key, arr);
    }
    const sections = categories.map((c) => ({
      category: c,
      items: byCategory.get(c.id) ?? [],
    }));
    const uncategorized = byCategory.get(null) ?? [];
    if (uncategorized.length) sections.push({ category: null as any, items: uncategorized });
    // ALSO catch any items whose category_id points at a category that
    // doesn't actually exist (orphaned items from a deleted category) —
    // put them in the "Menu" bucket so they still render.
    const knownIds = new Set(categories.map((c) => c.id));
    const orphans: ItemRow[] = [];
    for (const [key, list] of byCategory.entries()) {
      if (key !== null && !knownIds.has(key)) orphans.push(...list);
    }
    if (orphans.length) sections.push({ category: null as any, items: orphans });
    return sections.filter((s) => s.items.length > 0);
  }, [categories, items]);

  function handleAdd(itemId: string) {
    selection();
    setOrderLocation(locationId);
    addOrderItem(itemId);
  }

  return (
    <View style={{ paddingHorizontal: 20, gap: 28 }}>
      {grouped.map((section) => (
        <View key={section.category?.id ?? 'uncat'} style={{ gap: 12 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: '#1A1A1A',
              letterSpacing: -0.3,
            }}
          >
            {section.category?.name ?? 'Menu'}
          </Text>
          <View style={{ gap: 14 }}>
            {section.items.map((item) => {
              const warnings = warningsFor(item.dietary_tags);
              const cover =
                item.photos.find((p) => p.is_featured)?.photo_url ?? item.photos[0]?.photo_url ?? null;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    tapLight();
                    router.push(`/restaurant/dish/${item.id}`);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    gap: 12,
                    opacity: pressed ? 0.95 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 12,
                      backgroundColor: '#F3F3EE',
                      overflow: 'hidden',
                    }}
                  >
                    {cover && (
                      <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text
                        style={{ fontSize: 15, fontWeight: '700', color: '#1A1A1A', flex: 1 }}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      {warnings.length > 0 && (
                        <AlertTriangle size={14} color="#EF4444" fill="#FEF2F2" />
                      )}
                    </View>
                    {item.description ? (
                      <Text
                        style={{ fontSize: 13, color: '#6B7280', marginTop: 2, lineHeight: 18 }}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    ) : null}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 6,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>
                          {formatPrice(item.price)}
                        </Text>
                        {(item.review_count ?? 0) > 0 && (
                          <StarRating value={item.average_rating ?? 0} size={11} showNumber />
                        )}
                      </View>
                      <Pressable
                        onPress={() => handleAdd(item.id)}
                        hitSlop={10}
                        style={({ pressed }) => ({
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: '#1A1A1A',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        <Plus size={16} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
