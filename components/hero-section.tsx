'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowDown, ArrowUpRight, Shield } from 'lucide-react';
import { useLiveGames } from '@/lib/use-live-games';

const Hero3DScene = dynamic(() => import('./hero-3d-scene'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 z-[1] pointer-events-none" aria-hidden="true" />
  ),
});

export default function HeroSection() {
  const { games: liveGames } = useLiveGames();
  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between pt-28 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#0B1124]">
      {/* 3D Interactive WebGL Scene */}
      <Hero3DScene />

      {/* Atmospheric Floodlight Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#F59E0B]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#12E2C4]/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#3B82F6]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Core Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full pt-8 sm:pt-14 my-auto">
        {/* Championship Announcement Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#182244]/90 border border-white/[0.1] text-xs font-mono text-[#12E2C4] tracking-wider uppercase backdrop-blur-md mb-6 sm:mb-8 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-[#12E2C4] animate-ping" />
          <span className="font-semibold text-white">MINI OLYMPICS 2026</span>
          <span className="text-white/30">•</span>
          <span className="text-[#94A3B8]">ANNUAL UNIVERSITY CHAMPIONSHIP</span>
        </div>

        {/* Massive Editorial Headline */}
        <h1 className="flex flex-col space-y-1 sm:space-y-2 text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight text-[#F8FAFC] uppercase font-['Space_Grotesk'] leading-[0.92]">
          <span className="hero-stagger hero-stagger-1">CLOSE THE IDE.</span>
          <span className="hero-stagger hero-stagger-2 text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#12E2C4]">
            HIT THE GROUND.
          </span>
          <span className="hero-stagger hero-stagger-3">WIN SOMETHING.</span>
        </h1>

        {/* Supporting Editorial Paragraph */}
        <div className="hero-stagger hero-stagger-sub mt-8 sm:mt-10 max-w-2xl">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold tracking-widest text-[#12E2C4] uppercase font-mono mb-2">
            <span>50+ GAMES</span>
            <span>•</span>
            <span>ONE CHAMPIONSHIP</span>
            <span>•</span>
            <span>UNLIMITED GLORY</span>
          </div>
          <p className="text-base sm:text-lg text-[#E2E8F0] leading-relaxed font-normal">
            When Mini Olympics hits FCIT, assignments wait and sidelines get loud in broad daylight. Batches back their own like every point is a final. Built by sports lovers, for anyone ready to leave it all on the pitch.
          </p>
        </div>

        {/* CTA Button Group */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-6">
          <Link
            href="/register"
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-sm sm:text-base font-black tracking-wider text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] transition-all duration-300 uppercase shadow-2xl shadow-[#12E2C4]/25 hover:shadow-[#12E2C4]/40 hover:-translate-y-1 font-['Space_Grotesk']"
          >
            <span>REGISTER YOUR SQUAD</span>
            <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>

          <Link
            href="/games"
            className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl text-sm sm:text-base font-bold tracking-wider text-[#F8FAFC] bg-[#182244]/80 hover:bg-[#1E2A52] border border-white/[0.1] hover:border-[#12E2C4]/40 transition-all duration-300 uppercase backdrop-blur-md font-mono"
          >
            <span>VIEW ALL {liveGames.length >= 50 ? `${liveGames.length}+` : '50+'} EVENTS</span>
            <ArrowDown className="w-4 h-4 text-[#12E2C4] transition-transform group-hover:translate-y-1" />
          </Link>

          <Link
            href="/verify-cash"
            className="inline-flex items-center gap-2 text-xs font-mono tracking-wider text-[#94A3B8] hover:text-[#12E2C4] transition-colors py-2 px-3 border-b border-transparent hover:border-[#12E2C4]"
          >
            <Shield className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Registration Desk Verification →</span>
          </Link>
        </div>
      </div>

      {/* Bottom Championship Ticker Ribbon */}
      <div className="relative z-10 max-w-7xl mx-auto w-full mt-12 pt-6 border-t border-white/[0.08]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-mono tracking-widest text-[#F59E0B] uppercase">01 // DISCIPLINES</span>
            <span className="text-xl sm:text-2xl font-black text-[#F8FAFC] font-['Space_Grotesk']">50+ OFFICIAL SPORTS</span>
            <span className="text-xs text-[#94A3B8]">Team, Indoor & Table, Track & Esports</span>
          </div>

          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-mono tracking-widest text-[#12E2C4] uppercase">02 // DIVISIONS</span>
            <span className="text-xl sm:text-2xl font-black text-[#F8FAFC] font-['Space_Grotesk']">BOYS & GIRLS</span>
            <span className="text-xs text-[#94A3B8]">Separate gender tournament brackets</span>
          </div>

          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-mono tracking-widest text-[#F59E0B] uppercase">03 // EXPECTED</span>
            <span className="text-xl sm:text-2xl font-black text-[#F8FAFC] font-['Space_Grotesk']">500+ ATHLETES</span>
            <span className="text-xs text-[#94A3B8]">All semesters & all batches competing</span>
          </div>

          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-mono tracking-widest text-[#12E2C4] uppercase">04 // AWARDS</span>
            <span className="text-xl sm:text-2xl font-black text-[#F8FAFC] font-['Space_Grotesk']">MEDALS & TROPHIES</span>
            <span className="text-xs text-[#94A3B8]">Championship shields & cash honors</span>
          </div>
        </div>
      </div>
    </section>
  );
}
