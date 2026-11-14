'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/sidebar';

// Define which pages each role can access
const rolePermissions: Record<string, string[]> = {
  super_admin: ['/admin/dashboard', '/admin/registrations', '/admin/inventory', '/admin/finance', '/admin/super', '/admin/hoc', '/admin/email', '/admin/settings', '/admin/esports'],
  registration_admin: ['/admin/registrations'],
  inventory_admin: ['/admin/inventory'],
  hoc_admin: ['/admin/super', '/admin/hoc'],
  finance_admin: ['/admin/finance'],
};

// Get the default redirect page for each role
const roleDefaultPage: Record<string, string> = {
  super_admin: '/admin/dashboard',
  registration_admin: '/admin/registrations',
  inventory_admin: '/admin/inventory',
  hoc_admin: '/admin/hoc',
  finance_admin: '/admin/finance',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Skip layout for login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    fetch('/api/admin/verify')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          // Legacy sessions may return role 'admin' when admin_sessions has no role column
          const role = data.role || 'super_admin';
          const effectiveRole = role === 'admin' ? 'super_admin' : role;
          setUserRole(effectiveRole);
          setUsername(data.username || 'Admin');

          const allowedPages = rolePermissions[effectiveRole] || [];
          const hasAccess = allowedPages.some(page => pathname.startsWith(page));

          if (!hasAccess) {
            const defaultPage = roleDefaultPage[effectiveRole] || '/admin/dashboard';
            router.push(defaultPage);
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

  // Login page doesn't use sidebar layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0B0E]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-white/10 rounded-full animate-pulse"></div>
            <div className="w-16 h-16 border-2 border-t-[#D5F05B] rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="text-[#A4A5AA] font-mono mt-6 text-xs uppercase tracking-widest">AUTHENTICATING TERMINAL...</p>
        </div>
      </div>
    );
  }

  if (!authenticated || accessDenied) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#0A0B0E] text-[#F4F1EA]">
      <AdminSidebar userRole={userRole} username={username} onLogout={handleLogout} />
      <main className="flex-1 lg:ml-0 min-h-screen overflow-x-hidden bg-[#0A0B0E]">
        {children}
      </main>
    </div>
  );
}
