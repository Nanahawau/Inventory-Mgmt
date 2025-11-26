'use client';

import { useEffect, useState, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(() => authClient.getToken() ?? null);
  const [user, setUserState] = useState<any | null>(() => authClient.getUser() ?? null);

  useEffect(() => {
    const unsubscribe = authClient.subscribe((state) => {
      setTokenState(state.token ?? null);
      setUserState(state.user ?? null);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const setToken = useCallback((t: string | null, u?: any | null) => {
    authClient.setAuth(t, u ?? authClient.getUser());
  }, []);

  const setUser = useCallback((u: any | null) => {
    authClient.setAuth(authClient.getToken(), u);
  }, []);

  const logout = useCallback(() => {
    authClient.clear();
    try { if (typeof window !== 'undefined') window.location.href = '/'; } catch {}
  }, []);

  return {
    token,
    user,
    setToken,
    setUser,
    logout,
  };
}

export default useAuth;