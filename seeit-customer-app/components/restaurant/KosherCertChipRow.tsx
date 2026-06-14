import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { KosherCert } from '@/lib/types';
import { colors } from '@/lib/utils/colors';
import { tapLight } from '@/lib/utils/haptics';

/**
 * Inline kosher cert summary. Agency badge + up to 4 sub-cert chips.
 * Once we have more than 2 subs the layout breaks into a second row so
 * the wrap stays even instead of jagged.
 */
export function KosherCertChipRow({
  cert,
  locationId,
}: {
  cert: KosherCert;
  locationId: string;
}) {
  const subs: string[] = [];
  if (cert.is_glatt) subs.push('Glatt');
  if (cert.is_cholov_yisroel) subs.push('Cholov Yisroel');
  if (cert.is_pas_yisroel) subs.push('Pas Yisroel');
  if (cert.is_bishul_yisroel) subs.push('Bishul Yisroel');
  if (cert.is_yoshon) subs.push('Yoshon');
  if (cert.is_kosher_for_passover) subs.push('Pesach');
  const agency = cert.agency_other || cert.agency;

  return (
    <Pressable
      onPress={() => {
        tapLight();
        router.push(`/kosher-sheet/${locationId}`);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Kosher: ${agency}${subs.length ? `, ${subs.join(', ')}` : ''}`}
      style={({ pressed }) => ({
        backgroundColor: colors.primarySoft,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 8,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <ShieldCheck size={14} color={colors.primaryDark} strokeWidth={2.4} />
        <Text style={{ color: colors.primaryDark, fontWeight: '800', fontSize: 12 }}>
          {agency}
        </Text>
        {cert.kosher_type ? (
          <Text style={{ color: colors.primaryDark, fontSize: 11, fontWeight: '600' }}>
            · {cert.kosher_type === 'meat'
              ? 'Meat'
              : cert.kosher_type === 'dairy'
              ? 'Dairy'
              : cert.kosher_type === 'pareve'
              ? 'Pareve'
              : 'Mixed'}
          </Text>
        ) : null}
      </View>
      {subs.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {subs.map((s) => (
            <View
              key={s}
              style={{
                backgroundColor: colors.surface,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600' }}>
                {s}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}
