import React from 'react';
import { ReactNode } from 'react';

type Props = {
  label: string;
  children: ReactNode;
  error?: string;
};

export function FormField({ label, children, error }: Props) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}