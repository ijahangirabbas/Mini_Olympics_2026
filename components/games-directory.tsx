'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpDown,
  ArrowUpRight,
  Check,
  Info,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import {
  CATEGORIES,
  DivisionFilter,
  GameInfo,
  SortOption,
  SportCategory,
  TeamSizeFilter,
  getCompactPlayerLabel,
  getDivisionLabel,
  getFeeSummary,
  getLowestFee,
  getMaxPlayers,
  matchesDivisionFilter,
  matchesTeamSizeFilter,
  sortByCategoryOrder,
} from '@/lib/games-data';
import { useLiveGames } from '@/lib/use-live-games';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SportIcon } from './sport-icons';
import GameDossierModal from './game-dossier-modal';

const DIVISION_OPTIONS: { id: DivisionFilter; label: string }[] = [
  { id: 'all', label: 'All Divisions' },
  { id: 'boys_and_girls', label: 'Boys & Girls' },
  { id: 'boys_only', label: 'Boys Only' },
  { id: 'girls_only', label: 'Girls Only' },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'default', label: 'By Category (Recommended)' },
  { id: 'name_asc', label: 'Name (A – Z)' },
  { id: 'fee_asc', label: 'Entry Fee (Low to High)' },
  { id: 'fee_desc', label: 'Entry Fee (High to Low)' },
  { id: 'players_desc', label: 'Team Size (Largest First)' },
];

const TEAM_SIZE_OPTIONS: { id: TeamSizeFilter; label: string }[] = [
  { id: 'all', label: 'All Formats' },
  { id: 'solo', label: 'Solo (1p)' },
  { id: 'duo', label: 'Duo (2p)' },
  { id: 'squad', label: 'Squad (3p+)' },
];

type CardVariant = 'spotlight' | 'poster' | 'horizontal' | 'standard';

interface BentoSlot {
  variant: CardVariant;
  colSpanClass: string;
}

/**
 * Compute balanced 12-column Bento card assignments when a section has 5+ items
 * so every row sums cleanly to 12 columns on desktop without orphan slots.
 */
function assignBentoSlots(total: number): BentoSlot[] {
  if (total <= 4) {
    return Array.from({ length: total }, () => ({
      variant: 'standard',
      colSpanClass: '',
    }));
  }

  const slots: BentoSlot[] = [
    { variant: 'spotlight', colSpanClass: 'md:col-span-2 lg:col-span-8' },
    { variant: 'poster', colSpanClass: 'lg:col-span-4' },
  ];

  let remaining = total - 2;
  let blockIndex = 0;

  while (remaining > 0) {
    if (remaining === 4 || remaining === 2) {
      slots.push({ variant: 'horizontal', colSpanClass: 'md:col-span-2 lg:col-span-6' });
      slots.push({ variant: 'horizontal', colSpanClass: 'md:col-span-2 lg:col-span-6' });
      remaining -= 2;
    } else if (remaining >= 8 && blockIndex % 2 === 1) {
      slots.push({ variant: 'horizontal', colSpanClass: 'md:col-span-2 lg:col-span-6' });
      slots.push({ variant: 'horizontal', colSpanClass: 'md:col-span-2 lg:col-span-6' });
      remaining -= 2;
    } else {
      for (let i = 0; i < 3; i++) {
        slots.push({ variant: 'standard', colSpanClass: 'lg:col-span-4' });
      }
      remaining -= 3;
    }
    blockIndex++;
  }

  return slots;
}

function getSmallGridClass(count: number): string {
  if (count === 1) return 'grid grid-cols-1 max-w-md gap-5';
  if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2 max-w-4xl gap-5';
  if (count === 3) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5';
  return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5';
}

function isValidCategory(val: string | null): val is SportCategory | 'all' {
  return val === 'all' || CATEGORIES.some((c) => c.id === val);
}

function isValidDivision(val: string | null): val is DivisionFilter {
  return DIVISION_OPTIONS.some((d) => d.id === val);
}

function isValidSize(val: string | null): val is TeamSizeFilter {
  return TEAM_SIZE_OPTIONS.some((s) => s.id === val);
}

function isValidSort(val: string | null): val is SortOption {
  return SORT_OPTIONS.some((s) => s.id === val);
}

