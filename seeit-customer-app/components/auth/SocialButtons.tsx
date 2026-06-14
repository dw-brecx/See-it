import * as React from 'react';
import { View, Pressable, Text, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/ui/Toast';
import { tapLight, success, error as errorHaptic } from '@/lib/utils/haptics';
import { debugLog } from '@/lib/utils/debugLog';

WebBrowser.maybeCompleteAuthSession();

type Props = { onSuccess?: () => void };

const styles = StyleSheet.create({
  googleBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
});

/** Proper 4-color Google G mark — paths from the official guidelines. */
function GoogleGLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

export function SocialButtons({ onSuccess }: Props) {
  const [appleAvailable, setAppleAvailable] = React.useState(false);
  const [busy, setBusy] = React.useState<'apple' | 'google' | null>(null);

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  async function signInWithApple() {
    tapLight();
    setBusy('apple');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      debugLog('auth.apple', 'got credential', {
        user: credential.user,
        hasIdentityToken: !!credential.identityToken,
      });
      if (!credential.identityToken) throw new Error('No identity token returned from Apple');
      const fullName =
        credential.fullName?.givenName || credential.fullName?.familyName
          ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim()
          : undefined;
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;
      if (fullName) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('users').update({ name: fullName }).eq('id', user.id);
        }
      }
      success();
      toast.success('Welcome');
      onSuccess?.();
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') return;
      errorHaptic();
      debugLog('auth.apple', 'error', { message: e?.message, code: e?.code });
      toast.error(e?.message ?? "Couldn't sign in with Apple");
    } finally {
      setBusy(null);
    }
  }

  async function signInWithGoogle() {
    tapLight();
    setBusy('google');
    try {
      const redirectTo = Linking.createURL('auth-callback');
      debugLog('auth.google', 'starting', { redirectTo });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No auth URL returned');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      debugLog('auth.google', 'browser closed', { type: result.type });
      if (result.type !== 'success') return;
      const url = new URL(result.url.replace('#', '?'));
      const access_token = url.searchParams.get('access_token');
      const refresh_token = url.searchParams.get('refresh_token');
      if (!access_token || !refresh_token) {
        const code = url.searchParams.get('code');
        if (code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr) throw exchErr;
        } else {
          throw new Error('No tokens or code returned');
        }
      } else {
        const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
        if (setErr) throw setErr;
      }
      success();
      toast.success('Welcome');
      onSuccess?.();
    } catch (e: any) {
      errorHaptic();
      debugLog('auth.google', 'error', { message: e?.message });
      toast.error(e?.message ?? "Couldn't sign in with Google");
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={{ gap: 10 }}>
      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={12}
          style={{ height: 50, width: '100%' }}
          onPress={signInWithApple}
        />
      )}
      <Pressable
        onPress={signInWithGoogle}
        disabled={busy === 'google'}
        style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.88 }]}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
      >
        {busy === 'google' ? (
          <ActivityIndicator size="small" color="#1A1A1A" />
        ) : (
          <>
            <GoogleGLogo size={20} />
            <Text style={{ color: '#1A1A1A', fontSize: 15, fontWeight: '700' }}>
              Continue with Google
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
