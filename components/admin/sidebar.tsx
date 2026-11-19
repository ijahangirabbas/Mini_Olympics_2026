'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Wallet,
  Users,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
  Mail,
  Home,
  KeyRound,
  ClipboardList,
  Gamepad2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { OlympicRingsIcon } from '@/components/olympic-rings-icon';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type AdminSidebarProps = {
  userRole: string;
  username: string;
  permissions: string[];
  onLogout: () => void;
};

function getRoleBadge(role: string) {
  const badges: Record<string, { label: string; color: string }> = {
    super_admin: { label: 'SUPER ADMIN', color: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30' },
    sub_admin: { label: 'SUB ADMIN', color: 'bg-[#12E2C4]/15 text-[#12E2C4] border border-[#12E2C4]/30' },
    coordinator: { label: 'COORDINATOR', color: 'bg-[#F068B1]/15 text-[#F068B1] border border-[#F068B1]/30' },
    registration_admin: { label: 'REGISTRATION', color: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30' },
    inventory_admin: { label: 'INVENTORY', color: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
    hoc_admin: { label: 'HOC OFFICER', color: 'bg-[#12E2C4]/15 text-[#12E2C4] border border-[#12E2C4]/30' },
    finance_admin: { label: 'FINANCE', color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  };
  return badges[role] || { label: 'ORGANIZER', color: 'bg-white/10 text-white' };
}

type AdminSidebarContentProps = {
  pathname: string;
  collapsed: boolean;
  username: string;
  roleBadge: { label: string; color: string };
  filteredNavItems: NavItem[];
  onToggleCollapse: () => void;
  onLogout: () => void;
};

function AdminSidebarContent({
  pathname,
  collapsed,
  username,
  roleBadge,
  filteredNavItems,
  onToggleCollapse,
  onLogout,
}: AdminSidebarContentProps) {
  return (
    <div className="flex flex-col h-full bg-[#0D132B] border-r border-white/[0.08] text-[#F8FAFC]">
      {/* Brand Header */}
      <div className={`p-4 border-b border-white/[0.08] ${collapsed ? 'px-2' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] via-[#12E2C4] to-[#0B1124] p-[1.5px] shrink-0">
            <div className="w-full h-full bg-[#0B1124] rounded-[10px] flex items-center justify-center px-1">
              <OlympicRingsIcon className="w-7 h-4" />
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-sm tracking-wider uppercase font-['Space_Grotesk'] text-[#F8FAFC] truncate">
                MINI OLYMPICS
              </h1>
              <p className="text-[10px] font-mono text-[#12E2C4] tracking-widest uppercase truncate">
                CONTROL TERMINAL
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className={`p-4 border-b border-white/[0.08] bg-[#131B38]/60 ${collapsed ? 'px-2' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#12E2C4] text-[#0B1124] flex items-center justify-center shrink-0 font-bold text-xs font-mono">
            {username.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs text-[#F8FAFC] truncate font-['Space_Grotesk']">{username}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest ${roleBadge.color} mt-0.5`}>
                {roleBadge.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-mono text-xs ${
                  isActive
                    ? 'bg-[#182244] text-[#12E2C4] border border-[#12E2C4]/35 shadow-md font-bold'
                    : 'text-[#94A3B8] hover:bg-white/[0.04] hover:text-[#F8FAFC]'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <span className={isActive ? 'text-[#12E2C4]' : 'text-[#94A3B8]'}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-white/[0.06]">
          <Link href="/">
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-mono text-[#94A3B8] hover:text-white hover:bg-white/[0.04] transition-all ${
                collapsed ? 'justify-center px-2' : ''
              }`}
            >
              <Home className="h-4 w-4" />
              {!collapsed && <span>View Main Website</span>}
            </div>
          </Link>
        </div>
      </nav>

      {/* Footer / Logout */}
      <div className={`p-3 border-t border-white/[0.08] ${collapsed ? 'px-2' : ''}`}>
        <Button
          onClick={onLogout}
          variant="ghost"
          className={`w-full text-xs font-mono text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 justify-start gap-3 rounded-xl ${
            collapsed ? 'px-2 justify-center' : ''
          }`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Disconnect Session</span>}
        </Button>
      </div>

      {/* Desktop Collapse Toggle */}
      <div className="hidden lg:block p-2 border-t border-white/[0.06]">
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          className="w-full text-[#94A3B8] hover:text-white hover:bg-white/[0.04] justify-center rounded-lg"
          size="sm"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function AdminSidebar({ userRole, username, permissions, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: 'Registrations',
      href: '/admin/registrations',
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: 'Coordinator Portal',
      href: '/admin/coordinator',
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      label: 'HOC Scheduling',
      href: '/admin/hoc',
      icon: <OlympicRingsIcon className="h-3.5 w-5" />,
    },
    {
      label: 'Sport Groups',
      href: '/admin/super',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      label: 'Inventory',
      href: '/admin/inventory',
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: 'Finance',
      href: '/admin/finance',
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: 'Email Composer',
      href: '/admin/email',
      icon: <Mail className="h-4 w-4" />,
    },
    {
      label: 'Esports Arena',
      href: '/admin/esports',
      icon: <Gamepad2 className="h-4 w-4" />,
    },
    {
      label: 'Permissions & Users',
      href: '/admin/permissions',
      icon: <KeyRound className="h-4 w-4" />,
    },
    {
      label: 'Settings & Games',
      href: '/admin/settings',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const filteredNavItems =
    userRole === 'super_admin'
      ? navItems
      : navItems.filter((item) => permissions.includes(item.href));

  const roleBadge = getRoleBadge(userRole);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-[#131B38] border border-white/[0.1] rounded-xl shadow-xl text-white"
        aria-label="Toggle Navigation"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 transition-all duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        <AdminSidebarContent
          pathname={pathname}
          collapsed={collapsed}
          username={username}
          roleBadge={roleBadge}
          filteredNavItems={filteredNavItems}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onLogout={onLogout}
        />
      </aside>
    </>
  );
}
