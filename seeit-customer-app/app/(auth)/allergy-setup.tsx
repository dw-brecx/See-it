import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import {
  ALLERGIES,
  DIETARY_TAGS,
  CUISINE_GROUPS,
} from '@/lib/utils/constants';
import { useAuth } from '@/lib/hooks/useAuth';
import { updatePreferences } from '@/lib/api/userPreferences';
import { success, tapLight } from '@/lib/utils/haptics';
import { useAppStore } from '@/lib/store';

type Step = 'allergies' | 'dietary' | 'cuisines';
const STEPS: Step[] = ['allergies', 'dietary', 'cuisines'];

export default function AllergySetupScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const setFilters = useAppStore((s) => s.setFilters);
  const [step, setStep] = React.useState<Step>('allergies');
  const [allergies, setAllergies] = React.useState<Set<string>>(new Set());
  const [dietary, setDietary] = React.useState<Set<string>>(new Set());
  const [cuisines, setCuisines] = React.useState<Set<string>>(new Set());
  const [saving, setSaving] = React.useState(false);

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  async function finish(skip?: boolean) {
    if (!user || skip) {
      // Even on skip, persist whatever was chosen so far so we don't lose
      // the picks if the user later signs in mid-flow.
      if (user && !skip) {
        try {
          await updatePreferences(user.id, [...allergies], [...dietary]);
        } catch {
          /* non-fatal */
        }
      }
      // Cuisines feed into search filters for personalisation, even
      // anonymous-style.
      if (cuisines.size > 0) setFilters({ cuisines: [...cuisines] });
      router.dismissAll();
      router.replace('/(public)/(tabs)/home');
      return;
    }
    setSaving(true);
    try {
      await updatePreferences(user.id, [...allergies], [...dietary]);
      if (cuisines.size > 0) setFilters({ cuisines: [...cuisines] });
      success();
    } finally {
      setSaving(false);
      router.dismissAll();
      router.replace('/(public)/(tabs)/home');
    }
  }

  function next() {
    tapLight();
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
    else void finish(false);
  }
  function back() {
    tapLight();
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
  }

  const isLast = step === STEPS[STEPS.length - 1];
  const stepIdx = STEPS.indexOf(step);

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          paddingBottom: 8,
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: '#FDF2EE',
            borderRadius: 999,
            alignSelf: 'flex-start',
          }}
        >
          <Sparkles size={12} color="#E85D3A" />
          <Text style={{ fontSize: 11.5, color: '#E85D3A', fontWeight: '700' }}>
            HELPS US PERSONALIZE YOUR FEED
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: i <= stepIdx ? '#E85D3A' : '#E5E5E0',
              }}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 32,
          gap: 16,
        }}
      >
        {step === 'allergies' && (
          <>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 }}>
              Any allergies?
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: -8, lineHeight: 20 }}>
              We'll show a warning on dishes that don't carry the matching safe-tag. Pick any
              that apply — you can change these anytime in Profile.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {ALLERGIES.map((a) => (
                <Chip
                  key={a}
                  label={a}
                  selected={allergies.has(a)}
                  onPress={() => toggle(allergies, setAllergies, a)}
                />
              ))}
            </View>
          </>
        )}

        {step === 'dietary' && (
          <>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 }}>
              How do you eat?
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: -8, lineHeight: 20 }}>
              We'll surface spots and dishes that fit. Pick anything that matters to you.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {DIETARY_TAGS.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  selected={dietary.has(d)}
                  onPress={() => toggle(dietary, setDietary, d)}
                />
              ))}
            </View>
          </>
        )}

        {step === 'cuisines' && (
          <>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 }}>
              Favorite cuisines?
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: -8, lineHeight: 20 }}>
              We'll bump these up in your feed and search. Don't worry, you'll see everything else
              too.
            </Text>
            {CUISINE_GROUPS.map((group) => (
              <View key={group.label} style={{ marginTop: 10, gap: 8 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {group.label}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {group.options.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={cuisines.has(c)}
                      onPress={() => toggle(cuisines, setCuisines, c)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
          backgroundColor: '#FAFAF7',
          gap: 8,
          borderTopWidth: 1,
          borderTopColor: '#F3F3EE',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {stepIdx > 0 && (
            <View style={{ flex: 0 }}>
              <Button label="Back" variant="outline" size="lg" onPress={back} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Button
              label={isLast ? (saving ? 'Saving…' : "I'm done") : 'Continue'}
              fullWidth
              size="lg"
              loading={isLast && saving}
              onPress={next}
            />
          </View>
        </View>
        <Pressable
          onPress={() => finish(true)}
          hitSlop={8}
          style={{ alignItems: 'center', paddingVertical: 6 }}
        >
          <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '600' }}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}
