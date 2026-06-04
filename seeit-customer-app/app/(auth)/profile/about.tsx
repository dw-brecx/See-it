import * as React from 'react';
import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
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
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>About</Text>
        <View style={{ width: 38 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, gap: 14 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 }}>
          See it.
        </Text>
        <Text style={{ fontSize: 15, color: '#1A1A1A', lineHeight: 22 }}>
          SeeIt is a community of food lovers showing each other what's actually on the plate
          before you order. Real photos, real reviews, real food.
        </Text>
        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 16 }}>Version 0.1.0</Text>
      </ScrollView>
    </View>
  );
}
