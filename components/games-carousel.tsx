'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Pause,
  Play,
  Users,
} from 'lucide-react';
import {
  CATEGORIES,
  GameInfo,
  getCompactPlayerLabel,
  getDivisionLabel,
  getFeeSummary,
  sortByCategoryOrder,
} from '@/lib/games-data';
import { useLiveGames } from '@/lib/use-live-games';
import { SportIcon } from './sport-icons';
import GameDossierModal from './game-dossier-modal';
import OlympicRingsIcon from './olympic-rings-icon';

const AUTO_SCROLL_INTERVAL_MS = 2200;

export default function GamesCarousel() {
  const { games: liveGames } = useLiveGames();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalGame, setActiveModalGame] = useState<GameInfo | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(0);

  const displayedGames = useMemo(() => {
    if (selectedCategory !== 'all') {
      return liveGames.filter((g) => g.category === selectedCategory);
    }
    return sortByCategoryOrder(liveGames);
  }, [selectedCategory, liveGames]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of liveGames) {
      counts[g.category] = (counts[g.category] || 0) + 1;
    }
    return counts;
  }, [liveGames]);

  // Reset scroll to the start when category filter changes
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: 0, behavior: 'auto' });
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setStatusMessage('');
  }, [selectedCategory]);

  const scrollToSlide = useCallback(
    (targetIndex: number, announce = false) => {
      const track = trackRef.current;
      if (!track) return;

      const slides = Array.from(track.querySelectorAll<HTMLElement>('[data-carousel-slide]'));
      if (slides.length === 0) return;

      const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
      let wrappedIndex = ((targetIndex % slides.length) + slides.length) % slides.length;
      let targetLeft = Math.min(slides[wrappedIndex].offsetLeft, maxScrollLeft);

      // If advancing forward hits the right scroll limit without moving, wrap cleanly to the start
      if (targetIndex > currentIndexRef.current && Math.abs(targetLeft - track.scrollLeft) < 4) {
        wrappedIndex = 0;
        targetLeft = 0;
      }

      track.scrollTo({
        left: targetLeft,
        behavior: 'smooth',
      });
      currentIndexRef.current = wrappedIndex;
      setCurrentIndex(wrappedIndex);

      if (announce) {
        const game = displayedGames[wrappedIndex];
        setStatusMessage(
          game
            ? `Showing ${game.name}, slide ${wrappedIndex + 1} of ${slides.length}`
            : `Slide ${wrappedIndex + 1} of ${slides.length}`
        );
      }
    },
    [displayedGames]
  );

  // Compute active index as the track scrolls (rAF-throttled)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId = 0;
    const updateActiveSlide = () => {
      rafId = 0;
      const slides = Array.from(track.querySelectorAll<HTMLElement>('[data-carousel-slide]'));
      if (slides.length === 0) return;

      const scrollLeft = track.scrollLeft;
      let nearestIdx = 0;
      let minDist = Infinity;

      for (let i = 0; i < slides.length; i++) {
        const dist = Math.abs(slides[i].offsetLeft - scrollLeft);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      }
      currentIndexRef.current = nearestIdx;
      setCurrentIndex(nearestIdx);
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(updateActiveSlide);
      }
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [displayedGames.length]);

  // One-by-one auto-scroll timer: pauses when hovered, manually paused, modal open, or reduced motion is preferred
  const shouldAutoPlay = !userPaused && !isHovered && !activeModalGame && !prefersReducedMotion;

  useEffect(() => {
    if (!shouldAutoPlay || displayedGames.length <= 1) return;

    const timer = window.setInterval(() => {
      scrollToSlide(currentIndexRef.current + 1, false);
    }, AUTO_SCROLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [shouldAutoPlay, displayedGames.length, scrollToSlide]);

  const viewAllHref =
    selectedCategory === 'all' ? '/games' : `/games?category=${encodeURIComponent(selectedCategory)}`;

  return (
    <section
      id="games"
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Championship disciplines showcase"
      className="relative w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#0B1124] text-[#F8FAFC] overflow-hidden"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header + View All CTA */}
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          {/* Dual Logo Dull Visible Backdrop Above View All Games */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute -top-4 right-0 lg:right-2 flex items-center gap-5 sm:gap-8 opacity-25"
          >
            <div className="flex flex-col items-center">
              <OlympicRingsIcon className="w-24 sm:w-32 h-12 sm:h-16" />
              <div className="mt-1 text-center leading-none">
                <span className="text-sm sm:text-lg font-black tracking-wide text-white font-['Space_Grotesk']">
                  Mini{' '}
                </span>
                <span className="text-sm sm:text-lg font-black tracking-wide text-[#F43F5E] font-['Space_Grotesk']">
                  OLYMPICS
                </span>
                <span className="block text-xs sm:text-sm font-bold tracking-[0.3em] text-[#12E2C4] font-mono mt-0.5">
                  2026
                </span>
              </div>
            </div>
            <img
              src="/images/foc-logo.png"
              alt=""
              className="h-20 sm:h-28 w-auto object-contain"
            />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#182244] border border-white/[0.08] text-[11px] font-mono tracking-wider text-[#12E2C4] mb-4">
              <span>{liveGames.length >= 50 ? `${liveGames.length}+` : '50+'} Official Disciplines</span>
              <span className="text-white/25">•</span>
              <span className="text-[#94A3B8]">{CATEGORIES.length} Categories</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase font-['Space_Grotesk'] leading-[0.95]">
              Every Arena.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#F8FAFC] to-[#12E2C4]">
                One Podium.
              </span>
            </h2>

            <p className="mt-3 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
              Browse the rotating tournament lineup below, or open the full directory to filter by category, division, and team size.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 self-start lg:self-end">
            <Link
              href={viewAllHref}
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-black tracking-wider text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] transition-colors uppercase font-['Space_Grotesk'] shadow-lg shadow-[#12E2C4]/20"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>View All {liveGames.length >= 50 ? `${liveGames.length}+` : '50+'} Games</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Category Filter Chips + Carousel Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
            role="tablist"
            aria-label="Filter showcase by category"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#12E2C4] text-[#0B1124]'
                  : 'bg-[#131B38] text-[#94A3B8] hover:text-[#F8FAFC] border border-white/[0.08]'
              }`}
            >
              All Events ({liveGames.length})
            </button>

            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#12E2C4] text-[#0B1124]'
                      : 'bg-[#131B38] text-[#94A3B8] hover:text-[#F8FAFC] border border-white/[0.08]'
                  }`}
                >
                  {cat.label} ({categoryCounts[cat.id] ?? cat.count})
                </button>
              );
            })}
          </div>

          {/* Previous / Pause / Next Controls (DOM order before track) */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <span className="text-xs font-mono text-[#94A3B8] mr-1 tabular-nums">
              {currentIndex + 1} / {displayedGames.length}
            </span>

            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
              className="min-w-[36px] min-h-[36px] p-2 rounded-xl bg-[#131B38] hover:bg-[#1E2A52] border border-white/[0.1] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#12E2C4]"
            >
              {userPaused ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => scrollToSlide(currentIndex - 1, true)}
              aria-label="Previous game slide"
              className="min-w-[36px] min-h-[36px] p-2 rounded-xl bg-[#131B38] hover:bg-[#1E2A52] border border-white/[0.1] text-[#F8FAFC] transition-colors flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#12E2C4]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSlide(currentIndex + 1, true)}
              aria-label="Next game slide"
              className="min-w-[36px] min-h-[36px] p-2 rounded-xl bg-[#131B38] hover:bg-[#1E2A52] border border-white/[0.1] text-[#F8FAFC] transition-colors flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#12E2C4]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Auto-Scrolling Horizontal Peek Track (pauses only when cursor hovers on it) */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            ref={trackRef}
            tabIndex={0}
            role="group"
            aria-label="Games carousel track"
            className="relative games-carousel-track gap-4 sm:gap-5 pb-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#12E2C4] rounded-2xl"
          >
            {displayedGames.map((game, index) => {
              const feeSummary = getFeeSummary(game);
              return (
                <article
                  key={game.id}
                  data-carousel-slide
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${displayedGames.length}: ${game.name}`}
                  className="w-[80%] sm:w-[46%] lg:w-[31%] xl:w-[24%] shrink-0 snap-start rounded-2xl overflow-hidden bg-[#131B38] border border-white/[0.08] hover:border-white/[0.22] transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Media Header */}
                    <div className="relative h-36 w-full overflow-hidden bg-black">
                      <img
                        src={game.image}
                        alt={game.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover object-center opacity-75"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#131B38] via-transparent to-black/45" />

                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-black/70 border border-white/[0.1] text-[10px] font-mono font-semibold text-[#12E2C4]">
                        {game.categoryLabel}
                      </span>

                      <div
                        className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/70 border border-white/[0.1] flex items-center justify-center"
                        style={{ color: game.accentColor }}
                      >
                        <SportIcon name={game.iconKey} size={16} />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#94A3B8] mb-1.5">
                        <span>{getDivisionLabel(game.division)}</span>
                        <span className="inline-flex items-center gap-1 text-[#F8FAFC]">
                          <Users className="w-3 h-3 text-[#12E2C4]" />
                          {getCompactPlayerLabel(game)}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold font-['Space_Grotesk'] text-[#F8FAFC] leading-snug line-clamp-1">
                        {game.name}
                      </h3>

                      <p className="mt-1.5 text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
                        {game.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-[#F8FAFC]">
                      {feeSummary}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveModalGame(game)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold text-[#94A3B8] hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
                      >
                        Details
                      </button>

                      <Link
                        href={`/register?game=${encodeURIComponent(game.name)}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] transition-colors"
                      >
                        <span>Register</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}

            {/* Final View All End-Card */}
            <Link
              href={viewAllHref}
              className="w-[72%] sm:w-[40%] lg:w-[26%] shrink-0 snap-start rounded-2xl bg-[#131B38] border border-dashed border-[#12E2C4]/40 hover:border-[#12E2C4] p-6 flex flex-col items-center justify-center text-center gap-3 transition-colors group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#12E2C4]/15 border border-[#12E2C4]/30 flex items-center justify-center text-[#12E2C4]">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <div className="text-base font-bold font-['Space_Grotesk'] text-[#F8FAFC]">
                  Explore Full Directory
                </div>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Filter all {liveGames.length} disciplines by division, team size & fee
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#12E2C4]">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>

        {/* Visually hidden polite status region for screen readers */}
        <p className="sr-only" role="status" aria-live="polite">
          {statusMessage}
        </p>
      </div>

      {/* Accessible Native Dialog Modal */}
      <GameDossierModal game={activeModalGame} onClose={() => setActiveModalGame(null)} />
    </section>
  );
}
