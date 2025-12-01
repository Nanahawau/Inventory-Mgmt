import LoginForm from '@/components/features/auth/login-form';
import React from 'react';

export default function HomePage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Inventory Frontend</h1>
      <LoginForm />
    </section>
  );
}