import * as React from 'react';
import { View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Beaker } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const devMode = useAppStore((s) => s.devMode);
  const setDevMode = useAppStore((s) => s.setDevMode);

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
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, gap: 18 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 }}>
          See it.
        </Text>
        <Text style={{ fontSize: 15, color: '#1A1A1A', lineHeight: 22 }}>
          SeeIt is a community of food lovers showing each other what's actually on the plate
          before you order. Real photos, real reviews, real food.
        </Text>

        <View
          style={{
            marginTop: 12,
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Beaker size={18} color="#E85D3A" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1A1A' }}>
                  Developer mode
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 16 }}>
                  Bypass distance filtering — show every brand in the database. Useful for
                  testing seed data without travelling.
                </Text>
              </View>
            </View>
            <Switch
              value={devMode}
              onValueChange={setDevMode}
              trackColor={{ true: '#E85D3A', false: '#E5E5E0' }}
            />
          </View>
        </View>

        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Version 0.1.0</Text>
      </ScrollView>
    </View>
  );
}
