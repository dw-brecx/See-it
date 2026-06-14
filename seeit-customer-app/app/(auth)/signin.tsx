import * as React from 'react';
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { error as errorHaptic, success } from '@/lib/utils/haptics';
import { toast } from '@/components/ui/Toast';
import { colors } from '@/lib/utils/colors';
import { debugLog } from '@/lib/utils/debugLog';

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return "Email or password isn't right";
  if (m.includes('email not confirmed'))
    return 'Check your email to confirm your account first';
  if (m.includes('network')) return "We couldn't reach our servers — check your connection";
  return message;
}

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { refresh } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit() {
    setLoading(true);
    setErr(null);
    debugLog('auth.signin', 'signing in', { email });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    debugLog('auth.signin', 'response', {
      hasSession: !!data?.session,
      error: error?.message,
    });
    if (error || !data.session) {
      errorHaptic();
      setErr(friendlyError(error?.message ?? 'Could not sign in'));
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.session.user.id)
      .maybeSingle();
    if (profile && profile.role !== 'customer') {
      await supabase.auth.signOut();
      const which = profile.role === 'admin' ? 'admin' : 'restaurant';
      setErr(`That's a ${which} account. Please use the ${which} dashboard.`);
      setLoading(false);
      return;
    }
    success();
    await refresh();
    toast.success('Welcome back');
    router.dismissAll();
    router.replace('/(public)/(tabs)/home');
  }

  function afterSocial() {
    router.dismissAll();
    router.replace('/(public)/(tabs)/home');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={18} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 32,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: '800',
            color: colors.text,
            letterSpacing: -0.6,
          }}
        >
          Welcome back.
        </Text>
        <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: -8 }}>
          Sign in to keep your saved spots and reviews.
        </Text>

        <SocialButtons onSuccess={afterSocial} />

        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600' }}>
            OR EMAIL
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        <View style={{ gap: 12 }}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            leadingIcon={<Mail size={18} color={colors.textSecondary} />}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            leadingIcon={<Lock size={18} color={colors.textSecondary} />}
            placeholder="••••••••"
          />
          {err ? <Text style={{ color: colors.danger, fontSize: 13 }}>{err}</Text> : null}
        </View>

        <Button
          label={loading ? 'Signing in…' : 'Sign in'}
          fullWidth
          size="lg"
          loading={loading}
          onPress={onSubmit}
        />

        <Pressable
          onPress={() => router.replace('/(auth)/signup')}
          hitSlop={8}
          style={{ alignItems: 'center', marginTop: 4 }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            Don't have an account?{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
