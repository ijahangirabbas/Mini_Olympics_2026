'use client';

import React from 'react';
import Link from 'next/link';
import { QrCode, CreditCard, Users2, Trophy, ArrowUpRight, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';

export default function WhyCompete() {
  const pillars = [
    {
      id: 'glory',
      title: 'CHAMPIONSHIP GLORY & HONORS',
      tagline: 'OFFICIAL TROPHIES, PODIUM FINISHES & MEDALS',
      description:
        'Cement your legacy in FCIT sports history. Gold, silver, and bronze medals along with department championship shields and cash prizes for top bracket performers.',
      highlightColor: '#F15A29',
      number: '01',
      badgeText: 'PODIUM AWARDS',
      icon: <Trophy className="w-6 h-6 text-[#F15A29]" />,
      points: [
        'Custom engraved Mini Olympics 2026 trophies',
        'Official certificates of excellence & medal recognition',
        'Campus-wide society social media showcase',
      ],
    },
    {
      id: 'digital',
      title: 'INSTANT QR VERIFICATION PASS',
      tagline: 'SEAMLESS REGISTRATION & LIVE STATUS LOOKUP',
      description:
        'No paper delays. Register online, receive an encrypted digital pass with a QR code, and verify instantly via our cash desk kiosk or online receipt validation.',
      highlightColor: '#D5F05B',
      number: '02',
      badgeText: 'PAPERLESS TECH',
      icon: <QrCode className="w-6 h-6 text-[#D5F05B]" />,
      points: [
        'Instant Slip ID generation (e.g. MO26-CASH-XXXX)',
        'Scannable QR codes for seamless entrance',
        'Direct automated email confirmation upon review',
      ],
    },
    {
      id: 'fixtures',
      title: 'HEAD OF COMPETITION (HOC) ENGINE',
      tagline: 'OFFICIAL KNOCKOUTS & ROUND-ROBIN BRACKETS',
      description:
        'Every game is scheduled through the HOC management system. Official venues, standardized rule sets, qualified student referees, and transparent bracket progressions.',
      highlightColor: '#00E5FF',
      number: '03',
      badgeText: 'FAIR PLAY SYSTEM',
      icon: <ShieldCheck className="w-6 h-6 text-[#00E5FF]" />,
      points: [
        'Dedicated WhatsApp coordinators for every sport',
        'Live match timing updates & scheduled venues',
        'Transparent tiebreakers and dispute resolutions',
      ],
    },
    {
      id: 'culture',
      title: 'UNRIVALED CAMPUS SPIRIT',
      tagline: 'ACROSS CS, SE, IT & DATA SCIENCE BATCHES',
      description:
        'The ultimate bonding experience at Old Campus. Rally your batchmates, chant from the sidelines, and battle alongside friends in one electric week of collegiate sports.',
      highlightColor: '#FFD700',
      number: '04',
      badgeText: 'COLLEGIATE ENERGY',
      icon: <Users2 className="w-6 h-6 text-[#FFD700]" />,
      points: [
        'Inter-batch and inter-department sports rivalries',
        'Floodlit evening games & electric stadium atmosphere',
        'Full photographic and video coverage throughout',
      ],
    },
  ];

  return (
    <section id="why" className="relative w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#101114] overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Headline */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1B1D21] border border-white/[0.08] text-xs font-mono text-[#D5F05B] uppercase tracking-wider mb-3">
            <span>// THE MINI OLYMPICS ADVANTAGE</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-[#F4F1EA] uppercase font-['Space_Grotesk'] leading-[0.95]">
            BUILT FOR ATHLETES.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F15A29] via-[#ff8a50] to-[#D5F05B]">
              ORGANIZED FOR EXCELLENCE.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#A4A5AA] leading-relaxed">
            We overhauled the entire sports tournament experience so you can focus on performance. Transparent brackets, rapid verification, and tournament-grade equipment.
          </p>
        </div>

        {/* 4 Distinct Asymmetric Visual Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              className="group relative flex flex-col justify-between p-8 sm:p-10 rounded-3xl bg-[#16181F] border border-white/[0.08] hover:border-white/[0.2] transition-all duration-300 hover:-translate-y-1 shadow-2xl"
            >
              {/* Header Info */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                      style={{
                        backgroundColor: `${pillar.highlightColor}15`,
                        border: `1.5px solid ${pillar.highlightColor}35`,
                      }}
                    >
                      {pillar.icon}
                    </div>
                    <span className="px-3 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-white/[0.05] text-[#A4A5AA] border border-white/[0.06]">
                      {pillar.badgeText}
                    </span>
                  </div>

                  <span className="text-2xl font-black font-mono text-white/20 group-hover:text-white/40 transition-colors">
                    {pillar.number}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-[#F4F1EA] uppercase font-['Space_Grotesk'] leading-tight mb-2">
                  {pillar.title}
                </h3>
                <span className="text-xs font-mono font-bold tracking-wider text-[#D5F05B] uppercase block mb-4">
                  {pillar.tagline}
                </span>

                <p className="text-sm text-[#A4A5AA] leading-relaxed mb-6 font-normal">
                  {pillar.description}
                </p>

                {/* Key Points Bullet List */}
                <div className="space-y-2.5 pt-4 border-t border-white/[0.06]">
                  {pillar.points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[#F4F1EA] font-mono">
                      <CheckCircle2
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{ color: pillar.highlightColor }}
                      />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Decorative Accent */}
              <div
                className="absolute top-0 right-10 w-24 h-1 rounded-b-full transition-all duration-300 opacity-60 group-hover:w-36 group-hover:opacity-100"
                style={{ backgroundColor: pillar.highlightColor }}
              />
            </div>
          ))}
        </div>

        {/* Banner CTA */}
        <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#181B22] via-[#1E222B] to-[#181B22] border border-[#D5F05B]/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#F4F1EA] uppercase font-['Space_Grotesk']">
              ARE YOU READY TO REPRESENT YOUR BATCH?
            </h3>
            <p className="text-xs sm:text-sm text-[#A4A5AA] mt-1 font-mono">
              Registrations are open for all 50+ athletic and esports disciplines.
            </p>
          </div>

          <Link
            href="/register"
            className="shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-black tracking-wider text-[#101114] bg-[#D5F05B] hover:bg-[#c2de4a] transition-all uppercase font-['Space_Grotesk'] shadow-xl shadow-[#D5F05B]/20"
          >
            <span>START REGISTRATION</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
