'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/sidebar';
import { ToastProvider } from '@/components/ui/toast';
import { AdminSessionProvider, AdminSessionClient } from '@/lib/admin-session-context';
import { ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionState, setSessionState] = useState<AdminSessionClient>({
    role: 'sub_admin',
    username: '',
    displayName: '',
    permissions: [],
    permissionDetails: {},
    assignedGames: [],
    assignedGender: 'both',
    impersonatedBy: null,
  });
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [exitingImpersonation, setExitingImpersonation] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    setAccessDenied(false);

    fetch('/api/admin/verify', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          const role = data.role || 'sub_admin';
          const effectiveRole = role === 'admin' ? 'super_admin' : role;
          const allowedPages: string[] = Array.isArray(data.permissions) ? data.permissions : [];

          setSessionState({
            role: effectiveRole,
            username: data.username || '',
            displayName: data.displayName || data.username || 'Admin',
            permissions: allowedPages,
            permissionDetails: data.permissionDetails || {},
            assignedGames: Array.isArray(data.assignedGames) ? data.assignedGames : [],
            assignedGender: data.assignedGender || 'both',
            impersonatedBy: data.impersonatedBy || null,
          });

          const hasAccess =
            effectiveRole === 'super_admin' ||
            allowedPages.some((page) => pathname.startsWith(page)) ||
            (pathname.startsWith('/admin/super') && allowedPages.includes('/admin/hoc'));

          if (!hasAccess) {
            const defaultPage = data.defaultPage || allowedPages[0] || '/admin/login';
            if (defaultPage && defaultPage !== pathname) {
              router.push(defaultPage);
            }
            setAccessDenied(true);
          } else {
            setAuthenticated(true);
          }
        } else {
          router.push('/admin/login');
        }
      })
      .catch(() => router.push('/admin/login'))
      .finally(() => setLoading(false));
  }, [router, isLoginPage, pathname]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleExitImpersonation = async () => {
    setExitingImpersonation(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stop: true }),
      });
      if (res.ok) {
        window.location.href = '/admin/permissions';
      }
    } finally {
      setExitingImpersonation(false);
    }
  };

  if (isLoginPage) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080D1C]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-white/10 rounded-full animate-pulse"></div>
            <div className="w-16 h-16 border-2 border-t-[#12E2C4] rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="text-[#94A3B8] font-mono mt-6 text-xs uppercase tracking-widest">AUTHENTICATING TERMINAL...</p>
        </div>
      </div>
    );
  }

  if (!authenticated || accessDenied) {
    return null;
  }

  return (
    <ToastProvider>
      <AdminSessionProvider value={sessionState}>
        <div className="flex min-h-screen bg-[#080D1C] text-[#F8FAFC]">
          <AdminSidebar
            userRole={sessionState.role}
            username={sessionState.displayName}
            permissions={sessionState.permissions}
            onLogout={handleLogout}
          />
          <main className="flex-1 lg:ml-0 min-h-screen overflow-x-hidden bg-[#080D1C] flex flex-col">
            {sessionState.impersonatedBy && (
              <div className="bg-amber-500/15 border-b border-amber-500/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>
                    Impersonating <strong>{sessionState.displayName}</strong> ({sessionState.role}) — Super Admin:{' '}
                    <strong>{sessionState.impersonatedBy}</strong> (logged)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExitImpersonation}
                  disabled={exitingImpersonation}
                  className="px-3 py-1 rounded bg-amber-500 text-[#080D1C] font-semibold hover:bg-amber-400 transition-colors"
                >
                  {exitingImpersonation ? 'Returning...' : 'Exit Impersonation'}
                </button>
              </div>
            )}
            <div className="flex-1">{children}</div>
          </main>
        </div>
      </AdminSessionProvider>
    </ToastProvider>
  );
}
