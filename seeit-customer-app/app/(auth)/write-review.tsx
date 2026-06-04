import * as React from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { StarRating } from '@/components/ui/StarRating';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { MOOD_TAGS } from '@/lib/utils/constants';
import { submitReview } from '@/lib/api/reviews';
import { useAuth } from '@/lib/hooks/useAuth';
import { success, error as errorHaptic, selection } from '@/lib/utils/haptics';

type Portion = 'small' | 'right' | 'huge';

export default function WriteReviewScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ locationId?: string; menuItemId?: string }>();
  const [rating, setRating] = React.useState(0);
  const [text, setText] = React.useState('');
  const [portion, setPortion] = React.useState<Portion | null>(null);
  const [worth, setWorth] = React.useState<boolean | null>(null);
  const [moods, setMoods] = React.useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!user) router.replace('/(auth)/signin');
  }, [user]);

  function toggleMood(m: string) {
    const next = new Set(moods);
    if (next.has(m)) next.delete(m);
    else next.add(m);
    setMoods(next);
  }

  async function onSubmit() {
    if (!params.locationId || rating === 0) {
      errorHaptic();
      return;
    }
    setSubmitting(true);
    try {
      await submitReview({
        location_id: String(params.locationId),
        menu_item_id: params.menuItemId ? String(params.menuItemId) : null,
        rating,
        text: text.trim() || null,
        portion_size: portion,
        worth_the_price: worth,
        mood_tags: [...moods],
        photo_urls: [],
      });
      success();
      router.back();
    } catch {
      errorHaptic();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>Write a review</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: '#F3F3EE',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} color="#1A1A1A" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 24 }}>
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 8 }}>
            Your rating
          </Text>
          <StarRating value={rating} size={40} onChange={setRating} />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A' }}>
            Tell others about it
          </Text>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 14,
              minHeight: 120,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="What was great? Any tips? Real talk welcome."
              placeholderTextColor="#9CA3AF"
              multiline
              style={{ fontSize: 15, color: '#1A1A1A', minHeight: 96 }}
            />
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A' }}>Portion size</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['small', 'right', 'huge'] as Portion[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => {
                  selection();
                  setPortion(p);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: portion === p ? '#1A1A1A' : '#F3F3EE',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: portion === p ? '#FFFFFF' : '#1A1A1A', fontWeight: '700' }}>
                  {p === 'small' ? 'Small' : p === 'right' ? 'Just right' : 'Generous'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A' }}>
            Worth the price?
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => {
                selection();
                setWorth(true);
              }}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: worth === true ? '#10B981' : '#F3F3EE',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: worth === true ? '#FFFFFF' : '#1A1A1A', fontWeight: '700' }}>
                👍 Worth it
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                selection();
                setWorth(false);
              }}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: worth === false ? '#EF4444' : '#F3F3EE',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: worth === false ? '#FFFFFF' : '#1A1A1A', fontWeight: '700' }}>
                👎 Not really
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A' }}>How was it?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {MOOD_TAGS.map((m) => (
              <Chip key={m} label={m} selected={moods.has(m)} onPress={() => toggleMood(m)} />
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: '#FAFAF7',
          borderTopWidth: 1,
          borderTopColor: '#F3F3EE',
        }}
      >
        <Button
          label={submitting ? 'Posting…' : 'Post review'}
          fullWidth
          loading={submitting}
          disabled={rating === 0 || !params.locationId}
          onPress={onSubmit}
        />
      </View>
    </View>
  );
}
