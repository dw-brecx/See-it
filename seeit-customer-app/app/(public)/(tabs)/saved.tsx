import * as React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Heart, Bookmark, BookmarkPlus } from 'lucide-react-native';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSavedItems } from '@/lib/hooks/useSavedItems';
import { unsaveItem } from '@/lib/api/savedItems';
import { useQueryClient } from '@tanstack/react-query';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { SavedItemCard } from '@/components/restaurant/SavedItemCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { selection } from '@/lib/utils/haptics';
import { colors } from '@/lib/utils/colors';
import { toast } from '@/components/ui/Toast';

type Tab = 'spots' | 'dishes' | 'want-to-try';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = React.useState<Tab>('spots');
  const saved = useSavedItems();

  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
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
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Heart size={32} color={colors.primary} />
        </View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: colors.text,
            letterSpacing: -0.4,
          }}
        >
          Save the spots you love
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          Sign in to bookmark restaurants and dishes, write reviews,{'\n'}and build order lists.
        </Text>
        <Button label="Sign in" fullWidth size="lg" onPress={() => router.push('/(auth)/signin')} />
        <Pressable
          onPress={() => router.push('/(auth)/signup')}
          hitSlop={8}
          style={{ marginTop: 12 }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Don't have an account?{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign up</Text>
          </Text>
        </Pressable>
      </View>
    );
  }

  const all = saved.data ?? [];
  const list =
    tab === 'spots'
      ? all.filter((s) => s.item_type === 'location' && !s.is_want_to_try)
      : tab === 'dishes'
      ? all.filter((s) => s.item_type === 'menu_item' && !s.is_want_to_try)
      : all.filter((s) => !!s.is_want_to_try);

  async function handleRemove(id: string) {
    try {
      await unsaveItem(id);
      void qc.invalidateQueries({ queryKey: ['saved', user!.id] });
      toast.success('Removed');
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not remove');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '800',
            color: colors.text,
            letterSpacing: -0.6,
          }}
        >
          Saved
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {(
            [
              ['spots', 'Spots'],
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
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              accessibilityLabel={label}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: tab === t ? colors.text : colors.surfaceMuted,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: tab === t ? '#FFFFFF' : colors.text,
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {saved.isLoading ? (
        <View style={{ padding: 20, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={104} />
          ))}
        </View>
      ) : list.length === 0 ? (
        <EmptyState
          icon={
            tab === 'want-to-try' ? (
              <BookmarkPlus size={28} color={colors.primary} />
            ) : (
              <Bookmark size={28} color={colors.primary} />
            )
          }
          title={
            tab === 'dishes'
              ? 'No saved dishes yet'
              : tab === 'want-to-try'
              ? 'Nothing on your want-to-try list'
              : 'No saved spots yet'
          }
          subtitle={
            tab === 'want-to-try'
              ? 'Tap the bookmark+ icon on a spot to add it.'
              : 'Tap the heart on any restaurant or dish to save it here.'
          }
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}
          renderItem={({ item }) => (
            <SavedItemCard
              savedId={item.id}
              itemType={item.item_type}
              locationId={item.location_id}
              menuItemId={item.menu_item_id}
              notes={item.notes}
              wantToTry={!!item.is_want_to_try}
              onRemove={() => handleRemove(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}
