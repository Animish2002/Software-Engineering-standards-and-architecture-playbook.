import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthenticatedUser } from '@app/shared-types';
import * as authApi from '@/features/auth/api';
import { setAccessToken, setSessionExpiredHandler } from '@/lib/http';
import { clearCache } from '@/lib/api-cache';

type State = { status: 'loading' } | { status: 'anonymous' } | { status: 'authenticated'; session: AuthenticatedUser };

type Ctx = {
  state: State;
  user: AuthenticatedUser['user'] | null;
  permissionKeys: string[];
  signIn: (session: AuthenticatedUser & { accessToken: string }) => void;
  signOut: () => Promise<void>;
};

const CurrentUserContext = createContext<Ctx | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  const signOutLocal = useCallback(() => {
    setAccessToken(null);
    clearCache();
    setState({ status: 'anonymous' });
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(signOutLocal);
    void (async () => {
      const refreshed = await authApi.refresh();           // uses the httpOnly cookie
      if (!refreshed.ok) return setState({ status: 'anonymous' });
      setAccessToken(refreshed.data.accessToken);
      const me = await authApi.me();
      setState(me.ok ? { status: 'authenticated', session: me.data } : { status: 'anonymous' });
    })();
  }, [signOutLocal]);

  const value = useMemo<Ctx>(() => ({
    state,
    user: state.status === 'authenticated' ? state.session.user : null,
    permissionKeys: state.status === 'authenticated' ? state.session.permissionKeys : [],
    signIn: ({ accessToken, ...session }) => { setAccessToken(accessToken); setState({ status: 'authenticated', session }); },
    signOut: async () => { await authApi.logout(); signOutLocal(); },
  }), [state, signOutLocal]);

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error('useCurrentUser must be used within CurrentUserProvider');
  return ctx;
}
