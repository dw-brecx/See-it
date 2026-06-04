import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../brand/ThemeProvider';
import { tapMedium } from '@/lib/utils/haptics';

export function WhatsGoodHereButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
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
        paddingVertical: 16,
        marginHorizontal: 20,
        backgroundColor: theme.accent,
        borderRadius: 16,
        opacity: pressed ? 0.9 : 1,
        shadowColor: theme.accent,
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      })}
    >
      <Sparkles size={18} color="#FFFFFF" />
      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: -0.2 }}>
        What's good here?
      </Text>
    </Pressable>
  );
}
