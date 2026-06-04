import * as React from 'react';
import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Gates the auth-only group. signin/signup are not gated (you arrive here to
 * authenticate), but anything else under `(auth)/` requires a session.
 *
 * We DON'T cross-redirect from signin back into (auth) — we just let the
 * screens render. After successful login, screens call router.replace().
 */
export default function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, backgroundColor: '#FAFAF7' }} />;
  // The signin / signup screens are children of this group. We can't redirect
  // away from them just because there's no user — instead each gated screen
  // can call `useAuth()` and bail to signin itself if needed.
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FAFAF7' },
        animation: 'slide_from_bottom',
      }}
    />
  );
}
