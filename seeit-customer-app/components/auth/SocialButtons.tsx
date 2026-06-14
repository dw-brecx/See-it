import * as React from 'react';
import { Pressable, Text, View, Platform, ActivityIndicator } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase/client';
import { colors } from '@/lib/utils/colors';
import { toast } from '@/components/ui/Toast';
import { tapLight, success, error as errorHaptic } from '@/lib/utils/haptics';
import { debugLog } from '@/lib/utils/debugLog';

WebBrowser.maybeCompleteAuthSession();

type Props = { onSuccess?: () => void };

/**
 * Apple + Google sign-in row. Apple uses the native button via
 * expo-apple-authentication (iOS 13+). Google uses Supabase OAuth via
 * expo-web-browser — opens the system browser, returns to a custom
 * `seeit://auth-callback` redirect that the AuthProvider's
 * onAuthStateChange listener picks up.
 *
 * To actually work in production you need:
 *   1. Supabase → Auth → Providers → enable Apple + Google
 *   2. Apple Service ID + private key wired into Supabase Auth
 *   3. Google OAuth Client ID (iOS + Android + Web) wired into Supabase
 *   4. EAS Build (not Expo Go) — Apple Sign In requires the entitlement
 *      and native module; Google works in Expo Go via system browser.
 */
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
      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple');
      }
      const fullName =
        credential.fullName?.givenName || credential.fullName?.familyName
          ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim()
          : undefined;
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;
      // Apple only returns name on the very first sign-in — persist if so.
      if (fullName) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('users')
            .update({ name: fullName })
            .eq('id', user.id);
        }
      }
      success();
      toast.success('Welcome');
      onSuccess?.();
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') {
        // user backed out, no toast
        return;
      }
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
      if (result.type !== 'success') {
        // user cancelled
        return;
      }
      // Parse the access_token / refresh_token out of the callback URL.
      const url = new URL(result.url.replace('#', '?'));
      const access_token = url.searchParams.get('access_token');
      const refresh_token = url.searchParams.get('refresh_token');
      if (!access_token || !refresh_token) {
        // PKCE flow returns a `code` — let Supabase exchange it.
        const code = url.searchParams.get('code');
        if (code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr) throw exchErr;
        } else {
          throw new Error('No tokens or code returned');
        }
      } else {
        const { error: setErr } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
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
        style={({ pressed }) => ({
          height: 50,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          opacity: pressed ? 0.9 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
      >
        {busy === 'google' ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <>
            <GoogleIcon />
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
              Continue with Google
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

/** Inline G-mark — multi-color version, no extra image deps. */
function GoogleIcon() {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '900', color: '#4285F4' }}>G</Text>
    </View>
  );
}
