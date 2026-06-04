import * as React from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

const ITEMS = [
  { key: 'new-review-reply', label: 'New reply on my review' },
  { key: 'new-photo', label: 'New photo on a saved spot' },
  { key: 'newly-verified', label: 'A saved spot got verified ✓' },
  { key: 'promotions', label: 'Promotions & app updates' },
];

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [state, setState] = React.useState<Record<string, boolean>>({
    'new-review-reply': true,
    'new-photo': true,
    'newly-verified': true,
    promotions: false,
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
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>Notifications</Text>
        <View style={{ width: 38 }} />
      </View>
      <View
        style={{
          margin: 20,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        {ITEMS.map((it, i) => (
          <View key={it.key}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <Text style={{ fontSize: 15, color: '#1A1A1A', flex: 1 }}>{it.label}</Text>
              <Switch
                value={!!state[it.key]}
                onValueChange={(v) => setState((s) => ({ ...s, [it.key]: v }))}
                trackColor={{ true: '#E85D3A', false: '#E5E5E0' }}
              />
            </View>
            {i < ITEMS.length - 1 && <View style={{ height: 1, backgroundColor: '#F3F3EE' }} />}
          </View>
        ))}
      </View>
      <Text
        style={{
          paddingHorizontal: 24,
          fontSize: 12,
          color: '#6B7280',
          lineHeight: 18,
        }}
      >
        Push notifications are stubbed for v1. Once we ship to the App Store you'll be prompted to
        allow push at launch; toggles above persist locally for now.
      </Text>
    </View>
  );
}
