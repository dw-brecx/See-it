import * as React from 'react';
import { View, Text, Pressable, Dimensions, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { selection } from '@/lib/utils/haptics';

const SLIDES = [
  {
    title: 'See it before you order it.',
    body: 'Real photos from real customers — know exactly what arrives.',
    emoji: '📸',
  },
  {
    title: 'Real photos. Real reviews.',
    body: 'Every dish has stories from people who actually ate there.',
    emoji: '⭐️',
  },
  {
    title: 'Find dishes, not just restaurants.',
    body: 'Hunt by what you crave — falafel, ramen, pizza, anything.',
    emoji: '🔍',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const width = Dimensions.get('window').width;
  const [idx, setIdx] = React.useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          onPress={() => router.replace('/(public)/(tabs)/home')}
          hitSlop={8}
        >
          <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '600' }}>Skip</Text>
        </Pressable>
      </View>
      <FlatList
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / width);
          if (next !== idx) {
            selection();
            setIdx(next);
          }
        }}
        renderItem={({ item }) => (
          <View
            style={{
              width,
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 32,
            }}
          >
            <View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: '#FDF2EE',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
              }}
            >
              <Text style={{ fontSize: 64 }}>{item.emoji}</Text>
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: '#1A1A1A',
                letterSpacing: -0.6,
                textAlign: 'center',
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: '#6B7280',
                textAlign: 'center',
                lineHeight: 22,
                marginTop: 12,
              }}
            >
              {item.body}
            </Text>
          </View>
        )}
      />
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
          gap: 16,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === idx ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === idx ? '#E85D3A' : '#E5E5E0',
              }}
            />
          ))}
        </View>
        <Button
          label={idx === SLIDES.length - 1 ? 'Get started' : 'Next'}
          fullWidth
          onPress={() => {
            if (idx === SLIDES.length - 1) router.replace('/(public)/(tabs)/home');
            // For a sticky-button experience we don't auto-advance; users swipe themselves.
          }}
        />
      </View>
    </View>
  );
}
