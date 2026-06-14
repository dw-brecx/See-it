import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

type Kind = 'kosher' | 'halal';

const KIND_STYLES = {
  kosher: { bg: '#2563EB', tag: 'KOSHER' },
  halal: { bg: '#059669', tag: 'HALAL' },
};

/**
 * Small status pill used inline on restaurant cards next to the verified
 * badge. Shows the cert type and (optionally) the agency.
 */
export function CertPill({
  kind,
  agency,
  size = 'sm',
}: {
  kind: Kind;
  agency?: string | null;
  size?: 'sm' | 'md';
}) {
  const s = KIND_STYLES[kind];
  const iconPx = size === 'sm' ? 11 : 14;
  const fontSize = size === 'sm' ? 10.5 : 11.5;
  const padY = size === 'sm' ? 3 : 4;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: s.bg,
        paddingHorizontal: size === 'sm' ? 6 : 8,
        paddingVertical: padY,
        borderRadius: 999,
        alignSelf: 'flex-start',
      }}
      accessibilityLabel={`${s.tag}${agency ? ` ${agency}` : ''}`}
    >
      <ShieldCheck size={iconPx} color="#FFFFFF" strokeWidth={2.5} />
      <Text
        style={{
          color: '#FFFFFF',
          fontSize,
          fontWeight: '800',
          letterSpacing: 0.2,
        }}
      >
        {s.tag}
        {agency ? ` · ${agency}` : ''}
      </Text>
    </View>
  );
}
