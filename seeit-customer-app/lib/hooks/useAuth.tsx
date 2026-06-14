import * as React from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { AuthUser, UserRole } from '../types';
import { queryClient } from '../queryClient';
import { debugLog } from '../utils/debugLog';

type AuthState = {
  session: Session | null;
  user: AuthUser | null;
  loading: boolean;
};

const AuthContext = React.createContext<
  AuthState & {
    signOut: () => Promise<void>;
    refresh: () => Promise<void>;
  }
>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  refresh: async () => {},
});

async function hydrateUser(session: Session | null): Promise<AuthUser | null> {
  if (!session?.user) return null;
  try {
    const { data } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, phone, role')
      .eq('id', session.user.id)
      .maybeSingle();
    if (!data) {
      debugLog('auth.hydrate', 'user row missing — trigger lag?', {
        id: session.user.id,
      });
      return {
        id: session.user.id,
        email: session.user.email ?? '',
        name: (session.user.user_metadata as any)?.name ?? null,
        avatar_url: null,
        phone: null,
        role: 'customer',
      };
    }
    return data as AuthUser;
  } catch (e: any) {
    debugLog('auth.hydrate', 'caught', { message: e?.message });
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  });

  const refresh = React.useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const user = await hydrateUser(data.session);
    setState({ session: data.session, user, loading: false });
  }, []);

  React.useEffect(() => {
    void refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      debugLog('auth.state', event, { hasSession: !!session });
      const user = await hydrateUser(session);
      setState({ session, user, loading: false });
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const signOut = React.useCallback(async () => {
    debugLog('auth.signout', 'starting');
    await supabase.auth.signOut();
    // Critical: clear every cached query so the next sign-in doesn't
    // briefly render the previous user's saved items / reviews / prefs.
    queryClient.clear();
    setState({ session: null, user: null, loading: false });
    debugLog('auth.signout', 'cleared cache + session');
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}

export function isCustomerAccount(role: UserRole | null | undefined) {
  return role === 'customer' || role == null;
}
