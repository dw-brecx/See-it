import * as React from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ShieldCheck, Calendar } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';
import { KosherCert } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

const SUB_CERT_LABELS: { key: keyof KosherCert; label: string }[] = [
  { key: 'is_glatt', label: 'Glatt' },
  { key: 'is_cholov_yisroel', label: 'Cholov Yisroel' },
  { key: 'is_pas_yisroel', label: 'Pas Yisroel' },
  { key: 'is_bishul_yisroel', label: 'Bishul Yisroel' },
  { key: 'is_yoshon', label: 'Yoshon' },
  { key: 'is_kosher_for_passover', label: 'Kosher for Passover' },
];

const KOSHER_TYPE_LABELS: Record<string, string> = {
  meat: 'Meat (Fleishig)',
  dairy: 'Dairy (Milchig)',
  pareve: 'Pareve',
  mixed: 'Mixed',
};

export default function KosherSheetScreen() {
  const params = useLocalSearchParams<{ locationId: string }>();
  const locationId = String(params.locationId ?? '');
  const insets = useSafeAreaInsets();

  const { data: cert } = useQuery({
    queryKey: ['kosher', locationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('kosher_certifications')
        .select('*')
        .eq('location_id', locationId)
        .maybeSingle();
      return (data ?? null) as KosherCert | null;
    },
    enabled: !!locationId,
  });

  const activeSubs = SUB_CERT_LABELS.filter((s) => cert?.[s.key] === true);

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'transparentModal' }} />
      <Pressable onPress={() => router.back()} style={{ flex: 1 }} />
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: insets.bottom + 16,
          maxHeight: '85%',
        }}
      >
        <View style={{ alignItems: 'center', paddingTop: 10 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E5E0' }} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#3B82F6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>Certified Kosher</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginTop: 1 }}>
                {cert?.agency_other || cert?.agency || 'Verifying…'}
              </Text>
            </View>
          </View>
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

        <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingTop: 8 }}>
          {cert?.kosher_type && (
            <View
              style={{
                backgroundColor: '#EFF6FF',
                padding: 14,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 28 }}>
                {cert.kosher_type === 'meat'
                  ? '🥩'
                  : cert.kosher_type === 'dairy'
                  ? '🥛'
                  : cert.kosher_type === 'pareve'
                  ? '🥗'
                  : '🍱'}
              </Text>
              <View>
                <Text style={{ fontSize: 12, color: '#1D4ED8', fontWeight: '700' }}>KASHRUS TYPE</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginTop: 2 }}>
                  {KOSHER_TYPE_LABELS[cert.kosher_type] ?? cert.kosher_type}
                </Text>
              </View>
            </View>
          )}

          {activeSubs.length > 0 && (
            <View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                Sub-certifications
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {activeSubs.map((s) => (
                  <Badge key={String(s.key)} label={s.label} variant="info" />
                ))}
              </View>
            </View>
          )}

          {cert?.expiration_date && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 12,
                backgroundColor: '#F3F3EE',
                borderRadius: 12,
              }}
            >
              <Calendar size={18} color="#1A1A1A" />
              <View>
                <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>Valid through</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginTop: 1 }}>
                  {new Date(cert.expiration_date).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          )}

          {cert?.certificate_image_url && (
            <View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                Certificate
              </Text>
              <Image
                source={{ uri: cert.certificate_image_url }}
                style={{ width: '100%', height: 240, borderRadius: 14, backgroundColor: '#F3F3EE' }}
                resizeMode="cover"
              />
            </View>
          )}

          <View
            style={{
              backgroundColor: '#F3F3EE',
              padding: 14,
              borderRadius: 14,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#1A1A1A' }}>
              About kosher certification
            </Text>
            <Text style={{ fontSize: 12.5, color: '#6B7280', marginTop: 4, lineHeight: 18 }}>
              The certifying agency takes responsibility for verifying that ingredients and food
              preparation meet kosher standards. Tap the certificate above to view the full
              hashgacha letter.
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
