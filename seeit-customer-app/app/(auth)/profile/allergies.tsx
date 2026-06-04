import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { ALLERGIES, DIETARY_TAGS } from '@/lib/utils/constants';
import { fetchPreferences, updatePreferences } from '@/lib/api/userPreferences';
import { useAuth } from '@/lib/hooks/useAuth';
import { success } from '@/lib/utils/haptics';

export default function AllergiesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, refetch } = useQuery({
    queryKey: ['prefs', user?.id],
    queryFn: () => (user ? fetchPreferences(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });
  const [allergies, setAllergies] = React.useState<Set<string>>(new Set());
  const [dietary, setDietary] = React.useState<Set<string>>(new Set());
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (data) {
      setAllergies(new Set(data.allergies ?? []));
      setDietary(new Set(data.dietary_preferences ?? []));
    }
  }, [data]);

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, v: string) {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setter(next);
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      await updatePreferences(user.id, [...allergies], [...dietary]);
      success();
      await refetch();
      router.back();
    } finally {
      setSaving(false);
    }
  }

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
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A1A' }}>Allergies</Text>
        <View style={{ width: 38 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 20 }}>
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Allergies
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ALLERGIES.map((a) => (
              <Chip key={a} label={a} selected={allergies.has(a)} onPress={() => toggle(allergies, setAllergies, a)} />
            ))}
          </View>
        </View>
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Dietary
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
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: '#FAFAF7',
        }}
      >
        <Button label={saving ? 'Saving…' : 'Save'} fullWidth loading={saving} onPress={save} />
      </View>
    </View>
  );
}
