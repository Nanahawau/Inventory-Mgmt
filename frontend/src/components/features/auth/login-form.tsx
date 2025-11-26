'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const { login, token } = useAuth(); // your hook provides login() and token
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect when token becomes available
  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
  }, [token, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // If your login returns a response object, capture it
      const result = await login(email, password);

      console.log({ result, token });

      // If login returned a token in result.data.access_token or result.access_token, store it
      const returnedToken = result.access_token || (token ?? null);
      if (returnedToken) {
        try {
          localStorage.setItem('access_token', returnedToken);
        } catch (_) {
          // ignore storage errors
        }
      }

      toast.success('Logged in');
      // If token was set synchronously by the hook or returned above the useEffect will redirect.
      // As a fallback, if token isn't set yet but we got a returnedToken, push manually:
      if (returnedToken && !token) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Login failed', err);
      toast.error(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Password</label>
        <input
          className="w-full rounded border px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <button
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  );
}

export default LoginForm;