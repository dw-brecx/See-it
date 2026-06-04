import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { ReviewCard } from '@/components/review/ReviewCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';

export default function MyReviewsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['my-reviews', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('reviews')
        .select(
          '*, user:users(name, email, avatar_url), photos:review_photos(*), replies:review_replies(*)',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return ((data ?? []) as any[]).map((r) => ({
        ...r,
        reviewer_name: r.user?.name ?? r.user?.email ?? 'You',
        reviewer_avatar_url: r.user?.avatar_url ?? null,
        photos: r.photos ?? [],
        reply: r.replies?.[0] ?? null,
      }));
    },
    enabled: !!user,
  });

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
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>My reviews</Text>
        <View style={{ width: 38 }} />
      </View>
      {isLoading ? (
        <View style={{ padding: 20, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={120} />
          ))}
        </View>
      ) : data && data.length > 0 ? (
        <FlashList
          data={data}
          estimatedItemSize={180}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          renderItem={({ item }) => <ReviewCard review={item as any} />}
        />
      ) : (
        <EmptyState
          title="No reviews yet"
          subtitle="Review your favorite spots to help other people find good food."
        />
      )}
    </View>
  );
}
