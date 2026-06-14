import * as React from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { error as errorHaptic, success, tapLight } from '@/lib/utils/haptics';

function SocialButton({
  label,
  onPress,
  variant,
}: {
  label: string;
  onPress: () => void;
  variant: 'apple' | 'google';
}) {
  const isApple = variant === 'apple';
  return (
    <Pressable
      onPress={() => {
        tapLight();
        onPress();
      }}
      style={({ pressed }) => ({
        height: 50,
        borderRadius: 12,
        backgroundColor: isApple ? '#000000' : '#FFFFFF',
        borderWidth: isApple ? 0 : 1,
        borderColor: '#E5E5E0',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ fontSize: 18, color: isApple ? '#FFFFFF' : '#1A1A1A' }}>
        {isApple ? '' : 'G'}
      </Text>
      <Text
        style={{
          color: isApple ? '#FFFFFF' : '#1A1A1A',
          fontSize: 15,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, intended_role: 'customer' },
      },
    });
    if (error) {
      errorHaptic();
      setErr(error.message);
      setLoading(false);
      return;
    }
    success();
    await refresh();
    // If email confirmation is required there's no session yet — still route
    // to allergy-setup so they can fill in preferences while waiting; the
    // allergy-setup screen handles the unauthed case by routing to home.
    router.dismissAll();
    router.replace(data.session ? '/(auth)/allergy-setup' : '/(auth)/allergy-setup');
  }

  function comingSoon() {
    setErr('Apple & Google sign-in coming soon — use email for now.');
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
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 32, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.6 }}>
          Create your account
        </Text>
        <Text style={{ fontSize: 15, color: '#6B7280', marginTop: -8 }}>
          Save spots, review dishes, build order lists with friends.
        </Text>

        <View style={{ gap: 10, marginTop: 8 }}>
          <SocialButton
            label="Continue with Apple"
            onPress={comingSoon}
            variant="apple"
          />
          <SocialButton
            label="Continue with Google"
            onPress={comingSoon}
            variant="google"
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5E0' }} />
          <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>
            OR USE EMAIL
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5E0' }} />
        </View>

        <View style={{ gap: 12 }}>
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

        <Button
          label={loading ? 'Creating account…' : 'Create account'}
          fullWidth
          size="lg"
          loading={loading}
          onPress={onSubmit}
        />

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
