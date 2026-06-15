import * as React from 'react';
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, User, Inbox } from 'lucide-react-native';
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
  if (m.includes('already registered'))
    return 'That email already has an account — sign in instead';
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
  const [awaitingConfirm, setAwaitingConfirm] = React.useState(false);

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
    setLoading(false);
    if (data.session) {
      await refresh();
      toast.success("You're in! Let's personalize");
      router.dismissAll();
      router.replace('/(auth)/allergy-setup');
    } else {
      // Email confirm flow — show the inline confirm panel instead of
      // toast-and-redirect. Users were missing the toast and ending up
      // confused on the signin screen.
      setAwaitingConfirm(true);
    }
  }

  function afterSocial() {
    router.dismissAll();
    router.replace('/(auth)/allergy-setup');
  }

  function openMail() {
    // iOS: opens Mail. Android: opens the inbox via Linking — falls back
    // to default mailto if no handler.
    Linking.openURL(Platform.OS === 'ios' ? 'message://' : 'mailto:').catch(() => {
      void Linking.openURL('mailto:');
    });
  }

  if (awaitingConfirm) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20 }}>
          <Pressable
            onPress={() => router.replace('/(auth)/signin')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
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

        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: insets.bottom + 24,
            justifyContent: 'space-between',
          }}
        >
          <View style={{ alignItems: 'center', gap: 16, marginTop: 40 }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Inbox size={44} color={colors.primary} strokeWidth={2} />
            </View>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '800',
                color: colors.text,
                letterSpacing: -0.5,
                textAlign: 'center',
              }}
            >
              Check your email
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              We sent a confirmation link to{'\n'}
              <Text style={{ color: colors.text, fontWeight: '700' }}>{email}</Text>
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textMuted,
                textAlign: 'center',
                marginTop: 4,
                lineHeight: 18,
              }}
            >
              Tap the link in the email, then come back and sign in.
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <Button label="Open Mail" size="lg" fullWidth onPress={openMail} />
            <Button
              label="Back to sign in"
              size="lg"
              variant="outline"
              fullWidth
              onPress={() => router.replace('/(auth)/signin')}
            />
            <Pressable
              onPress={() => {
                setAwaitingConfirm(false);
                setEmail('');
                setPassword('');
              }}
              hitSlop={8}
              style={{ alignItems: 'center', paddingVertical: 8 }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                Used the wrong email?{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  Try again
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
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
          accessibilityRole="button"
          accessibilityLabel="Back"
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

        <SocialButtons onSuccess={afterSocial} />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginVertical: 4,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600' }}>
            OR EMAIL
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        <View style={{ gap: 12 }}>
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
