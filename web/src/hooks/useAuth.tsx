'use client';

import { useEffect, useState, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate initial state from client storage
    try {
      setTokenState(authClient.getToken() ?? null);
      setUserState(authClient.getUser() ?? null);
    } catch {}
    setLoading(false);

    // Subscribe to auth changes
    const unsubscribe = authClient.subscribe((state) => {
      setTokenState(state.token ?? null);
      setUserState(state.user ?? null);
    });
    return () => unsubscribe();
  }, []);

  const setToken = useCallback((t: string | null, u?: any | null) => {
    authClient.setAuth(t, u ?? authClient.getUser());
  }, []);

  const setUser = useCallback((u: any | null) => {
    authClient.setAuth(authClient.getToken(), u);
  }, []);

  const logout = useCallback(() => {
    authClient.clear();
    try {
      if (typeof window !== 'undefined') window.location.href = '/';
    } catch {}
  }, []);

  return {
    token,
    user,
    loading,
    setToken,
    setUser,
    logout,
  };
}

export default useAuth;