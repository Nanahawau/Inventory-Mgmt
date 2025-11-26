'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function LoginForm() {
  const router = useRouter();
  const { setToken } = useAuth();

  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Call backend via api helper
      const res = await api.auth.login(email, password);

      // Try common token locations and envelopes:
      // - { access_token: '...' }
      // - { token: '...' }
      // - { data: { access_token: '...' } }
      // - { data: { token: '...' } }
      const token =
        (res && (res as any).access_token) ||
        (res && (res as any).token) ||
        (res && (res as any).data && ((res as any).data.access_token || (res as any).data.token)) ||
        null;

      console.log('login response:', res, 'extracted token:', token);

      if (!token) {
        // Surface clear error if backend should return token but didn't
        throw new Error('Login succeeded but no access token was returned.');
      }

      // Persist token via hook (authClient will schedule expiration, subscribers updated)
      setToken(token);

      // Redirect into the app (replace keeps history clean)
      router.replace('/dashboard');
    } catch (err: any) {
      console.error('Login error', err);
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-sm" aria-label="login-form">
      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          required
          className="w-full rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Password</label>
        <input
          type="password"
          required
          className="w-full rounded border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div>
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  );
}