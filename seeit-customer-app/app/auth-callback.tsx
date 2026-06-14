import * as React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { colors } from '@/lib/utils/colors';

/**
 * OAuth callback landing. Supabase's onAuthStateChange will fire once
 * the session is set (handled by SocialButtons) — when it does, the
 * AuthProvider state flips and we route to home.
 */
export default function AuthCallback() {
  const { session, loading } = useAuth();

  React.useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace('/(public)/(tabs)/home');
      } else {
        router.replace('/(auth)/signin');
      }
    }
  }, [session, loading]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Signing you in…</Text>
    </View>
  );
}
