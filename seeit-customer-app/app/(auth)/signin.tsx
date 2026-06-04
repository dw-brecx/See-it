import * as React from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { error as errorHaptic } from '@/lib/utils/haptics';

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      errorHaptic();
      setErr(error?.message ?? 'Could not sign in');
      setLoading(false);
      return;
    }
    // Block non-customer roles
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.session.user.id)
      .maybeSingle();
    if (profile && profile.role !== 'customer') {
      await supabase.auth.signOut();
      setErr(
        `Your account is a ${profile.role.replace('_', ' ')} account. Please use the ${
          profile.role === 'admin' ? 'admin' : 'restaurant'
        } dashboard.`,
      );
      setLoading(false);
      return;
    }
    await refresh();
    router.dismissAll();
    router.replace('/(public)/(tabs)/profile');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FAFAF7' }}
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
            backgroundColor: '#F3F3EE',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={18} color="#1A1A1A" />
        </Pressable>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 16 }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.6 }}>
          Welcome back.
        </Text>
        <Text style={{ fontSize: 15, color: '#6B7280', marginTop: -8 }}>
          Sign in to keep your saved spots and reviews.
        </Text>

        <View style={{ gap: 12, marginTop: 12 }}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            leadingIcon={<Mail size={18} color="#6B7280" />}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            leadingIcon={<Lock size={18} color="#6B7280" />}
            placeholder="••••••••"
          />
          {err ? <Text style={{ color: '#EF4444', fontSize: 13 }}>{err}</Text> : null}
        </View>

        <Button
          label={loading ? 'Signing in…' : 'Sign in'}
          fullWidth
          loading={loading}
          onPress={onSubmit}
        />

        <Pressable
          onPress={() => router.replace('/(auth)/signup')}
          hitSlop={8}
          style={{ alignItems: 'center', marginTop: 4 }}
        >
          <Text style={{ color: '#6B7280', fontSize: 14 }}>
            Don't have an account?{' '}
            <Text style={{ color: '#E85D3A', fontWeight: '700' }}>Sign up</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
