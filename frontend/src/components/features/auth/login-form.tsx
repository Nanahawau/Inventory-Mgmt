'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { FormField } from '@/components/ui/form-field';
import React from 'react';

export function LoginForm() {
  const { login, token } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in');
    } catch (err: any) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
      <FormField label="Email">
        <input className="w-full rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>
      <FormField label="Password">
        <input className="w-full rounded border px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </FormField>
      <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
      {token ? <p className="text-xs text-green-700">Token present</p> : null}
    </form>
  );
}