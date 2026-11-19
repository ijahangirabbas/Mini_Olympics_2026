'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { QrCode, Users2, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { OlympicRingsIcon } from '@/components/olympic-rings-icon';

export default function WhyCompete() {
  const [inView, setInView] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (gridRef.current) {
      observer.observe(gridRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const pillars = [
    {
      id: 'glory',
      title: 'CHAMPIONSHIP GLORY & HONORS',
      tagline: 'OFFICIAL TROPHIES, PODIUM FINISHES & MEDALS',
      highlightColor: '#F59E0B',
      number: '01',
      badgeText: 'PODIUM AWARDS',
      icon: <OlympicRingsIcon className="w-8 h-5" />,
    },
    {
      id: 'digital',
      title: 'INSTANT QR VERIFICATION PASS',
      tagline: 'SEAMLESS REGISTRATION & LIVE STATUS LOOKUP',
      highlightColor: '#12E2C4',
      number: '02',
      badgeText: 'PAPERLESS TECH',
      icon: <QrCode className="w-6 h-6 text-[#12E2C4]" />,
    },
    {
      id: 'fixtures',
      title: 'HEAD OF COMPETITION (HOC) ENGINE',
      tagline: 'OFFICIAL KNOCKOUTS & ROUND-ROBIN BRACKETS',
      highlightColor: '#3B82F6',
      number: '03',
      badgeText: 'FAIR PLAY SYSTEM',
      icon: <ShieldCheck className="w-6 h-6 text-[#3B82F6]" />,
    },
    {
      id: 'culture',
      title: 'UNRIVALED CAMPUS SPIRIT',
      tagline: 'ACROSS CS, SE, IT & DATA SCIENCE BATCHES',
      highlightColor: '#FFD700',
      number: '04',
      badgeText: 'COLLEGIATE ENERGY',
      icon: <Users2 className="w-6 h-6 text-[#FFD700]" />,
    },
  ];

  return (
    <section id="why" className="relative w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#0B1124] overflow-hidden">
      {/* FCIT Sports Society Ambient Backdrop */}
      <div aria-hidden="true" className="pointer-events-none select-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 left-1/4 w-[34rem] h-[34rem] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(18,226,196,0.28) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.28) 0%, transparent 70%)' }}
        />

        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center whitespace-nowrap">
          <span className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[0.22em] uppercase text-white/[0.03] font-['Space_Grotesk']">
            FCIT SPORTS SOCIETY
          </span>
          <span className="mt-3 text-xs sm:text-sm font-mono tracking-[0.45em] uppercase text-[#12E2C4]/[0.08]">
            PUCIT • OLD CAMPUS • MINI OLYMPICS 2026
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Headline + FOC Sports Society Visual Above Cards */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-14 sm:mb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#182244] border border-white/[0.08] text-xs font-mono text-[#12E2C4] uppercase tracking-wider mb-3">
              <span>// THE MINI OLYMPICS ADVANTAGE</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-[#F8FAFC] uppercase font-['Space_Grotesk'] leading-[0.95]">
              BUILT FOR ATHLETES.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#12E2C4]">
                ORGANIZED FOR EXCELLENCE.
              </span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#94A3B8] leading-relaxed">
              We overhauled the entire sports tournament experience so you can focus on performance. Transparent brackets, rapid verification, and tournament-grade equipment.
            </p>
          </div>

          <div aria-hidden="true" className="pointer-events-none select-none flex items-center justify-center lg:justify-end shrink-0">
            <img
              src="/images/foc-logo.png"
              alt=""
              className="w-60 sm:w-72 lg:w-80 h-auto object-contain opacity-45"
            />
          </div>
        </div>

        {/* 4 Connected Visual Pillars: 2 Above, 2 Below, In Contact */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-white/[0.1] bg-[#131B38]/75 backdrop-blur-md shadow-2xl"
        >
          {pillars.map((pillar, index) => {
            const borderClasses = [
              index < 3 ? 'border-b border-white/[0.08]' : '',
              index < 2 ? 'md:border-b md:border-white/[0.08]' : 'md:border-b-0',
              index % 2 === 0 ? 'md:border-r md:border-white/[0.08]' : '',
            ].join(' ');

            return (
              <div
                key={pillar.id}
                style={{ transitionDelay: inView ? `${index * 160}ms` : '0ms' }}
                className={`group relative flex flex-col justify-between p-8 sm:p-10 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${borderClasses} ${
                  inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
              >
                {/* Instant Hover Surface Tint */}
                <div className="pointer-events-none absolute inset-0 bg-transparent group-hover:bg-white/[0.03] transition-colors duration-300" />

                {/* Top Accent Bar */}
                <div
                  className="absolute top-0 right-10 w-20 h-1 rounded-b-full transition-all duration-300 opacity-60 group-hover:w-32 group-hover:opacity-100"
                  style={{ backgroundColor: pillar.highlightColor }}
                />

                {/* Header Info */}
                <div className="relative z-10 flex items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: `${pillar.highlightColor}15`,
                        border: `1.5px solid ${pillar.highlightColor}35`,
                      }}
                    >
                      {pillar.icon}
                    </div>
                    <span className="px-3 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-white/[0.05] text-[#94A3B8] border border-white/[0.06]">
                      {pillar.badgeText}
                    </span>
                  </div>

                  <span className="text-2xl font-black font-mono text-white/20 group-hover:text-white/40 transition-colors">
                    {pillar.number}
                  </span>
                </div>

                {/* Title & Tagline */}
                <div className="relative z-10">
                  <h3 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] uppercase font-['Space_Grotesk'] leading-tight mb-2">
                    {pillar.title}
                  </h3>
                  <span className="text-xs font-mono font-bold tracking-wider text-[#12E2C4] uppercase block">
                    {pillar.tagline}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner CTA */}
        <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#182244] via-[#182244] to-[#182244] border border-[#12E2C4]/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] uppercase font-['Space_Grotesk']">
              ARE YOU READY TO REPRESENT YOUR BATCH?
            </h3>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 font-mono">
              Registrations are open for all 50+ athletic and esports disciplines.
            </p>
          </div>

          <Link
            href="/register"
            className="shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-black tracking-wider text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] transition-all uppercase font-['Space_Grotesk'] shadow-xl shadow-[#12E2C4]/20"
          >
            <span>START REGISTRATION</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
