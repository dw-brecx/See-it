import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { KosherCert } from '@/lib/types';
import { colors } from '@/lib/utils/colors';
import { tapLight } from '@/lib/utils/haptics';

/**
 * Inline summary of a location's kosher cert — the agency badge on the left
 * (terracotta-on-cream), then up to 3 small sub-cert chips ("Glatt",
 * "Cholov Yisroel", etc.) on the right. Whole row is a single tap target
 * that opens the full hashgacha bottom sheet.
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
  const shownSubs = subs.slice(0, 3);
  const overflow = subs.length - shownSubs.length;
  const agency = cert.agency_other || cert.agency;

  return (
    <Pressable
      onPress={() => {
        tapLight();
        router.push(`/kosher-sheet/${locationId}`);
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: colors.primarySoft,
        borderRadius: 999,
        opacity: pressed ? 0.85 : 1,
        alignSelf: 'flex-start',
        flexWrap: 'wrap',
        maxWidth: '100%',
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <ShieldCheck size={14} color={colors.primaryDark} strokeWidth={2.4} />
        <Text style={{ color: colors.primaryDark, fontWeight: '800', fontSize: 12 }}>
          {agency}
        </Text>
      </View>
      {shownSubs.map((s) => (
        <View
          key={s}
          style={{
            backgroundColor: colors.surface,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 11, fontWeight: '600' }}>{s}</Text>
        </View>
      ))}
      {overflow > 0 && (
        <Text style={{ color: colors.primaryDark, fontSize: 11, fontWeight: '700' }}>
          +{overflow}
        </Text>
      )}
    </Pressable>
  );
}
