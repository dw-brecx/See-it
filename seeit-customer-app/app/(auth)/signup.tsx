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
import { ArrowLeft, Mail, Lock, User } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { error as errorHaptic, success } from '@/lib/utils/haptics';
import { debugLog } from '@/lib/utils/debugLog';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { refresh } = useAuth();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit() {
    setLoading(true);
    setErr(null);
    debugLog('signup', 'submitting', { email, hasName: !!name });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, intended_role: 'customer' } },
    });
    debugLog('signup', 'response', {
      hasSession: !!data?.session,
      userId: data?.user?.id,
      error: error?.message,
    });
    if (error) {
      errorHaptic();
      setErr(error.message);
      setLoading(false);
      return;
    }
    success();
    await refresh();
    // Always send the user to allergy-setup next, regardless of whether
    // a session exists yet. If email confirmation is required, the screen
    // still asks for their preferences (cached in zustand) so we can
    // upsert them when the session lands later.
    router.dismissAll();
    router.replace('/(auth)/allergy-setup');
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
            color: '#1A1A1A',
            letterSpacing: -0.6,
          }}
        >
          Create your account
        </Text>
        <Text style={{ fontSize: 15, color: '#6B7280', marginTop: -8 }}>
          Save spots, review dishes, build order lists with friends.
        </Text>

        <View style={{ gap: 12, marginTop: 8 }}>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            leadingIcon={<User size={18} color="#6B7280" />}
            placeholder="Your name"
            autoCapitalize="words"
          />
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
            leadingIcon={<Lock size={18} color="#6B7280" />}
            placeholder="At least 8 characters"
          />
          {err ? <Text style={{ color: '#EF4444', fontSize: 13 }}>{err}</Text> : null}
        </View>

        <View style={{ marginTop: 4 }}>
          <Button
            label={loading ? 'Creating account…' : 'Create account'}
            fullWidth
            size="lg"
            loading={loading}
            onPress={onSubmit}
          />
        </View>

        <Pressable
          onPress={() => router.replace('/(auth)/signin')}
          hitSlop={8}
          style={{ alignItems: 'center', marginTop: 4 }}
        >
          <Text style={{ color: '#6B7280', fontSize: 14 }}>
            Already have an account?{' '}
            <Text style={{ color: '#E85D3A', fontWeight: '700' }}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
