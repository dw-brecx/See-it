import * as React from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { AuthUser, UserRole } from '../types';

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
  const { data } = await supabase
    .from('users')
    .select('id, email, name, avatar_url, phone, role')
    .eq('id', session.user.id)
    .maybeSingle();
  if (!data) {
    // Row might not be there yet (trigger lag) — fall back to auth user.
    return {
      id: session.user.id,
      email: session.user.email ?? '',
      name: null,
      avatar_url: null,
      phone: null,
      role: 'customer',
    };
  }
  return data as AuthUser;
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
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const user = await hydrateUser(session);
      setState({ session, user, loading: false });
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setState({ session: null, user: null, loading: false });
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

/** Customer-app-only: non-customer roles get routed away. */
export function isCustomerAccount(role: UserRole | null | undefined) {
  return role === 'customer' || role == null;
}
