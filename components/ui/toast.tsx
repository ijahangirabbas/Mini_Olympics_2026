'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info', title?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, variant, title }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const value: ToastContextValue = {
    showToast,
    success: (m, t) => showToast(m, 'success', t),
    error: (m, t) => showToast(m, 'error', t),
    info: (m, t) => showToast(m, 'info', t),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md transition-all ${
              t.variant === 'success'
                ? 'bg-[#0B1124]/95 border-[#10B981]/40 text-[#F8FAFC]'
                : t.variant === 'error'
                  ? 'bg-[#0B1124]/95 border-red-500/40 text-[#F8FAFC]'
                  : 'bg-[#0B1124]/95 border-[#12E2C4]/40 text-[#F8FAFC]'
            }`}
          >
            {t.variant === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-[#10B981] shrink-0 mt-0.5" />
            ) : t.variant === 'error' ? (
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-[#12E2C4] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-xs font-bold uppercase tracking-wider mb-0.5">{t.title}</p>}
              <p className="text-sm text-[#E2E8F0] break-words">{t.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-[#94A3B8] hover:text-white shrink-0 rounded p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}
