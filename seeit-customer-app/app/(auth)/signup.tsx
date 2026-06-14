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
import { toast } from '@/components/ui/Toast';
import { colors } from '@/lib/utils/colors';
import { debugLog } from '@/lib/utils/debugLog';

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('already registered')) return 'That email already has an account — sign in instead';
  if (m.includes('password')) return 'Password needs to be at least 8 characters';
  if (m.includes('email')) return "That email doesn't look right";
  return message;
}

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
    debugLog('auth.signup', 'submitting', { email, hasName: !!name });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, intended_role: 'customer' } },
    });
    debugLog('auth.signup', 'response', {
      hasSession: !!data?.session,
      userId: data?.user?.id,
      error: error?.message,
    });
    if (error) {
      errorHaptic();
      setErr(friendlyError(error.message));
      setLoading(false);
      return;
    }
    success();
    if (data.session) {
      // Auto-signed-in — straight into the personalization flow.
      await refresh();
      toast.success("You're in! Let's personalize");
      router.dismissAll();
      router.replace('/(auth)/allergy-setup');
    } else {
      // Email confirmation is required — send them to signin with a toast.
      toast.info('Check your email to confirm your account');
      router.replace('/(auth)/signin');
    }
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
          Create your account
        </Text>
        <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: -8 }}>
          Save spots, review dishes, build order lists with friends.
        </Text>

        <View style={{ gap: 12, marginTop: 8 }}>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            leadingIcon={<User size={18} color={colors.textSecondary} />}
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
            leadingIcon={<Mail size={18} color={colors.textSecondary} />}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leadingIcon={<Lock size={18} color={colors.textSecondary} />}
            placeholder="At least 8 characters"
          />
          {err ? <Text style={{ color: colors.danger, fontSize: 13 }}>{err}</Text> : null}
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
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            Already have an account?{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
