import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { ALLERGIES, DIETARY_TAGS } from '@/lib/utils/constants';
import { useAuth } from '@/lib/hooks/useAuth';
import { updatePreferences } from '@/lib/api/userPreferences';
import { success } from '@/lib/utils/haptics';

export default function AllergySetupScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [allergies, setAllergies] = React.useState<Set<string>>(new Set());
  const [dietary, setDietary] = React.useState<Set<string>>(new Set());
  const [saving, setSaving] = React.useState(false);

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  async function save(skip?: boolean) {
    if (!user || skip) {
      router.dismissAll();
      router.replace('/(public)/(tabs)/home');
      return;
    }
    setSaving(true);
    try {
      await updatePreferences(user.id, [...allergies], [...dietary]);
      success();
    } finally {
      setSaving(false);
      router.dismissAll();
      router.replace('/(public)/(tabs)/home');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingHorizontal: 24,
          paddingBottom: 32,
          gap: 20,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 }}>
          Tell us what to watch out for
        </Text>
        <Text style={{ fontSize: 14, color: '#6B7280', marginTop: -10, lineHeight: 20 }}>
          We'll warn you on dishes that don't carry the safe-tag. You can change these anytime
          in Profile.
        </Text>

        <View style={{ gap: 12, marginTop: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Allergies
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ALLERGIES.map((a) => (
              <Chip key={a} label={a} selected={allergies.has(a)} onPress={() => toggle(allergies, setAllergies, a)} />
            ))}
          </View>
        </View>

        <View style={{ gap: 12, marginTop: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Dietary preferences
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DIETARY_TAGS.map((d) => (
              <Chip key={d} label={d} selected={dietary.has(d)} onPress={() => toggle(dietary, setDietary, d)} />
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
          backgroundColor: '#FAFAF7',
          gap: 8,
        }}
      >
        <Button
          label={saving ? 'Saving…' : 'Save preferences'}
          fullWidth
          loading={saving}
          onPress={() => save(false)}
        />
        <Pressable onPress={() => save(true)} hitSlop={8} style={{ alignItems: 'center' }}>
          <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '600' }}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}
