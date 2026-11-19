'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight, ShieldCheck } from 'lucide-react';
import OlympicRingsIcon from '@/components/olympic-rings-icon';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
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

  // Handle Escape key and body scroll lock for mobile drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'ALL GAMES', href: '/games' },
    { label: 'CHAMPIONSHIP STATS', href: '/#stats' },
    { label: 'WHY COMPETE', href: '/#why' },
    { label: 'VERIFY PASS', href: '/verify-cash' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full overflow-x-clip transition-all duration-300 ${
          scrolled
            ? 'bg-[#0B1124]/90 backdrop-blur-xl border-b border-white/[0.08] py-3.5 shadow-2xl shadow-black/60'
            : 'bg-transparent py-5 border-b border-white/[0.04]'
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 xl:gap-6 min-w-0">
            {/* Brand Logo & Identity */}
            <Link href="/" className="group flex items-center gap-3 xl:gap-3.5 text-left shrink-0">
              <OlympicRingsIcon className="w-11 h-6 shrink-0 transition-transform duration-300 group-hover:scale-105" />

              <div className="flex flex-col whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base xl:text-lg tracking-wide xl:tracking-wider text-[#F8FAFC] font-['Space_Grotesk'] uppercase">
                    MINI OLYMPICS
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-black tracking-widest text-[#0B1124] bg-[#12E2C4] rounded-sm shrink-0">
                    2026
                  </span>
                </div>
                <span className="text-[10px] xl:text-[11px] font-medium tracking-wider xl:tracking-widest text-[#94A3B8] uppercase">
                  FCIT SPORTS SOCIETY • PUCIT
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (Stretched & Fully Shown Without Numbers) */}
            <nav className="hidden lg:flex flex-1 min-w-0 items-center justify-evenly px-2 xl:px-6 gap-3">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative flex items-center whitespace-nowrap shrink-0 text-[11px] xl:text-xs font-semibold tracking-normal xl:tracking-wider text-[#94A3B8] hover:text-[#F8FAFC] transition-colors uppercase font-mono py-1"
                >
                  <span>{item.label}</span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#12E2C4] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Right Side CTAs & Mobile Toggle */}
            <div className="flex items-center gap-2 sm:gap-2.5 xl:gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2 xl:gap-3">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 px-2.5 xl:px-3 py-1.5 text-xs font-medium tracking-wider text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04] rounded-lg border border-transparent hover:border-white/[0.08] transition-all uppercase font-mono"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                  <span>Admin</span>
                </Link>

                <Link
                  href="/register"
                  className="relative group inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 px-3.5 xl:px-5 py-2.5 rounded-lg text-[11px] xl:text-xs font-black tracking-wider text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] transition-all duration-300 uppercase shadow-lg shadow-[#12E2C4]/20 hover:shadow-[#12E2C4]/35 hover:-translate-y-0.5 font-['Space_Grotesk']"
                >
                  <span>REGISTER NOW</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

              {/* Mobile / Tablet Hamburger Button */}
              <div className="flex lg:hidden items-center gap-2">
                <Link
                  href="/register"
                  className="sm:hidden px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wider text-[#0B1124] bg-[#12E2C4] whitespace-nowrap"
                >
                  REGISTER
                </Link>
                <button
                  ref={menuButtonRef}
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-[#F8FAFC] hover:text-[#12E2C4] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#12E2C4] rounded-lg"
                  aria-label="Toggle Navigation"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-nav-drawer"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        id="mobile-nav-drawer"
        aria-hidden={!mobileMenuOpen}
        className={`fixed inset-0 z-40 lg:hidden bg-[#0B1124]/95 backdrop-blur-2xl pt-24 px-6 flex flex-col justify-between pb-8 transition-all duration-200 ease-out motion-reduce:transition-none ${
          mobileMenuOpen
            ? 'opacity-100 translate-y-0 visible pointer-events-auto'
            : 'opacity-0 -translate-y-2 invisible pointer-events-none'
        }`}
      >
          <div className="flex flex-col space-y-6">
            <span className="text-xs font-mono tracking-widest text-[#12E2C4] uppercase">
              // CHAMPIONSHIP NAVIGATION
            </span>
            <div className="flex flex-col space-y-4">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  tabIndex={mobileMenuOpen ? undefined : -1}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-xl font-bold tracking-wider text-[#F8FAFC] hover:text-[#12E2C4] border-b border-white/[0.06] font-['Space_Grotesk']"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#12E2C4]" />
                </Link>
              ))}
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Link
                href="/register"
                tabIndex={mobileMenuOpen ? undefined : -1}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black tracking-wider text-[#0B1124] bg-[#12E2C4] uppercase font-['Space_Grotesk']"
              >
                <span>ENTER CHAMPIONSHIP (REGISTER)</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>

              <Link
                href="/verify-cash"
                tabIndex={mobileMenuOpen ? undefined : -1}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold tracking-wider text-[#F8FAFC] bg-[#182244] border border-white/[0.08] uppercase font-mono"
              >
                <span>VERIFY REGISTRATION SLIP</span>
              </Link>

              <Link
                href="/admin/login"
                tabIndex={mobileMenuOpen ? undefined : -1}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold tracking-wider text-[#94A3B8] hover:text-white uppercase font-mono"
              >
                <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                <span>ADMINISTRATOR LOGIN</span>
              </Link>
            </div>
          </div>

          <div className="text-center text-xs font-mono text-[#94A3B8] border-t border-white/[0.06] pt-4">
            MINI OLYMPICS 2026 • FCIT SPORTS SOCIETY
          </div>
        </div>
    </>
  );
}