function CardActions({
  game,
  isSelected,
  onToggleSelect,
  onOpenInfo,
  compact = false,
}: {
  game: GameInfo;
  isSelected: boolean;
  onToggleSelect: (name: string) => void;
  onOpenInfo: (game: GameInfo) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => onOpenInfo(game)}
        className={`${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'} rounded-xl text-xs font-mono font-semibold text-[#94A3B8] hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-colors`}
      >
        Rules
      </button>

      <button
        type="button"
        onClick={() => onToggleSelect(game.name)}
        aria-pressed={isSelected}
        className={`${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'} rounded-xl text-xs font-mono font-semibold inline-flex items-center gap-1 border transition-colors ${
          isSelected
            ? 'bg-[#12E2C4]/15 text-[#12E2C4] border-[#12E2C4]/50'
            : 'bg-white/[0.05] text-[#F8FAFC] hover:bg-white/[0.1] border-white/[0.08]'
        }`}
      >
        {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        <span>{isSelected ? 'Selected' : 'Select'}</span>
      </button>

      <Link
        href={`/register?game=${encodeURIComponent(game.name)}`}
        className={`ml-auto inline-flex items-center justify-center gap-1 ${
          compact ? 'px-3 py-1.5' : 'px-3.5 py-2'
        } rounded-xl text-xs font-mono font-bold text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] transition-colors`}
      >
        <span>Register</span>
        <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function GameDirectoryCard({
  game,
  slot,
  isSelected,
  onToggleSelect,
  onOpenInfo,
}: {
  game: GameInfo;
  slot: BentoSlot;
  isSelected: boolean;
  onToggleSelect: (gameName: string) => void;
  onOpenInfo: (game: GameInfo) => void;
}) {
  const feeSummary = getFeeSummary(game);
  const borderClass = isSelected
    ? 'border-[#12E2C4] shadow-lg shadow-[#12E2C4]/10'
    : 'border-white/[0.08] hover:border-white/[0.22]';

  // 1. Spotlight wide card (lead card in 5+ groups)
  if (slot.variant === 'spotlight') {
    return (
      <article
        className={`${slot.colSpanClass} group rounded-3xl overflow-hidden bg-[#131B38] border ${borderClass} transition-colors grid grid-cols-1 md:grid-cols-12`}
      >
        <div className="relative min-h-[220px] md:col-span-6 overflow-hidden bg-black">
          <img
            src={game.image}
            alt={game.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center opacity-85 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#131B38]/90 via-transparent to-black/30" />
          <span
            className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/75 border border-white/[0.12] text-[10px] font-mono font-bold uppercase tracking-wider"
            style={{ color: game.accentColor }}
          >
            Featured · {game.categoryLabel}
          </span>
        </div>

        <div className="md:col-span-6 p-6 sm:p-7 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#94A3B8] mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08]">
                {getDivisionLabel(game.division)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#F8FAFC]">
                <Users className="w-3.5 h-3.5 text-[#12E2C4]" />
                {getCompactPlayerLabel(game)}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-[#F8FAFC] leading-tight">
              {game.name}
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-[#94A3B8] leading-relaxed line-clamp-3">
              {game.tagline}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-mono text-[#94A3B8]">
              <span className="inline-flex items-center gap-1.5 text-[#F8FAFC]">
                <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
                {game.venueNote}
              </span>
              <span className="text-white/20">•</span>
              <span>{game.matchFormat}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Entry Fee</span>
              <span className="text-lg sm:text-xl font-black font-['Space_Grotesk'] text-[#12E2C4]">
                {feeSummary}
              </span>
            </div>

            <CardActions
              game={game}
              isSelected={isSelected}
              onToggleSelect={onToggleSelect}
              onOpenInfo={onOpenInfo}
            />
          </div>
        </div>
      </article>
    );
  }

  // 2. Full-bleed dark poster card (paired beside spotlight)
  if (slot.variant === 'poster') {
    return (
      <article
        className={`${slot.colSpanClass} group relative rounded-3xl overflow-hidden bg-[#131B38] border ${borderClass} transition-colors flex flex-col justify-between min-h-[320px]`}
      >
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
          <img
            src={game.image}
            alt={game.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center opacity-50 group-hover:opacity-65 group-hover:scale-105 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1124] via-[#0B1124]/75 to-black/40" />
        </div>

        <div className="relative z-10 p-5 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-md bg-black/70 border border-white/[0.12] text-[10px] font-mono font-semibold text-[#F8FAFC]">
            {getDivisionLabel(game.division)}
          </span>
          <div
            className="w-9 h-9 rounded-xl bg-black/70 border border-white/[0.12] flex items-center justify-center"
            style={{ color: game.accentColor }}
          >
            <SportIcon name={game.iconKey} size={18} />
          </div>
        </div>

        <div className="relative z-10 p-5 pt-12 space-y-4">
          <div>
            <div className="text-[11px] font-mono text-[#12E2C4] mb-1">
              {game.matchFormat} · {getCompactPlayerLabel(game)}
            </div>
            <h3 className="text-2xl font-black font-['Space_Grotesk'] text-[#F8FAFC] leading-tight">
              {game.name}
            </h3>
            <p className="mt-1.5 text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
              {game.tagline}
            </p>
          </div>

          <div className="pt-3 border-t border-white/[0.1] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#94A3B8]">Entry Fee</span>
              <span className="font-bold text-[#F8FAFC]">
                {feeSummary}
              </span>
            </div>

            <CardActions
              game={game}
              isSelected={isSelected}
              onToggleSelect={onToggleSelect}
              onOpenInfo={onOpenInfo}
              compact
            />
          </div>
        </div>
      </article>
    );
  }

  // 3. Horizontal split card (breaks rhythm cleanly in 5+ groups)
  if (slot.variant === 'horizontal') {
    return (
      <article
        className={`${slot.colSpanClass} group rounded-2xl overflow-hidden bg-[#131B38] border ${borderClass} transition-colors flex flex-col sm:flex-row`}
      >
        <div className="relative h-40 sm:h-auto sm:w-44 lg:w-48 shrink-0 overflow-hidden bg-black">
          <img
            src={game.image}
            alt={game.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center opacity-80 group-hover:opacity-95 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent to-[#131B38]/60" />
          <div
            className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-black/75 border border-white/[0.1] flex items-center justify-center"
            style={{ color: game.accentColor }}
          >
            <SportIcon name={game.iconKey} size={16} />
          </div>
        </div>

        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#94A3B8] mb-1.5">
              <span>{getDivisionLabel(game.division)}</span>
              <span className="inline-flex items-center gap-1 text-[#F8FAFC]">
                <Users className="w-3 h-3 text-[#12E2C4]" />
                {getCompactPlayerLabel(game)}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold font-['Space_Grotesk'] text-[#F8FAFC] leading-snug">
              {game.name}
            </h3>

            <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
              {game.tagline}
            </p>
          </div>

          <div className="pt-3 border-t border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#94A3B8] truncate max-w-[65%]">{game.matchFormat}</span>
              <span className="font-bold text-[#F8FAFC] whitespace-nowrap">
                {feeSummary}
              </span>
            </div>

            <CardActions
              game={game}
              isSelected={isSelected}
              onToggleSelect={onToggleSelect}
              onOpenInfo={onOpenInfo}
              compact
            />
          </div>
        </div>
      </article>
    );
  }

  // 4. Standard vertical card (used in <=4 sections & 3-up Bento rows)
  return (
    <article
      className={`${slot.colSpanClass} group rounded-2xl overflow-hidden bg-[#131B38] border ${borderClass} transition-colors flex flex-col justify-between`}
    >
      <div>
        <div className="relative h-40 w-full overflow-hidden bg-black">
          <img
            src={game.image}
            alt={game.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center opacity-75 group-hover:opacity-90 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131B38] via-transparent to-black/45" />

          <span
            className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/75 border border-white/[0.1] text-[10px] font-mono font-semibold"
            style={{ color: game.accentColor }}
          >
            {game.categoryLabel}
          </span>

          <div
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/70 border border-white/[0.1] flex items-center justify-center"
            style={{ color: game.accentColor }}
          >
            <SportIcon name={game.iconKey} size={16} />
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#94A3B8] mb-2">
            <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
              {getDivisionLabel(game.division)}
            </span>
            <span className="inline-flex items-center gap-1 text-[#F8FAFC]">
              <Users className="w-3.5 h-3.5 text-[#12E2C4]" />
              {getCompactPlayerLabel(game)}
            </span>
          </div>

          <h3 className="text-xl font-bold font-['Space_Grotesk'] text-[#F8FAFC] leading-snug">
            {game.name}
          </h3>

          <p className="mt-1.5 text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
            {game.tagline}
          </p>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <span className="text-[#94A3B8] truncate max-w-[60%]">{game.matchFormat}</span>
            <span className="font-bold text-[#F8FAFC] whitespace-nowrap">
              {feeSummary}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-0">
        <CardActions
          game={game}
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
          onOpenInfo={onOpenInfo}
          compact
        />
      </div>
    </article>
  );
}

function GamesCollectionGrid({
  items,
  selectedGames,
  onToggleSelect,
  onOpenInfo,
}: {
  items: GameInfo[];
  selectedGames: string[];
  onToggleSelect: (name: string) => void;
  onOpenInfo: (game: GameInfo) => void;
}) {
  const slots = useMemo(() => assignBentoSlots(items.length), [items.length]);
  const isBento = items.length >= 5;

  return (
    <div
      className={
        isBento ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5' : getSmallGridClass(items.length)
      }
    >
      {items.map((game, index) => (
        <GameDirectoryCard
          key={game.id}
          game={game}
          slot={slots[index]}
          isSelected={selectedGames.includes(game.name)}
          onToggleSelect={onToggleSelect}
          onOpenInfo={onOpenInfo}
        />
      ))}
    </div>
  );
}

export default function GamesDirectory() {
  const { games: liveGames } = useLiveGames();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<SportCategory | 'all'>(() => {
    const param = searchParams?.get('category') ?? null;
    return isValidCategory(param) ? param : 'all';
  });
  const [division, setDivision] = useState<DivisionFilter>(() => {
    const param = searchParams?.get('division') ?? null;
    return isValidDivision(param) ? param : 'all';
  });
  const [teamSize, setTeamSize] = useState<TeamSizeFilter>(() => {
    const param = searchParams?.get('size') ?? null;
    return isValidSize(param) ? param : 'all';
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const param = searchParams?.get('sort') ?? null;
    return isValidSort(param) ? param : 'default';
  });
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams?.get('q') ?? '');

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [activeModalGame, setActiveModalGame] = useState<GameInfo | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (division !== 'all') params.set('division', division);
    if (teamSize !== 'all') params.set('size', teamSize);
    if (sortBy !== 'default') params.set('sort', sortBy);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());

    const qs = params.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    router.replace(target, { scroll: false });
  }, [category, division, teamSize, sortBy, searchQuery, pathname, router]);

  const matchesNonCategoryFilters = useCallback(
    (game: GameInfo) => {
      if (!matchesDivisionFilter(game, division)) return false;
      if (!matchesTeamSizeFilter(game, teamSize)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const haystacks = [game.name, game.categoryLabel, game.tagline, game.venueNote, game.matchFormat];
        if (!haystacks.some((text) => text?.toLowerCase().includes(q))) {
          return false;
        }
      }
      return true;
    },
    [division, teamSize, searchQuery]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    CATEGORIES.forEach((c) => {
      counts[c.id] = 0;
    });

    liveGames.forEach((game) => {
      if (matchesNonCategoryFilters(game)) {
        counts.all += 1;
        counts[game.category] = (counts[game.category] || 0) + 1;
      }
    });

    return counts;
  }, [matchesNonCategoryFilters, liveGames]);

  const filteredGames = useMemo(() => {
    const list = liveGames.filter((game) => {
      if (category !== 'all' && game.category !== category) return false;
      return matchesNonCategoryFilters(game);
    });

    switch (sortBy) {
      case 'fee_asc':
        return [...list].sort(
          (a, b) => getLowestFee(a) - getLowestFee(b) || a.name.localeCompare(b.name)
        );
      case 'fee_desc':
        return [...list].sort(
          (a, b) => getLowestFee(b) - getLowestFee(a) || a.name.localeCompare(b.name)
        );
      case 'name_asc':
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      case 'players_desc':
        return [...list].sort(
          (a, b) => getMaxPlayers(b) - getMaxPlayers(a) || a.name.localeCompare(b.name)
        );
      case 'default':
      default:
        return sortByCategoryOrder(list);
    }
  }, [category, matchesNonCategoryFilters, sortBy, liveGames]);

  const showGroupedView =
    category === 'all' && sortBy === 'default' && !searchQuery.trim() && filteredGames.length > 0;

  const hasActiveFilters =
    category !== 'all' || division !== 'all' || teamSize !== 'all' || sortBy !== 'default' || searchQuery.trim() !== '';

  const resetFilters = () => {
    setCategory('all');
    setDivision('all');
    setTeamSize('all');
    setSortBy('default');
    setSearchQuery('');
  };

  const toggleSelectGame = (gameName: string) => {
    setSelectedGames((prev) =>
      prev.includes(gameName) ? prev.filter((g) => g !== gameName) : [...prev, gameName]
    );
  };

  const selectedEstimatedTotal = useMemo(() => {
    return selectedGames.reduce((sum, name) => {
      const found = liveGames.find((g) => g.name === name);
      return sum + (found ? getLowestFee(found) : 0);
    }, 0);
  }, [selectedGames, liveGames]);

  return (
    <div className="min-h-screen bg-[#0B1124] text-[#F8FAFC]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-28">
        {/* Directory Title & Summary */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-white/[0.08]">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase font-['Space_Grotesk'] leading-none">
              All Championship Disciplines
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-[#94A3B8] max-w-2xl">
              Showing {filteredGames.length} of {liveGames.length} events across {CATEGORIES.length} categories. Select events to pre-fill your registration.
            </p>
          </div>
        </div>

        {/* Non-Sticky Search & Filter Toolbar (scrolls naturally with the page) */}
        <div className="mt-6 p-4 rounded-2xl bg-[#131B38] border border-white/[0.1] space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games, formats, or venues (e.g. Cricket, PUBG, Chess)..."
                aria-label="Search disciplines"
                className="w-full bg-[#0B1124] text-[#F8FAFC] text-xs sm:text-sm font-mono pl-10 pr-9 py-2.5 rounded-xl border border-white/[0.1] placeholder:text-[#94A3B8]/60 focus:outline-none focus:border-[#12E2C4]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white p-0.5"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((v) => !v)}
                aria-expanded={mobileFiltersOpen}
                className="sm:hidden flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1124] border border-white/[0.1] text-xs font-mono text-[#F8FAFC]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#12E2C4]" />
                <span>Filters</span>
              </button>

              <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                <SelectTrigger
                  id="games-sort"
                  aria-label="Sort disciplines"
                  className="w-full sm:w-auto min-w-[235px] h-[42px] bg-[#0B1124] hover:bg-[#161922] text-[#F8FAFC] text-xs font-mono px-3.5 py-2.5 rounded-xl border border-white/[0.12] hover:border-white/[0.25] focus:ring-1 focus:ring-[#12E2C4] focus:ring-offset-0 focus:border-[#12E2C4] transition-colors gap-2"
                >
                  <span className="inline-flex items-center gap-2 truncate">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#12E2C4] shrink-0" />
                    <SelectValue placeholder="Sort disciplines" />
                  </span>
                </SelectTrigger>
                <SelectContent
                  align="end"
                  className="bg-[#131B38] border border-white/[0.15] text-[#F8FAFC] rounded-xl shadow-2xl shadow-black/80 p-1.5 backdrop-blur-xl min-w-[240px]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.id}
                      value={opt.id}
                      className="rounded-lg text-xs font-mono py-2.5 pl-8 pr-3 cursor-pointer text-[#94A3B8] focus:bg-[#12E2C4]/15 focus:text-[#12E2C4] data-[state=checked]:text-[#12E2C4] data-[state=checked]:font-semibold"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2.5 rounded-xl text-xs font-mono text-[#F59E0B] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] whitespace-nowrap transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-colors ${
                category === 'all'
                  ? 'bg-[#12E2C4] text-[#0B1124]'
                  : 'bg-[#0B1124] text-[#94A3B8] hover:text-[#F8FAFC] border border-white/[0.08]'
              }`}
            >
              All Events ({categoryCounts.all})
            </button>

            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] ?? 0;
              const isActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#12E2C4] text-[#0B1124]'
                      : count === 0
                        ? 'bg-[#0B1124]/60 text-[#94A3B8]/40 border border-white/[0.04]'
                        : 'bg-[#0B1124] text-[#94A3B8] hover:text-[#F8FAFC] border border-white/[0.08]'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          <div
            className={`${
              mobileFiltersOpen ? 'flex' : 'hidden sm:flex'
            } flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-white/[0.06]`}
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-[#94A3B8] mr-1">Division:</span>
              {DIVISION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDivision(opt.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-colors ${
                    division === opt.id
                      ? 'bg-white/[0.15] text-white font-bold'
                      : 'bg-[#0B1124] text-[#94A3B8] hover:text-white border border-white/[0.06]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-[#94A3B8] mr-1">Format:</span>
              {TEAM_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTeamSize(opt.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-colors ${
                    teamSize === opt.id
                      ? 'bg-white/[0.15] text-white font-bold'
                      : 'bg-[#0B1124] text-[#94A3B8] hover:text-white border border-white/[0.06]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredGames.length === 0 && (
          <div className="mt-10 text-center py-20 px-4 rounded-3xl bg-[#131B38] border border-white/[0.08]">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#F59E0B]">
              <Info className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-[#F8FAFC]">
              No Disciplines Match Your Filters
            </h2>
            <p className="text-sm text-[#94A3B8] mt-2 font-mono max-w-md mx-auto">
              Try clearing your search query or switching to All Divisions.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 px-6 py-3 rounded-xl text-xs font-bold font-mono tracking-wider text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] uppercase transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Mode 1: Grouped by Category when browsing All Events */}
        {showGroupedView && (
          <div className="mt-10 space-y-14">
            {CATEGORIES.map((cat) => {
              const items = filteredGames.filter((g) => g.category === cat.id);
              if (items.length === 0) return null;

              return (
                <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 pb-3 border-b border-white/[0.08]">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2
                          id={`cat-${cat.id}`}
                          className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] uppercase text-[#F8FAFC]"
                        >
                          {cat.label}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#182244] border border-white/[0.1] text-xs font-mono text-[#12E2C4]">
                          {items.length}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">{cat.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className="self-start sm:self-auto text-xs font-mono text-[#12E2C4] hover:underline"
                    >
                      Focus {cat.label} →
                    </button>
                  </div>

                  <GamesCollectionGrid
                    items={items}
                    selectedGames={selectedGames}
                    onToggleSelect={toggleSelectGame}
                    onOpenInfo={setActiveModalGame}
                  />
                </section>
              );
            })}
          </div>
        )}

        {/* Mode 2: Unified Grid (auto-switches to Bento when >= 5 results) */}
        {!showGroupedView && filteredGames.length > 0 && (
          <div className="mt-10">
            <GamesCollectionGrid
              items={filteredGames}
              selectedGames={selectedGames}
              onToggleSelect={toggleSelectGame}
              onOpenInfo={setActiveModalGame}
            />
          </div>
        )}
      </main>

      {/* Multi-Event Quick Select Bar */}
      {selectedGames.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 max-w-3xl mx-auto rounded-2xl bg-[#131B38]/95 border border-[#12E2C4]/45 backdrop-blur-xl shadow-2xl px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold font-['Space_Grotesk'] text-[#F8FAFC]">
              {selectedGames.length} {selectedGames.length === 1 ? 'event' : 'events'} selected
              <span className="text-[#12E2C4] font-mono ml-2">
                · Est. Rs. {selectedEstimatedTotal.toLocaleString()}
              </span>
            </div>
            <div className="text-xs font-mono text-[#94A3B8] truncate max-w-md">
              {selectedGames.join(', ')}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedGames([])}
              className="px-3 py-2 rounded-xl text-xs font-mono text-[#94A3B8] hover:text-white bg-white/[0.05] border border-white/[0.08]"
            >
              Clear
            </button>
            <Link
              href={`/register?games=${encodeURIComponent(selectedGames.join(','))}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black font-['Space_Grotesk'] uppercase text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE]"
            >
              <span>Continue to Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      <GameDossierModal game={activeModalGame} onClose={() => setActiveModalGame(null)} />
    </div>
  );
}
