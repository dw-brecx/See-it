import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { X, Camera, ImagePlus, Trash2 } from 'lucide-react-native';
import { StarRating } from '@/components/ui/StarRating';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { MOOD_TAGS } from '@/lib/utils/constants';
import { submitReview, uploadReviewPhoto } from '@/lib/api/reviews';
import { useAuth } from '@/lib/hooks/useAuth';
import { success, error as errorHaptic, selection } from '@/lib/utils/haptics';
import { toast } from '@/components/ui/Toast';
import { colors } from '@/lib/utils/colors';
import { debugLog } from '@/lib/utils/debugLog';

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
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
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

  async function pickPhotos() {
    selection();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error('Photo library access needed to attach photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 6 - photos.length,
    });
    if (result.canceled) return;
    debugLog('write-review.pickPhotos', 'picked', { count: result.assets.length });
    setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
  }

  async function takePhoto() {
    selection();
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast.error('Camera access needed to take photos');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;
    setPhotos((prev) => [...prev, result.assets[0].uri]);
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit() {
    if (!params.locationId || rating === 0 || !user) {
      errorHaptic();
      toast.error('Tap a star rating before posting');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Upload any photos to storage.
      setUploading(true);
      const uploaded: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const url = await uploadReviewPhoto(user.id, photos[i], i);
        if (url) uploaded.push(url);
      }
      setUploading(false);
      debugLog('write-review.submit', 'photos uploaded', {
        attempted: photos.length,
        succeeded: uploaded.length,
      });

      // 2. Insert the review row + review_photos + menu_item_photos.
      await submitReview({
        location_id: String(params.locationId),
        menu_item_id: params.menuItemId ? String(params.menuItemId) : null,
        rating,
        text: text.trim() || null,
        portion_size: portion,
        worth_the_price: worth,
        mood_tags: [...moods],
        photo_urls: uploaded,
      });
      success();
      toast.success('Review posted!');
      router.back();
    } catch (e: any) {
      errorHaptic();
      toast.error(e?.message ?? 'Could not post review');
      debugLog('write-review.submit', 'error', { message: e?.message });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Write a review</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 24 }}>
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>
            Your rating
          </Text>
          <StarRating value={rating} size={40} onChange={setRating} />
        </View>

        {/* Photos */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
            Add photos — your photo helps others decide!
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {photos.map((uri, i) => (
                <View key={uri + i} style={{ position: 'relative' }}>
                  <Image
                    source={{ uri }}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 12,
                      backgroundColor: colors.surfaceMuted,
                    }}
                  />
                  <Pressable
                    onPress={() => removePhoto(i)}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: colors.text,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
              {photos.length < 6 && (
                <>
                  <Pressable
                    onPress={pickPhotos}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 12,
                      backgroundColor: colors.surfaceMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      borderStyle: 'dashed',
                    }}
                  >
                    <ImagePlus size={22} color={colors.textSecondary} />
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>
                      Library
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={takePhoto}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 12,
                      backgroundColor: colors.surfaceMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      borderStyle: 'dashed',
                    }}
                  >
                    <Camera size={22} color={colors.textSecondary} />
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>
                      Camera
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </ScrollView>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
            Tell others about it
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
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
              placeholderTextColor={colors.textMuted}
              multiline
              style={{ fontSize: 15, color: colors.text, minHeight: 96 }}
            />
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>Portion size</Text>
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
                  backgroundColor: portion === p ? colors.text : colors.surfaceMuted,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: portion === p ? '#FFFFFF' : colors.text,
                    fontWeight: '700',
                  }}
                >
                  {p === 'small' ? 'Small' : p === 'right' ? 'Just right' : 'Generous'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
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
                backgroundColor: worth === true ? colors.success : colors.surfaceMuted,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: worth === true ? '#FFFFFF' : colors.text,
                  fontWeight: '700',
                }}
              >
                Worth it
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
                backgroundColor: worth === false ? colors.danger : colors.surfaceMuted,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: worth === false ? '#FFFFFF' : colors.text,
                  fontWeight: '700',
                }}
              >
                Not really
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>How was it?</Text>
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
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
        }}
      >
        <Button
          label={
            uploading
              ? 'Uploading photos…'
              : submitting
              ? 'Posting…'
              : 'Post review'
          }
          fullWidth
          size="lg"
          loading={submitting}
          disabled={rating === 0 || !params.locationId}
          onPress={onSubmit}
        />
      </View>
    </View>
  );
}
