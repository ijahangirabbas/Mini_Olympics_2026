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
  Medal,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Trophy,
  Settings,
  Mail,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: string;
};

type AdminSidebarProps = {
  userRole: string;
  username: string;
  onLogout: () => void;
};

export default function AdminSidebar({ userRole, username, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      roles: ['super_admin'],
    },
    {
      label: 'Registrations',
      href: '/admin/registrations',
      icon: <Users className="h-4 w-4" />,
      roles: ['super_admin', 'registration_admin'],
    },
    {
      label: 'Inventory',
      href: '/admin/inventory',
      icon: <Package className="h-4 w-4" />,
      roles: ['super_admin', 'inventory_admin'],
    },
    {
      label: 'Finance',
      href: '/admin/finance',
      icon: <Wallet className="h-4 w-4" />,
      roles: ['super_admin', 'finance_admin'],
    },
    {
      label: 'Sport Groups',
      href: '/admin/super',
      icon: <Shield className="h-4 w-4" />,
      roles: ['super_admin', 'hoc_admin'],
    },
    {
      label: 'HOC Scheduling',
      href: '/admin/hoc',
      icon: <Trophy className="h-4 w-4" />,
      roles: ['super_admin', 'hoc_admin'],
    },
    {
      label: 'Email Composer',
      href: '/admin/email',
      icon: <Mail className="h-4 w-4" />,
      roles: ['super_admin'],
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-4 w-4" />,
      roles: ['super_admin'],
    },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      super_admin: { label: 'SUPER ADMIN', color: 'bg-[#F15A29]/15 text-[#F15A29] border border-[#F15A29]/30' },
      registration_admin: { label: 'REGISTRATION', color: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
      inventory_admin: { label: 'INVENTORY', color: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
      hoc_admin: { label: 'HOC OFFICER', color: 'bg-[#D5F05B]/15 text-[#D5F05B] border border-[#D5F05B]/30' },
      finance_admin: { label: 'FINANCE', color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
    };
    return badges[role] || { label: 'ORGANIZER', color: 'bg-white/10 text-white' };
  };

  const roleBadge = getRoleBadge(userRole);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0F1116] border-r border-white/[0.08] text-[#F4F1EA]">
      {/* Brand Header */}
      <div className={`p-4 border-b border-white/[0.08] ${collapsed ? 'px-2' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F15A29] via-[#D5F05B] to-[#101114] p-[1.5px] shrink-0">
            <div className="w-full h-full bg-[#101114] rounded-[10px] flex items-center justify-center">
              <Trophy className="h-4 w-4 text-[#D5F05B]" />
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-sm tracking-wider uppercase font-['Space_Grotesk'] text-[#F4F1EA] truncate">
                MINI OLYMPICS
              </h1>
              <p className="text-[10px] font-mono text-[#D5F05B] tracking-widest uppercase truncate">
                CONTROL TERMINAL
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className={`p-4 border-b border-white/[0.08] bg-[#14161C]/50 ${collapsed ? 'px-2' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D5F05B] text-[#101114] flex items-center justify-center shrink-0 font-bold text-xs font-mono">
            {username.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs text-[#F4F1EA] truncate font-['Space_Grotesk']">{username}</p>
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
                    ? 'bg-[#1C2028] text-[#D5F05B] border border-[#D5F05B]/30 shadow-md font-bold'
                    : 'text-[#A4A5AA] hover:bg-white/[0.04] hover:text-[#F4F1EA]'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <span className={isActive ? 'text-[#D5F05B]' : 'text-[#A4A5AA]'}>
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
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-mono text-[#A4A5AA] hover:text-white hover:bg-white/[0.04] transition-all ${
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
          className={`w-full text-xs font-mono text-[#A4A5AA] hover:text-red-400 hover:bg-red-500/10 justify-start gap-3 rounded-xl ${
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
          onClick={() => setCollapsed(!collapsed)}
          variant="ghost"
          className="w-full text-[#A4A5AA] hover:text-white hover:bg-white/[0.04] justify-center rounded-lg"
          size="sm"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-[#161820] border border-white/[0.1] rounded-xl shadow-xl text-white"
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
        <SidebarContent />
      </aside>
    </>
  );
}
