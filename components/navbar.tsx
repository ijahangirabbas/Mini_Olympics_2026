'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight, ShieldCheck, Trophy, Sparkles } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: 'DISCIPLINES', href: '/#games', number: '01' },
    { label: 'CHAMPIONSHIP STATS', href: '/#stats', number: '02' },
    { label: 'WHY COMPETE', href: '/#why', number: '03' },
    { label: 'VERIFY PASS', href: '/verify-cash', number: '04' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#101114]/90 backdrop-blur-xl border-b border-white/[0.08] py-3.5 shadow-2xl shadow-black/60'
            : 'bg-transparent py-5 border-b border-white/[0.04]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Brand Logo & Identity */}
            <Link href="/" className="group flex items-center gap-3.5 text-left">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#F15A29] via-[#D5F05B] to-[#101114] p-[1.5px] transition-transform duration-300 group-hover:scale-105">
                <div className="w-full h-full bg-[#101114] rounded-[10px] flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#D5F05B] transition-colors group-hover:text-white" />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-wider text-[#F4F1EA] font-['Space_Grotesk'] uppercase">
                    MINI OLYMPICS
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-black tracking-widest text-[#101114] bg-[#D5F05B] rounded-sm">
                    2026
                  </span>
                </div>
                <span className="text-[11px] font-medium tracking-widest text-[#A4A5AA] uppercase">
                  FCIT SPORTS SOCIETY • PUCIT
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative flex items-baseline gap-1.5 text-xs font-semibold tracking-wider text-[#A4A5AA] hover:text-[#F4F1EA] transition-colors uppercase font-mono py-1"
                >
                  <span className="text-[10px] text-[#F15A29] opacity-70 group-hover:opacity-100 transition-opacity">
                    {item.number}
                  </span>
                  <span>{item.label}</span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#D5F05B] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Right Side CTAs */}
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wider text-[#A4A5AA] hover:text-[#F4F1EA] hover:bg-white/[0.04] rounded-lg border border-transparent hover:border-white/[0.08] transition-all uppercase font-mono"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#F15A29]" />
                <span>Admin</span>
              </Link>

              <Link
                href="/register"
                className="relative group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black tracking-wider text-[#101114] bg-[#D5F05B] hover:bg-[#c2de4a] transition-all duration-300 uppercase shadow-lg shadow-[#D5F05B]/20 hover:shadow-[#D5F05B]/35 hover:-translate-y-0.5 font-['Space_Grotesk']"
              >
                <span>REGISTER NOW</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex sm:hidden items-center gap-2">
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wider text-[#101114] bg-[#D5F05B]"
              >
                REGISTER
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#F4F1EA] hover:text-[#D5F05B] focus:outline-none"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-[#101114]/95 backdrop-blur-2xl pt-24 px-6 flex flex-col justify-between pb-8 animate-in fade-in duration-200">
          <div className="flex flex-col space-y-6">
            <span className="text-xs font-mono tracking-widest text-[#D5F05B] uppercase">
              // CHAMPIONSHIP NAVIGATION
            </span>
            <div className="flex flex-col space-y-4">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between py-2 text-xl font-bold tracking-wider text-[#F4F1EA] hover:text-[#D5F05B] border-b border-white/[0.06] font-['Space_Grotesk']"
                >
                  <span>{item.label}</span>
                  <span className="text-xs font-mono text-[#F15A29]">{item.number}</span>
                </Link>
              ))}
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Link
                href="/register"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black tracking-wider text-[#101114] bg-[#D5F05B] uppercase font-['Space_Grotesk']"
              >
                <span>ENTER CHAMPIONSHIP (REGISTER)</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>

              <Link
                href="/verify-cash"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold tracking-wider text-[#F4F1EA] bg-[#1B1D21] border border-white/[0.08] uppercase font-mono"
              >
                <span>VERIFY REGISTRATION SLIP</span>
              </Link>

              <Link
                href="/admin/login"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold tracking-wider text-[#A4A5AA] hover:text-white uppercase font-mono"
              >
                <ShieldCheck className="w-4 h-4 text-[#F15A29]" />
                <span>ADMINISTRATOR LOGIN</span>
              </Link>
            </div>
          </div>

          <div className="text-center text-xs font-mono text-[#A4A5AA] border-t border-white/[0.06] pt-4">
            MINI OLYMPICS 2026 • FCIT SPORTS SOCIETY
          </div>
        </div>
      )}
    </>
  );
}
