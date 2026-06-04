import * as React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Filter } from 'lucide-react-native';
import { SearchBar } from '@/components/search/SearchBar';
import { Chip } from '@/components/ui/Chip';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { DishCard } from '@/components/restaurant/DishCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { searchBrands, searchDishes } from '@/lib/api/search';
import { useAppStore } from '@/lib/store';
import { tapLight, selection } from '@/lib/utils/haptics';

type Tab = 'dishes' | 'restaurants';

const TRENDING = ['Sushi', 'Falafel', 'Pizza', 'Burgers', 'Israeli', 'Shawarma', 'Pasta'];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const query = useAppStore((s) => s.searchQuery);
  const setQuery = useAppStore((s) => s.setSearchQuery);
  const [tab, setTab] = React.useState<Tab>('restaurants');
  const [debounced, setDebounced] = React.useState(query);

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

  const isLoading = (tab === 'restaurants' ? brandsQ.isLoading : dishesQ.isLoading) && debounced.length > 0;
  const showSuggestions = debounced.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
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
            onPress={tapLight}
            hitSlop={8}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: '#1A1A1A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Filter size={18} color="#FFFFFF" />
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
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: tab === t ? '#1A1A1A' : '#F3F3EE',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: tab === t ? '#FFFFFF' : '#1A1A1A',
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {showSuggestions ? (
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Trending
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TRENDING.map((q) => (
              <Chip key={q} label={q} onPress={() => setQuery(q)} />
            ))}
          </View>
        </View>
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
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 18 }}
            renderItem={({ item }) => (
              <RestaurantCard brand={item} width={undefined as any} />
            )}
          />
        ) : (
          <EmptyState title="No matches" subtitle="Try a different cuisine or dish name." />
        )
      ) : dishesQ.data && dishesQ.data.length > 0 ? (
        <FlatList
          data={dishesQ.data}
          keyExtractor={(d) => d.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 14, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingBottom: 40, gap: 18 }}
          renderItem={({ item }) => (
            <DishCard
              item={item as any}
              brand_name={item.brand_name}
              width={(360 - 20 * 2 - 14) / 2}
            />
          )}
        />
      ) : (
        <EmptyState title="No dishes found" subtitle="Try a different name or cuisine." />
      )}
    </View>
  );
}
