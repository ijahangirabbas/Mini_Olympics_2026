'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { GAMES_DATA, CATEGORIES, SportCategory, GameInfo } from '@/lib/games-data';
import { SportIcon } from './sport-icons';
import {
  Search,
  ArrowUpRight,
  X,
  Users,
  Trophy,
  MapPin,
  Info,
  Clock,
  Sparkles,
  Gamepad2,
  Swords,
  Flame,
  Zap,
  ChevronRight,
  Target,
  Medal,
  Shield,
} from 'lucide-react';

export default function GamesCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'boys_and_girls' | 'boys_only' | 'girls_only'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalGame, setActiveModalGame] = useState<GameInfo | null>(null);

  // Filtered games calculation
  const filteredGames = useMemo(() => {
    return GAMES_DATA.filter((game) => {
      // Category match
      if (selectedCategory !== 'all' && game.category !== selectedCategory) {
        return false;
      }
      // Gender division match
      if (genderFilter !== 'all') {
        if (genderFilter === 'boys_and_girls' && game.division !== 'boys_and_girls') return false;
        if (genderFilter === 'boys_only' && game.division !== 'boys_only') return false;
        if (genderFilter === 'girls_only' && game.division !== 'girls_only') return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = game.name.toLowerCase().includes(query);
        const matchesCat = game.categoryLabel.toLowerCase().includes(query);
        const matchesTag = game.tagline.toLowerCase().includes(query);
        const matchesHead = game.headline?.toLowerCase().includes(query);
        if (!matchesName && !matchesCat && !matchesTag && !matchesHead) return false;
      }
      return true;
    });
  }, [selectedCategory, genderFilter, searchQuery]);

  // Quick stats
  const activeCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <section id="games" className="relative w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#101114] text-[#F4F1EA] overflow-hidden">
      {/* Background Subtle Stadium Mesh & Glows */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#F15A29]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-[500px] h-[500px] bg-[#D5F05B]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Editorial Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14 sm:mb-20">
          <div className="max-w-3xl">
            {/* Top Monospace Ticker */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#181B22] border border-white/[0.08] text-[11px] font-mono tracking-widest text-[#D5F05B] uppercase mb-5">
              <span className="w-2 h-2 rounded-full bg-[#D5F05B] animate-pulse" />
              <span>OFFICIAL 2026 DISCIPLINE DIRECTORY</span>
              <span className="text-white/20">|</span>
              <span className="text-[#A4A5AA]">49 CHAMPIONSHIP EVENTS</span>
            </div>

            {/* Massive Editorial Headline */}
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase font-['Space_Grotesk'] leading-[0.92]">
              EVERY ARENA.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F15A29] via-[#F4F1EA] to-[#D5F05B]">
                ONE PODIUM.
              </span>
            </h2>

            <p className="mt-5 text-base sm:text-lg text-[#A4A5AA] leading-relaxed max-w-2xl font-normal">
              {activeCategoryObj
                ? activeCategoryObj.description
                : 'Explore all 49 official tournament disciplines across Team, Racket, Board, Sprints, Skill, and Esports. Inspect match formats, team rosters, and fees before locking in your registration.'}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-6 self-start lg:self-end border-t lg:border-t-0 lg:border-l border-white/[0.08] pt-4 lg:pt-0 lg:pl-8">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#A4A5AA] block">ACTIVE DISCIPLINE</span>
              <span className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-[#D5F05B]">
                {filteredGames.length}
                <span className="text-sm font-mono text-[#A4A5AA] font-normal"> / {GAMES_DATA.length}</span>
              </span>
            </div>

            <div className="h-8 w-px bg-white/[0.08]" />

            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#A4A5AA] block">LEAGUE DIVISIONS</span>
              <span className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-[#F15A29]">
                ♂ ♀
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Control Center */}
        <div className="sticky top-20 z-30 mb-12 p-3 sm:p-4 rounded-2xl bg-[#14161E]/95 border border-white/[0.1] backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col gap-3">
            {/* Top Row: Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap font-mono flex items-center gap-2 ${
                  selectedCategory === 'all'
                    ? 'bg-[#D5F05B] text-[#101114] shadow-lg shadow-[#D5F05B]/20'
                    : 'text-[#A4A5AA] hover:text-[#F4F1EA] hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <span>ALL DISCIPLINES</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${selectedCategory === 'all' ? 'bg-[#101114]/20 text-[#101114]' : 'bg-white/[0.06] text-[#A4A5AA]'}`}>
                  {GAMES_DATA.length}
                </span>
              </button>

              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap font-mono flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#D5F05B] text-[#101114] shadow-lg shadow-[#D5F05B]/20'
                        : 'text-[#A4A5AA] hover:text-[#F4F1EA] hover:bg-white/[0.05] border border-transparent'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-[#101114]/20 text-[#101114]' : 'bg-white/[0.06] text-[#A4A5AA]'}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Row: Division Selector & Search Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
              {/* Division Filter Buttons */}
              <div className="flex items-center gap-1 bg-[#101114] p-1 rounded-xl border border-white/[0.08] overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-mono uppercase text-[#A4A5AA] px-2.5 hidden sm:inline-block">DIVISION:</span>
                {[
                  { id: 'all', label: 'ALL' },
                  { id: 'boys_and_girls', label: 'BOYS & GIRLS' },
                  { id: 'boys_only', label: 'BOYS ONLY' },
                  { id: 'girls_only', label: 'GIRLS ONLY' },
                ].map((div) => (
                  <button
                    key={div.id}
                    type="button"
                    onClick={() => setGenderFilter(div.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold tracking-wider transition-all whitespace-nowrap ${
                      genderFilter === div.id
                        ? 'bg-white/[0.12] text-white shadow-sm'
                        : 'text-[#A4A5AA] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {div.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative sm:w-80">
                <Search className="w-4 h-4 text-[#A4A5AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by sport, format, rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#101114] text-[#F4F1EA] text-xs font-mono pl-10 pr-9 py-2.5 rounded-xl border border-white/[0.1] placeholder:text-[#A4A5AA]/50 focus:outline-none focus:border-[#D5F05B] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4A5AA] hover:text-white p-0.5"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredGames.length === 0 && (
          <div className="text-center py-24 px-4 rounded-3xl bg-[#14161E]/60 border border-white/[0.08] backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#F15A29]">
              <Info className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-[#F4F1EA] font-['Space_Grotesk'] uppercase">
              No Disciplines Match Your Filters
            </h3>
            <p className="text-sm text-[#A4A5AA] mt-2 font-mono max-w-md mx-auto">
              We couldn&apos;t find any events matching &ldquo;{searchQuery}&rdquo; in the selected division.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setGenderFilter('all');
                setSearchQuery('');
              }}
              className="mt-6 px-6 py-3 rounded-xl text-xs font-bold font-mono tracking-widest text-[#101114] bg-[#D5F05B] uppercase hover:bg-[#c3df4a] transition-all"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* BESPOKE EDITORIAL GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredGames.map((game, index) => {
            // Determine Card Design Archetype
            const isFlagship = game.featured || game.featuredLayout === 'hero';
            const isEsports = game.category === 'esports';
            const isRacket = game.category === 'racket';
            const isTeam = game.category === 'team' && !isFlagship;

            // Render Flagship Asymmetric Poster Card
            if (isFlagship) {
              return (
                <div
                  key={game.id}
                  className="col-span-1 md:col-span-2 lg:col-span-2 group relative rounded-3xl overflow-hidden bg-[#14161E] border border-white/[0.12] hover:border-[#F15A29]/60 transition-all duration-500 shadow-2xl flex flex-col justify-between min-h-[460px] sm:min-h-[500px]"
                >
                  {/* Background High-Res Image with Parallax & Gradients */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-40 group-hover:opacity-55"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101114] via-[#101114]/85 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#101114] via-[#101114]/60 to-transparent" />
                  </div>

                  {/* Top Bar: Serial stamp + Badges */}
                  <div className="relative z-10 p-6 sm:p-8 flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-[#F15A29] text-white shadow-lg shadow-[#F15A29]/30 flex items-center gap-1.5">
                        <Flame className="w-3 h-3" />
                        <span>FLAGSHIP CHAMPIONSHIP</span>
                      </span>

                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-white/[0.1] text-[#F4F1EA] border border-white/[0.1] backdrop-blur-md">
                        {game.division === 'boys_and_girls' ? '♂ BOYS & ♀ GIRLS' : game.division === 'boys_only' ? '♂ BOYS ONLY' : '♀ GIRLS ONLY'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#A4A5AA] tracking-widest hidden sm:inline">
                        DISCIPLINE № 0{index + 1}
                      </span>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.08] border border-white/[0.12] text-white"
                        style={{ color: game.accentColor }}
                      >
                        <SportIcon name={game.iconKey} size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Center Content: Campaign Headline + Sport Title */}
                  <div className="relative z-10 p-6 sm:p-8 pt-0 my-auto">
                    <div className="inline-block text-xs sm:text-sm font-mono tracking-widest text-[#D5F05B] uppercase font-bold mb-2">
                      // {game.headline || 'CAMPUS TITLE EVENT'}
                    </div>

                    <h3 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase font-['Space_Grotesk'] text-[#F4F1EA] tracking-tight leading-[0.95] group-hover:text-white transition-colors">
                      {game.name}
                    </h3>

                    <p className="mt-4 text-sm sm:text-base text-[#A4A5AA] max-w-xl leading-relaxed line-clamp-2 sm:line-clamp-3">
                      {game.tagline}
                    </p>

                    {/* Athletic Match Metadata Bar */}
                    <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-xs text-[#F4F1EA]">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] backdrop-blur-md">
                        <Users className="w-3.5 h-3.5 text-[#D5F05B]" />
                        <span>{game.playerFormat}</span>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] backdrop-blur-md">
                        <Clock className="w-3.5 h-3.5 text-[#F15A29]" />
                        <span>{game.matchFormat}</span>
                      </div>

                      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.08] backdrop-blur-md text-[#A4A5AA]">
                        <MapPin className="w-3.5 h-3.5 text-white/60" />
                        <span>{game.venueNote}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Bar: Fee & Action CTAs */}
                  <div className="relative z-10 p-6 sm:p-8 pt-4 border-t border-white/[0.08] bg-[#101114]/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest uppercase text-[#A4A5AA] block">
                        REGISTRATION FEE
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-[#F4F1EA]">
                          {game.boysFee ? `Rs. ${game.boysFee.toLocaleString()}` : 'Free Entry'}
                        </span>
                        {game.girlsFee && game.girlsFee !== game.boysFee && (
                          <span className="text-xs font-mono text-[#D5F05B]">
                            (Girls: Rs. {game.girlsFee.toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveModalGame(game)}
                        className="px-4 py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-[#F4F1EA] hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] transition-all"
                      >
                        RULES & DOSSIER
                      </button>

                      <Link
                        href={`/register?game=${encodeURIComponent(game.name)}`}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black font-['Space_Grotesk'] tracking-wider uppercase text-[#101114] bg-[#D5F05B] hover:bg-[#c2de4a] transition-all shadow-lg shadow-[#D5F05B]/20 group/btn"
                      >
                        <span>ENTER EVENT</span>
                        <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }

            // Render Esports Arena Card (Dark Cinematic Gaming Aesthetic)
            if (isEsports) {
              return (
                <div
                  key={game.id}
                  className="group relative rounded-3xl overflow-hidden bg-[#0F1118] border border-[#00E5FF]/20 hover:border-[#00E5FF]/60 transition-all duration-500 shadow-xl flex flex-col justify-between"
                >
                  {/* Top Image Preview with Gaming Overlay */}
                  <div className="relative h-48 w-full overflow-hidden bg-black">
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110 opacity-70 group-hover:opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1118] via-transparent to-black/60" />

                    {/* Floating Platform Pill */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/80 border border-[#00E5FF]/40 text-[10px] font-mono font-bold text-[#00E5FF] tracking-wider uppercase backdrop-blur-md">
                      <Gamepad2 className="w-3 h-3" />
                      <span>{game.matchFormat || 'ESPORTS ARENA'}</span>
                    </div>

                    <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-black/60 border border-white/[0.1] flex items-center justify-center text-white/80">
                      <SportIcon name={game.iconKey} size={18} />
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <div className="text-[10px] font-mono tracking-widest text-[#00E5FF] uppercase font-bold mb-1">
                      // {game.headline}
                    </div>

                    <h3 className="text-2xl font-bold uppercase font-['Space_Grotesk'] text-[#F4F1EA] tracking-tight group-hover:text-white transition-colors">
                      {game.name}
                    </h3>

                    <p className="mt-2 text-xs text-[#A4A5AA] leading-relaxed line-clamp-2">
                      {game.tagline}
                    </p>

                    {/* Spec strip */}
                    <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                      <span className="text-[#A4A5AA] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#00E5FF]" />
                        {game.playerFormat}
                      </span>
                      <span className="font-bold text-[#D5F05B]">
                        {game.boysFee ? `Rs. ${game.boysFee}` : 'Free'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="p-6 pt-0 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModalGame(game)}
                      className="py-2.5 px-3 rounded-xl text-xs font-mono font-bold tracking-wider text-[#A4A5AA] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors text-center"
                    >
                      RULES
                    </button>

                    <Link
                      href={`/register?game=${encodeURIComponent(game.name)}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-mono font-bold tracking-wider text-[#101114] bg-[#00E5FF] hover:bg-[#33ebff] transition-all text-center"
                    >
                      <span>REGISTER</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            }

            // Render Racket Sports Card (Clean Editorial Court Aesthetic)
            if (isRacket) {
              return (
                <div
                  key={game.id}
                  className="group relative rounded-3xl overflow-hidden bg-[#151720] border border-[#F15A29]/20 hover:border-[#F15A29]/60 transition-all duration-500 shadow-xl flex flex-col justify-between"
                >
                  {/* Top Image Preview */}
                  <div className="relative h-44 w-full overflow-hidden bg-black">
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-70 group-hover:opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#151720] via-transparent to-black/50" />

                    <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-black/70 border border-white/[0.1] text-[10px] font-mono font-bold text-[#F15A29] tracking-wider uppercase">
                      RACKET SPORT
                    </div>

                    <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-black/60 border border-white/[0.1] flex items-center justify-center text-[#F15A29]">
                      <SportIcon name={game.iconKey} size={18} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="text-[10px] font-mono tracking-widest text-[#F15A29] uppercase font-bold mb-1">
                      // {game.headline}
                    </div>

                    <h3 className="text-2xl font-bold uppercase font-['Space_Grotesk'] text-[#F4F1EA] tracking-tight group-hover:text-white transition-colors">
                      {game.name}
                    </h3>

                    <p className="mt-2 text-xs text-[#A4A5AA] leading-relaxed line-clamp-2">
                      {game.tagline}
                    </p>

                    {/* Court Format */}
                    <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                      <span className="text-[#A4A5AA] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#F15A29]" />
                        {game.playerFormat}
                      </span>
                      <span className="font-bold text-[#F4F1EA]">
                        {game.boysFee ? `Rs. ${game.boysFee}` : 'Free'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 pt-0 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModalGame(game)}
                      className="py-2.5 px-3 rounded-xl text-xs font-mono font-bold tracking-wider text-[#A4A5AA] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors text-center"
                    >
                      RULES
                    </button>

                    <Link
                      href={`/register?game=${encodeURIComponent(game.name)}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-mono font-bold tracking-wider text-[#101114] bg-[#F15A29] text-white hover:bg-[#e04c1c] transition-all text-center"
                    >
                      <span>REGISTER</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            }

            // Render Team Athletic Card (High-Contrast Bold Sports Aesthetic)
            if (isTeam) {
              return (
                <div
                  key={game.id}
                  className="group relative rounded-3xl overflow-hidden bg-[#151720] border border-white/[0.1] hover:border-[#D5F05B]/60 transition-all duration-500 shadow-xl flex flex-col justify-between"
                >
                  {/* Top Image Preview */}
                  <div className="relative h-44 w-full overflow-hidden bg-black">
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-65 group-hover:opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#151720] via-transparent to-black/50" />

                    <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-black/70 border border-white/[0.1] text-[10px] font-mono font-bold text-[#D5F05B] tracking-wider uppercase">
                      {game.matchFormat || 'TEAM CHAMPIONSHIP'}
                    </div>

                    <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-black/60 border border-white/[0.1] flex items-center justify-center text-[#D5F05B]">
                      <SportIcon name={game.iconKey} size={18} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="text-[10px] font-mono tracking-widest text-[#D5F05B] uppercase font-bold mb-1">
                      // {game.headline}
                    </div>

                    <h3 className="text-2xl font-bold uppercase font-['Space_Grotesk'] text-[#F4F1EA] tracking-tight group-hover:text-white transition-colors">
                      {game.name}
                    </h3>

                    <p className="mt-2 text-xs text-[#A4A5AA] leading-relaxed line-clamp-2">
                      {game.tagline}
                    </p>

                    <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                      <span className="text-[#A4A5AA] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#D5F05B]" />
                        {game.playerFormat}
                      </span>
                      <span className="font-bold text-[#F4F1EA]">
                        {game.boysFee ? `Rs. ${game.boysFee}` : 'Free'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 pt-0 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModalGame(game)}
                      className="py-2.5 px-3 rounded-xl text-xs font-mono font-bold tracking-wider text-[#A4A5AA] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors text-center"
                    >
                      RULES
                    </button>

                    <Link
                      href={`/register?game=${encodeURIComponent(game.name)}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-mono font-bold tracking-wider text-[#101114] bg-[#D5F05B] hover:bg-[#c2de4a] transition-all text-center"
                    >
                      <span>REGISTER</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            }

            // Render Standard Tactical Pass Card (Board, Race & Skill Events)
            return (
              <div
                key={game.id}
                className="group relative rounded-3xl overflow-hidden bg-[#14161F] border border-white/[0.08] hover:border-white/[0.25] transition-all duration-300 shadow-lg flex flex-col justify-between"
              >
                {/* Header Image Strip */}
                <div className="relative h-36 w-full overflow-hidden bg-black">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 opacity-60 group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14161F] via-transparent to-black/40" />

                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-black/60 text-[#A4A5AA] border border-white/[0.08]">
                    {game.categoryLabel}
                  </div>

                  <div className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-black/60 border border-white/[0.1] flex items-center justify-center text-white/80">
                    <SportIcon name={game.iconKey} size={16} />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="text-[10px] font-mono text-[#D5F05B] uppercase font-bold mb-1">
                    // {game.headline}
                  </div>

                  <h3 className="text-xl font-bold uppercase font-['Space_Grotesk'] text-[#F4F1EA] tracking-tight group-hover:text-white transition-colors">
                    {game.name}
                  </h3>

                  <p className="mt-1.5 text-xs text-[#A4A5AA] leading-relaxed line-clamp-2">
                    {game.tagline}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#A4A5AA]">{game.playerFormat}</span>
                    <span className="font-bold text-[#F4F1EA]">
                      {game.boysFee ? `Rs. ${game.boysFee}` : 'Free'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalGame(game)}
                    className="py-2 px-3 rounded-lg text-xs font-mono font-semibold tracking-wider text-[#A4A5AA] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors text-center"
                  >
                    INFO
                  </button>

                  <Link
                    href={`/register?game=${encodeURIComponent(game.name)}`}
                    className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-mono font-bold tracking-wider text-[#101114] bg-[#F4F1EA] hover:bg-[#D5F05B] transition-all text-center"
                  >
                    <span>REGISTER</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOURNAMENT DOSSIER MODAL */}
      {activeModalGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#14161E] border border-white/[0.14] rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header Image Banner */}
            <div className="relative h-48 sm:h-56 w-full overflow-hidden rounded-t-3xl bg-black">
              <img
                src={activeModalGame.image}
                alt={activeModalGame.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14161E] via-[#14161E]/60 to-transparent" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveModalGame(null)}
                className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/60 text-[#A4A5AA] hover:text-white border border-white/[0.1] backdrop-blur-md transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Badges on Banner */}
              <div className="absolute bottom-4 left-6 sm:left-8 right-6 flex items-end justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-[#D5F05B] tracking-wider uppercase block mb-1">
                    // {activeModalGame.categoryLabel}
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black text-[#F4F1EA] font-['Space_Grotesk'] uppercase leading-none">
                    {activeModalGame.name}
                  </h3>
                </div>

                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/60 border border-white/[0.15] backdrop-blur-md"
                  style={{ color: activeModalGame.accentColor }}
                >
                  <SportIcon name={activeModalGame.iconKey} size={24} />
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Headline & Tagline */}
              <div>
                <span className="text-xs font-mono font-bold text-[#F15A29] uppercase tracking-wider block mb-1">
                  OFFICIAL DISCIPLINE BRIEF
                </span>
                <p className="text-sm sm:text-base text-[#F4F1EA] font-medium leading-relaxed">
                  {activeModalGame.tagline}
                </p>
              </div>

              {/* 4-Quadrant Tournament Specification Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-[#101114] border border-white/[0.08]">
                  <span className="text-[#A4A5AA] text-[10px] uppercase tracking-wider block mb-1">
                    ROSTER & PLAYER FORMAT
                  </span>
                  <span className="text-[#F4F1EA] font-bold text-sm block">
                    {activeModalGame.playerFormat}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#101114] border border-white/[0.08]">
                  <span className="text-[#A4A5AA] text-[10px] uppercase tracking-wider block mb-1">
                    MATCH RULES & DURATION
                  </span>
                  <span className="text-[#D5F05B] font-bold text-sm block">
                    {activeModalGame.matchFormat || 'KNOCKOUT BRACKET'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#101114] border border-white/[0.08]">
                  <span className="text-[#A4A5AA] text-[10px] uppercase tracking-wider block mb-1">
                    REGISTRATION ENTRY FEE
                  </span>
                  <span className="text-[#F4F1EA] font-bold text-sm block">
                    {activeModalGame.boysFee ? `Rs. ${activeModalGame.boysFee.toLocaleString()}` : 'Free Entry'}
                    {activeModalGame.girlsFee && activeModalGame.girlsFee !== activeModalGame.boysFee && (
                      <span className="text-xs font-normal text-[#D5F05B] ml-2">
                        (Girls: Rs. {activeModalGame.girlsFee.toLocaleString()})
                      </span>
                    )}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#101114] border border-white/[0.08]">
                  <span className="text-[#A4A5AA] text-[10px] uppercase tracking-wider block mb-1">
                    OFFICIAL VENUE
                  </span>
                  <div className="flex items-center gap-1.5 text-[#F4F1EA] font-bold text-sm">
                    <MapPin className="w-4 h-4 text-[#F15A29] shrink-0" />
                    <span className="truncate">{activeModalGame.venueNote}</span>
                  </div>
                </div>
              </div>

              {/* Full Rules Overview */}
              <div className="p-5 rounded-2xl bg-[#101114]/70 border border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D5F05B] uppercase tracking-wider mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  <span>// OFFICIAL TOURNAMENT REGULATIONS</span>
                </div>
                <p className="text-xs sm:text-sm text-[#A4A5AA] leading-relaxed">
                  {activeModalGame.rulesOverview}
                </p>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveModalGame(null)}
                  className="w-1/3 py-3.5 rounded-xl text-xs font-mono font-bold tracking-wider text-[#A4A5AA] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors uppercase text-center"
                >
                  CLOSE
                </button>

                <Link
                  href={`/register?game=${encodeURIComponent(activeModalGame.name)}`}
                  className="w-2/3 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-black tracking-wider text-[#101114] bg-[#D5F05B] hover:bg-[#c2de4a] transition-all uppercase font-['Space_Grotesk'] shadow-lg shadow-[#D5F05B]/20"
                >
                  <span>REGISTER FOR THIS SPORT</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
