import * as React from 'react';
import { Pressable, Text } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { colors } from '@/lib/utils/colors';
import { tapMedium } from '@/lib/utils/haptics';

/**
 * Big terracotta CTA. Stays hardcoded — never themed — so it's always
 * the most prominent button on the storefront. The previous version
 * pulled from the BrandThemeProvider, which on a brand with theme_color
 * set to something cream-ish made the button invisible against the bg.
 */
export function WhatsGoodHereButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tapMedium();
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 56,
        marginHorizontal: 16,
        backgroundColor: pressed ? colors.primaryDark : colors.primary,
        borderRadius: 16,
        shadowColor: colors.primary,
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      })}
    >
      <Sparkles size={18} color="#FFFFFF" strokeWidth={2.4} />
      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: -0.2 }}>
        What's good here?
      </Text>
    </Pressable>
  );
}
