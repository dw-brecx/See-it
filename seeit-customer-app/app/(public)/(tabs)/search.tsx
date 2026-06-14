import * as React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react-native';
import { SearchBar } from '@/components/search/SearchBar';
import { Chip } from '@/components/ui/Chip';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { DishCard } from '@/components/restaurant/DishCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { searchBrands, searchDishes } from '@/lib/api/search';
import { useAppStore } from '@/lib/store';
import { selection } from '@/lib/utils/haptics';
import { colors } from '@/lib/utils/colors';

type Tab = 'restaurants' | 'dishes';

// Quick filters at the top of the empty-state Search screen. Tapping
// dropps the value into the search box; the search backend ALSO matches
// dietary tags so "Kosher" finds every kosher spot.
const DIETARY_QUICK = ['Kosher', 'Halal', 'Vegan', 'Vegetarian', 'Gluten-Free options'];
const CUISINE_QUICK = [
  'Israeli',
  'Pizza',
  'Sushi',
  'Falafel',
  'Burgers',
  'Shawarma',
  'Steakhouse',
  'Pasta',
  'Mediterranean',
];

const styles = StyleSheet.create({
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabBtnIdle: { backgroundColor: '#F3F3EE', borderColor: '#E5E7EB' },
  tabBtnActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  tabLabel: { fontSize: 13, fontWeight: '700' },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterIdle: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  filterActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const query = useAppStore((s) => s.searchQuery);
  const setQuery = useAppStore((s) => s.setSearchQuery);
  const filters = useAppStore((s) => s.filters);
  const [tab, setTab] = React.useState<Tab>('restaurants');
  const [debounced, setDebounced] = React.useState(query);
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - 40;
  const dishCardWidth = (screenWidth - 40 - 14) / 2;

  // Has any persisted filter actually been set? Lights up the filter button.
  const filtersActive =
    (filters.cuisines?.length ?? 0) > 0 ||
    (filters.dietary?.length ?? 0) > 0 ||
    (filters.establishments?.length ?? 0) > 0 ||
    !!filters.minRating ||
    !!filters.maxDistance ||
    !!filters.openNow ||
    !!filters.hasPhotos;

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  const brandsQ = useQuery({
    queryKey: ['search-brands', debounced],
    queryFn: () => searchBrands(debounced),
    enabled: tab === 'restaurants' && debounced.length > 0,
  });
  const dishesQ = useQuery({
    queryKey: ['search-dishes', debounced],
    queryFn: () => searchDishes(debounced),
    enabled: tab === 'dishes' && debounced.length > 0,
  });

  const isLoading =
    (tab === 'restaurants' ? brandsQ.isLoading : dishesQ.isLoading) &&
    debounced.length > 0;
  const showSuggestions = debounced.length === 0;

  function quickSearch(value: string) {
    selection();
    setQuery(value);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <SearchBar value={query} onChange={setQuery} autoFocus />
          </View>
          <Pressable
            onPress={selection}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              filtersActive ? 'Filters active' : 'Open filters'
            }
            style={[
              styles.filterBtn,
              filtersActive ? styles.filterActive : styles.filterIdle,
            ]}
          >
            <SlidersHorizontal
              size={18}
              color={filtersActive ? '#FFFFFF' : colors.text}
            />
            {filtersActive ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['restaurants', 'dishes'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                selection();
                setTab(t);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              accessibilityLabel={t === 'restaurants' ? 'Restaurants' : 'Dishes'}
              style={[styles.tabBtn, tab === t ? styles.tabBtnActive : styles.tabBtnIdle]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: tab === t ? '#FFFFFF' : colors.text },
                ]}
              >
                {t === 'restaurants' ? 'Restaurants' : 'Dishes'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {showSuggestions ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 18 }}>
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionLabel}>Dietary</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {DIETARY_QUICK.map((q) => (
                <Chip key={q} label={q} onPress={() => quickSearch(q)} />
              ))}
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={styles.sectionLabel}>Trending cuisines</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CUISINE_QUICK.map((q) => (
                <Chip key={q} label={q} onPress={() => quickSearch(q)} />
              ))}
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={styles.sectionLabel}>Try searching</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {['Potato', 'Cholent', 'Pita', 'Chicken', 'Schnitzel', 'Hummus'].map(
                (q) => (
                  <Chip key={q} label={q} onPress={() => quickSearch(q)} />
                ),
              )}
            </View>
          </View>
        </ScrollView>
      ) : isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={84} />
          ))}
        </View>
      ) : tab === 'restaurants' ? (
        brandsQ.data && brandsQ.data.length > 0 ? (
          <FlatList
            data={brandsQ.data}
            keyExtractor={(b) => b.id}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 100,
              gap: 18,
            }}
            renderItem={({ item }) => <RestaurantCard brand={item} width={cardWidth} />}
          />
        ) : (
          <EmptyState
            title={`No restaurants for "${debounced}"`}
            subtitle="Try a different cuisine, dish name, or dietary tag."
          />
        )
      ) : dishesQ.data && dishesQ.data.length > 0 ? (
        <FlatList
          data={dishesQ.data}
          keyExtractor={(d) => d.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 14, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingBottom: 100, gap: 18 }}
          renderItem={({ item }) => (
            <DishCard
              item={{
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                dietary_tags: item.dietary_tags,
                average_rating: item.average_rating,
                review_count: item.review_count,
                location_id: item.location_id,
                is_visible: true,
                category_id: null,
                cover_photo_url: item.cover_photo_url,
              }}
              brand_name={item.brand_name}
              cuisine={item.primary_cuisine}
              width={dishCardWidth}
            />
          )}
        />
      ) : (
        <EmptyState
          title={`No dishes for "${debounced}"`}
          subtitle="Try a different name, ingredient, or dietary tag."
        />
      )}
    </View>
  );
}
