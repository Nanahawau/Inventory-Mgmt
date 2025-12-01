'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

export type Toast = {
  id: string;
  title?: string;
  message: string;
  tone?: 'info' | 'success' | 'error' | 'warning';
  timeout?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, timeout: 4500, ...t };
    setToasts((prev) => [...prev, toast]);
    if (toast.timeout && toast.timeout > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, toast.timeout);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clear = useCallback(() => setToasts([]), []);

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss, clear }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-3">
        {toasts.map((t) => {
          const tone =
            t.tone === 'success'
              ? 'bg-green-600'
              : t.tone === 'error'
              ? 'bg-red-600'
              : t.tone === 'warning'
              ? 'bg-amber-500'
              : 'bg-slate-700';
          return (
            <div
              key={t.id}
              className={`rounded-lg shadow text-white px-4 py-3 text-sm relative overflow-hidden ${tone}`}
              role="status"
            >
              {t.title && <div className="font-medium mb-0.5">{t.title}</div>}
              <div>{t.message}</div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="absolute top-1 right-1 rounded p-1 text-xs hover:bg-white/20"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}