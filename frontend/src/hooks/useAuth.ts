import { useState } from 'react';
import { api } from '../lib/api';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const res = await api.auth.login(email, password); // res is unwrapped { access_token, user }
      setToken(res.access_token);
      return res.access_token;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
  }

  return { token, login, logout, loading };
}