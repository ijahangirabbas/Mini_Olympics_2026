'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Trophy, Mail, ShieldCheck, Heart } from 'lucide-react';

/* Brand SVG Icons */
const IconFacebook = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const IconInstagram = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const IconLinkedIn = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="relative w-full bg-[#0A0B0E] border-t border-white/[0.08] overflow-hidden mt-auto">
      {/* 1. Dramatic Finale Section: READY TO MAKE HISTORY? */}
      <div className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-white/[0.08] overflow-hidden">
        {/* Stadium Floodlight Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#F15A29]/15 via-[#D5F05B]/15 to-transparent rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181B22] border border-white/[0.1] text-xs font-mono text-[#D5F05B] tracking-widest uppercase mb-6 shadow-xl">
            <span>✦ MINI OLYMPICS 2026 ✦ THE PODIUM AWAITS</span>
          </div>

          <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[#F4F1EA] uppercase font-['Space_Grotesk'] leading-[0.92] mb-6">
            READY TO MAKE<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F15A29] via-[#ff8a50] to-[#D5F05B]">
              HISTORY?
            </span>
          </h2>

          <p className="max-w-xl mx-auto text-base sm:text-xl font-mono text-[#A4A5AA] tracking-wider uppercase mb-10">
            YOUR GAME. YOUR TEAM. YOUR MOMENT.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-base sm:text-lg font-black tracking-wider text-[#101114] bg-[#D5F05B] hover:bg-[#c2de4a] transition-all duration-300 uppercase shadow-2xl shadow-[#D5F05B]/30 hover:shadow-[#D5F05B]/50 hover:-translate-y-1 font-['Space_Grotesk']"
            >
              <span>REGISTER FOR MINI OLYMPICS 2026</span>
              <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>

            <Link
              href="/verify-cash"
              className="inline-flex items-center justify-center gap-2 px-7 py-5 rounded-2xl text-sm font-bold tracking-wider text-[#F4F1EA] bg-[#16181F] hover:bg-[#20232B] border border-white/[0.1] transition-all uppercase font-mono"
            >
              <ShieldCheck className="w-4 h-4 text-[#F15A29]" />
              <span>VERIFY REGISTRATION SLIP</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Structured Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F15A29] via-[#D5F05B] to-[#101114] p-[1.5px]">
                <div className="w-full h-full bg-[#101114] rounded-[10px] flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#D5F05B]" />
                </div>
              </div>
              <div>
                <span className="font-black text-xl tracking-wider text-[#F4F1EA] font-['Space_Grotesk'] uppercase block">
                  MINI OLYMPICS 2026
                </span>
                <span className="text-xs font-mono text-[#A4A5AA] tracking-widest uppercase">
                  FCIT SPORTS SOCIETY • PUCIT
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#A4A5AA] max-w-md leading-relaxed font-normal">
              Punjab University College of Information Technology (Old Campus), Lahore. Promoting collegiate athletic excellence, camaraderie, and championship spirit since inception.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com/PucitSSOldCampus/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-[#A4A5AA] hover:text-[#D5F05B] transition-colors"
                title="Facebook"
              >
                <IconFacebook />
              </a>
              <a
                href="https://instagram.com/fcit_oc_sports"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-[#A4A5AA] hover:text-[#D5F05B] transition-colors"
                title="Instagram"
              >
                <IconInstagram />
              </a>
              <a
                href="https://linkedin.com/company/fcit-sports-society-oc/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-[#A4A5AA] hover:text-[#D5F05B] transition-colors"
                title="LinkedIn"
              >
                <IconLinkedIn />
              </a>
              <a
                href="mailto:sports.oc@pucit.edu.pk"
                className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-[#A4A5AA] hover:text-[#D5F05B] transition-colors"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 font-mono text-xs">
            <span className="text-[#D5F05B] font-bold tracking-widest uppercase block mb-4">
              // QUICK LINKS
            </span>
            <ul className="space-y-2.5 text-[#A4A5AA]">
              <li>
                <a href="/#games" className="hover:text-[#F4F1EA] transition-colors">
                  All 50+ Disciplines
                </a>
              </li>
              <li>
                <a href="/#stats" className="hover:text-[#F4F1EA] transition-colors">
                  Tournament Metrics
                </a>
              </li>
              <li>
                <a href="/#why" className="hover:text-[#F4F1EA] transition-colors">
                  Why Compete
                </a>
              </li>
              <li>
                <Link href="/verify-cash" className="hover:text-[#F4F1EA] transition-colors">
                  Verify Registration Pass
                </Link>
              </li>
            </ul>
          </div>

          {/* Administration & Legal */}
          <div className="space-y-3 font-mono text-xs">
            <span className="text-[#F15A29] font-bold tracking-widest uppercase block mb-4">
              // GOVERNANCE
            </span>
            <ul className="space-y-2.5 text-[#A4A5AA]">
              <li>
                <Link href="/admin/login" className="hover:text-[#F4F1EA] transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F15A29]" />
                  <span>Admin Terminal</span>
                </Link>
              </li>
              <li>
                <a href="https://pucit.edu.pk" target="_blank" rel="noopener noreferrer" className="hover:text-[#F4F1EA] transition-colors">
                  PUCIT Official Portal
                </a>
              </li>
              <li>
                <span className="text-[#A4A5AA]/70 block pt-1">
                  Inquiries: sports.oc@pucit.edu.pk
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#A4A5AA]">
          <p>© 2026 FCIT Sports Society • PUCIT Lahore. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed for athletic champions at Old Campus.
          </p>
        </div>
      </div>
    </footer>
  );
}
