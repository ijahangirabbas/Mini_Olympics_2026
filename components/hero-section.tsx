'use client';

import React from 'react';
import Link from 'next/link';
import Hero3DScene from './hero-3d-scene';
import { ArrowDown, ArrowUpRight, Flame, Sparkles, Trophy, Users, Shield } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between pt-28 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#101114]">
      {/* 3D Interactive WebGL Scene */}
      <Hero3DScene />

      {/* Atmospheric Floodlight Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#F15A29]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#D5F05B]/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#00E5FF]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Core Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full pt-8 sm:pt-14 my-auto">
        {/* Championship Announcement Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B1D21]/90 border border-white/[0.1] text-xs font-mono text-[#D5F05B] tracking-wider uppercase backdrop-blur-md mb-6 sm:mb-8 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-[#D5F05B] animate-ping" />
          <span className="font-semibold text-white">MINI OLYMPICS 2026</span>
          <span className="text-white/30">•</span>
          <span className="text-[#A4A5AA]">ANNUAL UNIVERSITY CHAMPIONSHIP</span>
        </div>

        {/* Massive Editorial Headline */}
        <div className="flex flex-col space-y-1 sm:space-y-2">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight text-[#F4F1EA] uppercase font-['Space_Grotesk'] leading-[0.92]">
            THE CAMPUS.
          </h1>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#F15A29] via-[#ff8a50] to-[#D5F05B] uppercase font-['Space_Grotesk'] leading-[0.92]">
            THE COMPETITION.
          </h1>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight text-[#F4F1EA] uppercase font-['Space_Grotesk'] leading-[0.92]">
            THE CHAMPIONS.
          </h1>
        </div>

        {/* Supporting Editorial Paragraph */}
        <div className="mt-8 sm:mt-10 max-w-2xl">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold tracking-widest text-[#D5F05B] uppercase font-mono mb-2">
            <span>50+ GAMES</span>
            <span>•</span>
            <span>ONE CHAMPIONSHIP</span>
            <span>•</span>
            <span>UNLIMITED GLORY</span>
          </div>
          <p className="text-base sm:text-lg text-[#A4A5AA] leading-relaxed font-normal">
            From floodlit tape-ball cricket battles to 50m aquatic sprints, tactical arena esports, and intense tug-of-war showdowns. FCIT Sports Society hosts PUCIT’s premier annual athletic spectacle. Assemble your squad and stake your claim on university history.
          </p>
        </div>

        {/* CTA Button Group */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-6">
          <Link
            href="/register"
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-sm sm:text-base font-black tracking-wider text-[#101114] bg-[#D5F05B] hover:bg-[#c4e343] transition-all duration-300 uppercase shadow-2xl shadow-[#D5F05B]/25 hover:shadow-[#D5F05B]/40 hover:-translate-y-1 font-['Space_Grotesk']"
          >
            <span>REGISTER YOUR SQUAD</span>
            <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>

          <a
            href="#games"
            className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl text-sm sm:text-base font-bold tracking-wider text-[#F4F1EA] bg-[#1B1D21]/80 hover:bg-[#24272D] border border-white/[0.1] hover:border-[#D5F05B]/40 transition-all duration-300 uppercase backdrop-blur-md font-mono"
          >
            <span>EXPLORE 50+ EVENTS</span>
            <ArrowDown className="w-4 h-4 text-[#D5F05B] transition-transform group-hover:translate-y-1" />
          </a>

          <Link
            href="/verify-cash"
            className="inline-flex items-center gap-2 text-xs font-mono tracking-wider text-[#A4A5AA] hover:text-[#D5F05B] transition-colors py-2 px-3 border-b border-transparent hover:border-[#D5F05B]"
          >
            <Shield className="w-3.5 h-3.5 text-[#F15A29]" />
            <span>Registration Desk Verification →</span>
          </Link>
        </div>
      </div>

      {/* Bottom Championship Ticker Ribbon */}
      <div className="relative z-10 max-w-7xl mx-auto w-full mt-12 pt-6 border-t border-white/[0.08]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-mono tracking-widest text-[#F15A29] uppercase">01 // DISCIPLINES</span>
            <span className="text-xl sm:text-2xl font-black text-[#F4F1EA] font-['Space_Grotesk']">50+ OFFICIAL SPORTS</span>
            <span className="text-xs text-[#A4A5AA]">Team, Racket, Board & Esports</span>
          </div>

          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-mono tracking-widest text-[#D5F05B] uppercase">02 // DIVISIONS</span>
            <span className="text-xl sm:text-2xl font-black text-[#F4F1EA] font-['Space_Grotesk']">BOYS & GIRLS</span>
            <span className="text-xs text-[#A4A5AA]">Separate gender tournament brackets</span>
          </div>

          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-mono tracking-widest text-[#F15A29] uppercase">03 // EXPECTED</span>
            <span className="text-xl sm:text-2xl font-black text-[#F4F1EA] font-['Space_Grotesk']">500+ ATHLETES</span>
            <span className="text-xs text-[#A4A5AA]">All semesters & all batches competing</span>
          </div>

          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-mono tracking-widest text-[#D5F05B] uppercase">04 // AWARDS</span>
            <span className="text-xl sm:text-2xl font-black text-[#F4F1EA] font-['Space_Grotesk']">MEDALS & TROPHIES</span>
            <span className="text-xs text-[#A4A5AA]">Championship shields & cash honors</span>
          </div>
        </div>
      </div>
    </section>
  );
}
