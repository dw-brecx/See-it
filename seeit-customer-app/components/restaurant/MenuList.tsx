import * as React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Plus, AlertTriangle } from 'lucide-react-native';
import { MenuCategory, MenuItem, MenuItemPhoto } from '@/lib/types';
import { formatPrice } from '@/lib/utils/formatPrice';
import { tapLight, selection } from '@/lib/utils/haptics';
import { useAllergyWarnings } from '@/lib/hooks/useAllergyWarnings';
import { useAppStore } from '@/lib/store';
import { StarRating } from '../ui/StarRating';
import { PhotoPlaceholder } from '../shared/PhotoPlaceholder';
import { colors } from '@/lib/utils/colors';
import { pluralize } from '@/lib/utils/pluralize';

type ItemRow = MenuItem & { photos: MenuItemPhoto[] };

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingBottom: 24, gap: 28 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 6,
  },
  cover: {
    width: 96,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  body: { flex: 1, justifyContent: 'space-between' },
  name: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
    flex: 1,
  },
  desc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});

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
      // Treat is_visible nullable as visible.
      if (i.is_visible === false) continue;
      const key = i.category_id ?? null;
      const arr = byCategory.get(key) ?? [];
      arr.push(i);
      byCategory.set(key, arr);
    }
    const sections: { id: string; name: string; items: ItemRow[] }[] = [];
    for (const c of categories) {
      const list = byCategory.get(c.id) ?? [];
      if (list.length > 0) sections.push({ id: c.id, name: c.name, items: list });
    }
    const uncategorized = byCategory.get(null) ?? [];
    if (uncategorized.length) {
      sections.push({ id: 'uncategorized', name: 'Menu', items: uncategorized });
    }
    // Orphans: items whose category_id points at a deleted category.
    const known = new Set(categories.map((c) => c.id));
    const orphans: ItemRow[] = [];
    for (const [k, v] of byCategory.entries()) {
      if (k !== null && !known.has(k)) orphans.push(...v);
    }
    if (orphans.length) sections.push({ id: 'orphans', name: 'More', items: orphans });
    return sections;
  }, [categories, items]);

  function handleAdd(itemId: string) {
    selection();
    setOrderLocation(locationId);
    addOrderItem(itemId);
  }

  return (
    <View style={styles.wrap}>
      {grouped.map((section) => (
        <View key={section.id} style={{ gap: 12 }}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{section.name}</Text>
            <Text style={styles.sectionCount}>
              {pluralize(section.items.length, 'item')}
            </Text>
          </View>
          <View style={{ gap: 14 }}>
            {section.items.map((item) => {
              const warnings = warningsFor(item.dietary_tags);
              const photos = item.photos ?? [];
              const cover =
                photos.find((p) => p.is_featured)?.photo_url ??
                photos[0]?.photo_url ??
                null;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    tapLight();
                    router.push(`/restaurant/dish/${item.id}`);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${formatPrice(item.price)}`}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && { opacity: 0.96, transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <View style={styles.cover}>
                    {cover ? (
                      <Image
                        source={{ uri: cover }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <PhotoPlaceholder
                        cuisine={null}
                        rounded={14}
                        size={96}
                      />
                    )}
                  </View>
                  <View style={styles.body}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 6,
                      }}
                    >
                      <Text style={styles.name} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {warnings.length > 0 ? (
                        <AlertTriangle size={14} color={colors.danger} fill="#FEF2F2" />
                      ) : null}
                    </View>
                    {item.description ? (
                      <Text style={styles.desc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                    <View style={styles.priceRow}>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                      >
                        <Text style={styles.price}>
                          {item.price == null ? '' : formatPrice(item.price)}
                        </Text>
                        {(item.review_count ?? 0) > 0 ? (
                          <StarRating
                            value={item.average_rating ?? 0}
                            size={11}
                            showNumber
                          />
                        ) : null}
                      </View>
                      <Pressable
                        onPress={() => handleAdd(item.id)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${item.name} to order list`}
                        style={({ pressed }) => [
                          styles.addBtn,
                          pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] },
                        ]}
                      >
                        <Plus size={16} color="#FFFFFF" strokeWidth={2.8} />
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
