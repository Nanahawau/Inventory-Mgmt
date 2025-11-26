'use client';

import { useEffect, useState, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';

export type AuthUser = {
  id?: number | string;
  email?: string;
  name?: string;
  // add other fields your backend returns
} | null;

const USER_KEY = 'auth_user';

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(() => authClient.getToken());
  const [user, setUserState] = useState<AuthUser>(() => {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const unsub = authClient.subscribe((t) => setTokenState(t));
    return () => unsub();
  }, []);

  const setToken = useCallback((t: string | null) => {
    authClient.setToken(t);
  }, []);

  const setUser = useCallback((u: AuthUser) => {
    try {
      if (u) {
        sessionStorage.setItem(USER_KEY, JSON.stringify(u));
      } else {
        sessionStorage.removeItem(USER_KEY);
      }
    } catch {
      // ignore storage failures
    }
    setUserState(u);
  }, []);

  const logout = useCallback(() => {
    authClient.clearToken();
    try {
      sessionStorage.removeItem(USER_KEY);
    } catch {}
    setUserState(null);
    try {
      // redirect to login/root
      window.location.href = '/';
    } catch {}
  }, []);

  return {
    token,
    setToken,
    user,
    setUser,
    logout,
  };
}

export default useAuth;