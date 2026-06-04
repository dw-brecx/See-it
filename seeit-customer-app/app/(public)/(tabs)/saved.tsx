import * as React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Heart, Bookmark } from 'lucide-react-native';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSavedItems } from '@/lib/hooks/useSavedItems';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { selection } from '@/lib/utils/haptics';

type Tab = 'locations' | 'dishes' | 'want-to-try';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = React.useState<Tab>('locations');
  const saved = useSavedItems();

  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FAFAF7',
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: '#FDF2EE',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Heart size={32} color="#E85D3A" />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.4 }}>
          Save the spots you love
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#6B7280',
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          Sign in to bookmark restaurants and dishes, write reviews,{'\n'}and build order lists.
        </Text>
        <Button label="Sign in" fullWidth onPress={() => router.push('/(auth)/signin')} />
        <Pressable onPress={() => router.push('/(auth)/signup')} hitSlop={8} style={{ marginTop: 12 }}>
          <Text style={{ color: '#6B7280', fontSize: 13 }}>
            Don't have an account? <Text style={{ color: '#E85D3A', fontWeight: '700' }}>Sign up</Text>
          </Text>
        </Pressable>
      </View>
    );
  }

  const locations = (saved.data ?? []).filter((s) => s.item_type === 'location');
  const dishes = (saved.data ?? []).filter((s) => s.item_type === 'menu_item');
  const list = tab === 'locations' ? locations : tab === 'dishes' ? dishes : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.6 }}>
          Saved
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {(
            [
              ['locations', 'Spots'],
              ['dishes', 'Dishes'],
              ['want-to-try', 'Want to try'],
            ] as [Tab, string][]
          ).map(([t, label]) => (
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
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {list.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={28} color="#E85D3A" />}
          title={tab === 'dishes' ? 'No saved dishes yet' : 'No saved spots yet'}
          subtitle="Tap the bookmark on any restaurant or dish to save it here."
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>
                {item.item_type === 'location' ? '📍 Location' : '🍽️ Dish'}
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 12.5, marginTop: 4 }}>
                {item.notes ?? 'Tap to open'}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
