'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Trophy, Users, Zap, ShieldCheck } from 'lucide-react';

interface StatItem {
  id: string;
  value: number;
  suffix: string;
  label: string;
  subtitle: string;
  accent: string;
  icon: React.ReactNode;
}

export default function ChampionshipStats() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const stats: StatItem[] = [
    {
      id: 'games',
      value: 50,
      suffix: '+',
      label: 'OFFICIAL DISCIPLINES',
      subtitle: 'Across team sports, racket, board, track sprint & esports divisions',
      accent: '#F15A29',
      icon: <Trophy className="w-5 h-5 text-[#F15A29]" />,
    },
    {
      id: 'athletes',
      value: 500,
      suffix: '+',
      label: 'EXPECTED ATHLETES',
      subtitle: 'PUCIT BS CS, SE, IT, and Data Science undergraduate students',
      accent: '#D5F05B',
      icon: <Users className="w-5 h-5 text-[#D5F05B]" />,
    },
    {
      id: 'teams',
      value: 100,
      suffix: '+',
      label: 'REGISTERED TEAMS',
      subtitle: 'Multi-discipline squads battling for the annual championship trophy',
      accent: '#00E5FF',
      icon: <Zap className="w-5 h-5 text-[#00E5FF]" />,
    },
    {
      id: 'status',
      value: 24,
      suffix: '/7',
      label: 'DIGITAL REGISTRATION',
      subtitle: 'Instant QR cash slip generation & real-time online verification',
      accent: '#FFD700',
      icon: <ShieldCheck className="w-5 h-5 text-[#FFD700]" />,
    },
  ];

  return (
    <section
      id="stats"
      ref={sectionRef}
      className="relative w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#0D0E12] border-t border-b border-white/[0.06] overflow-hidden"
    >
      {/* Stadium Grid Lines Background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #F4F1EA 1px, transparent 1px), linear-gradient(to bottom, #F4F1EA 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Editorial Subheader */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14 sm:mb-20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1B1D21] border border-white/[0.08] text-xs font-mono text-[#D5F05B] uppercase tracking-wider mb-3">
              <span>// TOURNAMENT SCALE & REACH</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#F4F1EA] uppercase font-['Space_Grotesk'] leading-[0.95]">
              NUMBERS THAT DEFINE<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D5F05B] to-[#F15A29]">
                AN OLYMPIC LEGACY.
              </span>
            </h2>
          </div>

          <p className="max-w-md text-xs sm:text-sm font-mono text-[#A4A5AA] leading-relaxed">
            The largest collegiate sports event at PUCIT. Verified records, structured refereeing, and university-wide participation.
          </p>
        </div>

        {/* 4 Large Editorial Statistics Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((item, index) => {
            return (
              <div
                key={item.id}
                className="group relative p-8 rounded-2xl bg-[#14161C] border border-white/[0.08] hover:border-white/[0.2] transition-all duration-300 hover:-translate-y-1"
              >
                {/* Top Corner Icon & Sequence Number */}
                <div className="flex items-center justify-between mb-8">
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    {item.icon}
                  </div>
                  <span className="text-xs font-mono text-[#A4A5AA]/60 tracking-widest">
                    0{index + 1}
                  </span>
                </div>

                {/* Massive Kinetic Typography */}
                <div className="flex items-baseline font-black tracking-tighter text-[#F4F1EA] font-['Space_Grotesk'] leading-none mb-3">
                  <span className="text-6xl sm:text-7xl font-extrabold group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#F4F1EA] group-hover:to-[#D5F05B] transition-all">
                    {inView ? item.value : 0}
                  </span>
                  <span className="text-4xl sm:text-5xl font-black text-[#D5F05B] ml-1">
                    {item.suffix}
                  </span>
                </div>

                {/* Label & Description */}
                <h3 className="text-sm font-mono font-bold tracking-wider text-[#F4F1EA] uppercase mb-2">
                  {item.label}
                </h3>
                <p className="text-xs text-[#A4A5AA] leading-relaxed font-normal">
                  {item.subtitle}
                </p>

                {/* Bottom Border Accent Line */}
                <div
                  className="absolute bottom-0 left-6 right-6 h-[2px] transition-all duration-300 opacity-40 group-hover:opacity-100"
                  style={{ backgroundColor: item.accent }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
