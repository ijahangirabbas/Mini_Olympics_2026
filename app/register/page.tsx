'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  Circle,
  Copy,
  Users,
  Tag,
  Lock,
  Mail,
  ArrowLeft,
  ArrowRight,
  Shield,
  Trophy,
  DollarSign,
  AlertCircle,
  Check,
  X,
  CreditCard,
  QrCode,
  Sparkles,
} from 'lucide-react';
import {
  gamesPricing as defaultGamesPricing,
  getAvailableGames as defaultGetAvailableGames,
  isTeamGame as defaultIsTeamGame,
  getRequiredPlayers as defaultGetRequiredPlayers,
} from '@/lib/games-pricing';

type TeamMember = {
  name: string;
  rollNumber: string;
  contactNumber: string;
};

type GamePrice = {
  name: string;
  boys: number | null;
  girls: number | null;
  boysPlayers?: number;
  girlsPlayers?: number;
};

type FormData = {
  email: string;
  name: string;
  rollNumber: string;
  contactNumber: string;
  alternativeContactNumber: string;
  gender: 'boys' | 'girls' | '';
  teamName: string;
  selectedGames: string[];
  teamMembers: Record<string, TeamMember[]>;
  paymentMethod: 'cash' | 'online' | '';
  transactionId: string;
  screenshotUrl: string;
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedGame = searchParams?.get('game') || '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [accountCopied, setAccountCopied] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    rollNumber: '',
    contactNumber: '',
    alternativeContactNumber: '',
    gender: '',
    teamName: '',
    selectedGames: [],
    teamMembers: {},
    paymentMethod: '',
    transactionId: '',
    screenshotUrl: '',
  });

  const [allGames, setAllGames] = useState<GamePrice[]>(defaultGamesPricing);
  const [availableGames, setAvailableGames] = useState<GamePrice[]>(defaultGamesPricing);
  const [sportGroups, setSportGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [teamNameStatus, setTeamNameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [teamNameError, setTeamNameError] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);

  const cashPaymentEnabled = process.env.NEXT_PUBLIC_CASH_PAYMENT_ENABLED === 'true';

  // Fetch whether registrations are open
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/public/registration-status', { cache: 'no-store' });
        const data = await res.json();
        setRegistrationOpen(data.success && data.open === true);
      } catch {
        setRegistrationOpen(true);
      }
    };
    fetchStatus();
  }, []);

  // Fetch games from database on mount
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch(`/api/games?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setAllGames(data.data);
        }
      } catch (e) {
        console.error('Failed to load games, using defaults:', e);
      }
    };
    fetchGames();
  }, []);

  // Pre-select game if passed in URL
  useEffect(() => {
    if (preselectedGame && availableGames.length > 0) {
      const match = availableGames.find((g) => g.name.toLowerCase() === preselectedGame.toLowerCase());
      if (match && !formData.selectedGames.includes(match.name)) {
        setFormData((prev) => ({
          ...prev,
          selectedGames: [...prev.selectedGames, match.name],
        }));
      }
    }
  }, [preselectedGame, availableGames]);

  // Helper functions
  const getAvailableGamesForGender = (gender: 'boys' | 'girls'): GamePrice[] => {
    return allGames.filter((game) => {
      return gender === 'boys' ? game.boys !== null : game.girls !== null;
    });
  };

  const getGamePrice = (gameName: string, gender: 'boys' | 'girls'): number | null => {
    const game = allGames.find((g) => g.name === gameName);
    if (!game) return null;
    return gender === 'boys' ? game.boys : game.girls;
  };

  const calculateTotal = (selectedGames: string[], gender: 'boys' | 'girls'): number => {
    let total = 0;
    selectedGames.forEach((gameName) => {
      const price = getGamePrice(gameName, gender);
      if (price !== null) {
        total += price;
      }
    });
    return total;
  };

  const getRequiredPlayers = (gameName: string, gender: 'boys' | 'girls'): number | null => {
    const game = allGames.find((g) => g.name === gameName);
    if (!game) return null;
    return gender === 'boys' ? game.boysPlayers || null : game.girlsPlayers || null;
  };

  const isTeamGame = (gameName: string, gender: 'boys' | 'girls'): boolean => {
    const requiredPlayers = getRequiredPlayers(gameName, gender);
    return requiredPlayers !== null && requiredPlayers > 1;
  };

  useEffect(() => {
    if (formData.gender) {
      setAvailableGames(getAvailableGamesForGender(formData.gender));
      setFormData((prev) => ({ ...prev, selectedGames: [], teamMembers: {} }));
      setSportGroups([]);
    }
  }, [formData.gender, allGames]);

  // When cash is disabled, ensure Online is selected
  useEffect(() => {
    if (step === 3 && !cashPaymentEnabled && formData.paymentMethod !== 'online') {
      setFormData((prev) => ({ ...prev, paymentMethod: 'online' }));
    }
  }, [step, cashPaymentEnabled, formData.paymentMethod]);

  // Fetch sport groups for selected games
  useEffect(() => {
    const fetchGroups = async () => {
      if (!formData.gender || formData.selectedGames.length === 0) {
        setSportGroups([]);
        return;
      }
      setGroupsLoading(true);
      try {
        const params = new URLSearchParams({
          games: formData.selectedGames.join(','),
          regNum: '',
          name: formData.name || '',
          roll: formData.rollNumber || '',
          phone: formData.contactNumber || '',
          gender: formData.gender,
        });
        const res = await fetch(`/api/groups?${params.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setSportGroups(data.data || []);
        }
      } catch (e) {
        console.error('Failed to load groups:', e);
      } finally {
        setGroupsLoading(false);
      }
    };
    fetchGroups();
  }, [formData.selectedGames, formData.gender, formData.name, formData.rollNumber, formData.contactNumber]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'teamName') {
      setTeamNameStatus('idle');
      setTeamNameError('');
    }
  };

  // Check team name uniqueness
  const checkTeamName = async () => {
    const teamName = formData.teamName.trim();
    if (!teamName || teamName.length < 2) {
      setTeamNameError('Team name must be at least 2 characters');
      setTeamNameStatus('idle');
      return false;
    }

    setTeamNameStatus('checking');
    setTeamNameError('');

    try {
      const res = await fetch('/api/registrations/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.isUnique) {
          setTeamNameStatus('available');
          setTeamNameError('');
          return true;
        } else {
          setTeamNameStatus('taken');
          setTeamNameError(data.message || 'Team name already taken');
          return false;
        }
      } else {
        setTeamNameError(data.error || 'Failed to verify team name');
        setTeamNameStatus('idle');
        return false;
      }
    } catch (e) {
      console.error('Team name check failed:', e);
      setTeamNameError('Failed to verify team name');
      setTeamNameStatus('idle');
      return false;
    }
  };

  const handleGameToggle = (gameName: string) => {
    setFormData((prev) => {
      const isSelected = prev.selectedGames.includes(gameName);
      if (isSelected) {
        const newTeamMembers = { ...prev.teamMembers };
        delete newTeamMembers[gameName];
        return {
          ...prev,
          selectedGames: prev.selectedGames.filter((g) => g !== gameName),
          teamMembers: newTeamMembers,
        };
      } else {
        const newTeamMembers = { ...prev.teamMembers };
        if (formData.gender && isTeamGame(gameName, formData.gender)) {
          const requiredPlayers = getRequiredPlayers(gameName, formData.gender) || 0;
          newTeamMembers[gameName] = Array(requiredPlayers - 1)
            .fill(null)
            .map(() => ({
              name: '',
              rollNumber: '',
              contactNumber: '',
            }));
        }
        return {
          ...prev,
          selectedGames: [...prev.selectedGames, gameName],
          teamMembers: newTeamMembers,
        };
      }
    });
  };

  const handleTeamMemberChange = (gameName: string, index: number, field: keyof TeamMember, value: string) => {
    setFormData((prev) => {
      const newTeamMembers = { ...prev.teamMembers };
      if (!newTeamMembers[gameName]) {
        newTeamMembers[gameName] = [];
      }
      const updatedMembers = [...newTeamMembers[gameName]];
      updatedMembers[index] = {
        ...updatedMembers[index],
        [field]: value,
      };
      newTeamMembers[gameName] = updatedMembers;
      return { ...prev, teamMembers: newTeamMembers };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        screenshotUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const totalAmount =
    formData.gender && formData.selectedGames.length > 0
      ? calculateTotal(formData.selectedGames, formData.gender)
      : 0;

  const GAME_EXCLUDED_FROM_COUPON = 'Swimming';
  const swimmingPrice =
    formData.gender && formData.selectedGames.includes(GAME_EXCLUDED_FROM_COUPON)
      ? getGamePrice(GAME_EXCLUDED_FROM_COUPON, formData.gender) ?? 0
      : 0;
  const amountEligibleForDiscount = Math.max(0, totalAmount - swimmingPrice);
  const discountAmount =
    appliedCoupon && amountEligibleForDiscount > 0
      ? Math.round((amountEligibleForDiscount * appliedCoupon.discountPercent) / 100 * 100) / 100
      : 0;
  const finalAmount = totalAmount - discountAmount;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError('Enter a coupon code');
      return;
    }
    setValidatingCoupon(true);
    setCouponError('');
    setAppliedCoupon(null);
    try {
      const res = await fetch(
        `/api/coupons/validate?code=${encodeURIComponent(code)}&_t=${Date.now()}`,
        { cache: 'no-store', headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } }
      );
      const data = await res.json();
      if (data.valid && data.discountPercent) {
        setAppliedCoupon({ code: code.toUpperCase(), discountPercent: data.discountPercent });
        setCouponError('');
      } else {
        setAppliedCoupon(null);
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch {
      setAppliedCoupon(null);
      setCouponError('Could not validate coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const handleSubmit = async () => {
    if (appliedCoupon) {
      try {
        const res = await fetch(
          `/api/coupons/validate?code=${encodeURIComponent(appliedCoupon.code)}&_t=${Date.now()}`,
          { cache: 'no-store', headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } }
        );
        const data = await res.json();
        if (!data.valid || !data.discountPercent) {
          setAppliedCoupon(null);
          setCouponInput('');
          setCouponError(data.error || 'This coupon is no longer valid.');
          alert(data.error || 'This coupon is no longer valid. Please remove it and try again.');
          return;
        }
      } catch {
        setAppliedCoupon(null);
        setCouponInput('');
        setCouponError('Could not validate coupon. Please remove it and try again.');
        alert('Could not validate coupon. Please remove it and try again.');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          rollNumber: formData.rollNumber,
          contactNumber: formData.contactNumber,
          alternativeContactNumber: formData.alternativeContactNumber,
          gender: formData.gender,
          teamName: formData.teamName,
          selectedGames: formData.selectedGames,
          teamMembers: formData.teamMembers,
          paymentMethod: formData.paymentMethod,
          transactionId: formData.transactionId,
          screenshotUrl: formData.screenshotUrl,
          totalAmount,
          discount: discountAmount,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const params = new URLSearchParams({
          id: data.registrationId,
          slipId: data.slipId || '',
          method: formData.paymentMethod,
          total: finalAmount.toString(),
        });
        if (data.registrationNumber) {
          params.set('regNum', data.registrationNumber.toString());
        }
        if (formData.transactionId) {
          params.set('transactionId', formData.transactionId);
        }
        router.push(`/success?${params.toString()}`);
      } else {
        if (data.field === 'teamName') {
          setTeamNameStatus('taken');
          setTeamNameError(data.error);
          setStep(1);
          alert('Team name already exists! Please go back and choose a different team name.');
        } else if (data.field === 'couponCode') {
          setAppliedCoupon(null);
          setCouponInput('');
          setCouponError(data.error || 'This coupon is no longer valid. Please remove it or use a different code.');
          alert(data.error || 'This coupon is no longer valid. Please remove it and try again.');
        } else {
          alert('Registration failed: ' + data.error);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return (
        formData.email &&
        formData.name &&
        formData.rollNumber &&
        formData.contactNumber &&
        formData.gender &&
        formData.teamName &&
        teamNameStatus === 'available'
      );
    }
    if (step === 2) {
      return formData.selectedGames.length > 0;
    }
    if (step === 3) {
      if (!cashPaymentEnabled) {
        return formData.paymentMethod === 'online' && !!(formData.transactionId && formData.screenshotUrl);
      }
      return formData.paymentMethod && (formData.paymentMethod === 'cash' || (formData.transactionId && formData.screenshotUrl));
    }
    return true;
  };

  // Loading status state
  if (registrationOpen === null) {
    return (
      <div className="min-h-screen bg-[#101114] flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-[#D5F05B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#A4A5AA] tracking-widest uppercase">
            CONNECTING TO TOURNAMENT TERMINAL...
          </p>
        </div>
      </div>
    );
  }

  // Registrations closed state
  if (registrationOpen === false) {
    return (
      <div className="min-h-screen bg-[#101114] text-[#F4F1EA] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#161820] border border-white/[0.08] text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#F15A29]/15 border border-[#F15A29]/30 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-[#F15A29]" />
          </div>
          <h2 className="text-2xl font-black font-['Space_Grotesk'] uppercase mb-2">
            REGISTRATIONS ARE CLOSED
          </h2>
          <p className="text-sm text-[#A4A5AA] leading-relaxed mb-6 font-normal">
            The registration window for Mini Olympics 2026 is currently closed. For queries, contact the FCIT Sports Society.
          </p>
          <a
            href="mailto:sports.oc@pucit.edu.pk"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider text-[#101114] bg-[#D5F05B] uppercase"
          >
            <Mail className="w-4 h-4" />
            <span>sports.oc@pucit.edu.pk</span>
          </a>
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <Link href="/" className="text-xs font-mono text-[#A4A5AA] hover:text-white transition-colors">
              ← Return to Main Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stepLabels = [
    { number: '01', title: 'ATHLETE IDENTITY', desc: 'Captain & Team Specs' },
    { number: '02', title: 'DISCIPLINES', desc: 'Game Selection & Roster' },
    { number: '03', title: 'PAYMENT TERMINAL', desc: 'Bank Transfer / Cash Desk' },
    { number: '04', title: 'FINAL AUDIT', desc: 'Verification & Submit' },
  ];

  return (
    <div className="min-h-screen bg-[#101114] text-[#F4F1EA] selection:bg-[#D5F05B] selection:text-[#101114] py-10 px-4 sm:px-6 lg:px-8">
      {/* Background Lighting */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-[#F15A29]/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[500px] bg-[#D5F05B]/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#A4A5AA] hover:text-[#D5F05B] transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portal Overview</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D5F05B] animate-pulse" />
            <span className="text-xs font-mono text-[#D5F05B] tracking-widest uppercase">
              LIVE REGISTRATION ARENA
            </span>
          </div>
        </div>

        {/* Step Progress Milestone Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {stepLabels.map((st, i) => {
            const stepNum = i + 1;
            const isCompleted = step > stepNum;
            const isCurrent = step === stepNum;

            return (
              <div
                key={st.number}
                className={`relative p-3.5 rounded-2xl border transition-all ${isCurrent
                    ? 'bg-[#1C2028] border-[#D5F05B] shadow-lg shadow-[#D5F05B]/15'
                    : isCompleted
                      ? 'bg-[#14161C] border-[#D5F05B]/40 text-[#A4A5AA]'
                      : 'bg-[#14161C]/60 border-white/[0.06] text-[#A4A5AA]/50'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-mono font-bold ${isCurrent ? 'text-[#D5F05B]' : isCompleted ? 'text-[#D5F05B]' : 'text-white/30'
                      }`}
                  >
                    STEP {st.number}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#D5F05B]" />
                  ) : (
                    <Circle className="w-4 h-4 text-white/20" />
                  )}
                </div>
                <div className="font-bold text-xs sm:text-sm text-[#F4F1EA] font-['Space_Grotesk'] uppercase">
                  {st.title}
                </div>
                <div className="text-[10px] text-[#A4A5AA] font-mono truncate">{st.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Main Content Box */}
        <div className="p-6 sm:p-10 rounded-3xl bg-[#161820] border border-white/[0.08] shadow-2xl relative">
          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1B1D21] border border-white/[0.08] text-xs font-mono text-[#D5F05B] uppercase tracking-wider mb-2">
                  <span>// STEP 01: ATHLETE & SQUAD IDENTITY</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#F4F1EA] uppercase font-['Space_Grotesk']">
                  Captain & Participant Information
                </h2>
                <p className="text-xs sm:text-sm text-[#A4A5AA] font-mono mt-1">
                  Enter your official university student credentials. You will act as the team captain.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div>
                  <Label htmlFor="email" className="text-xs font-mono text-[#A4A5AA] uppercase">
                    University Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="student@pucit.edu.pk"
                    className="mt-1.5 bg-[#101114] border-white/[0.1] text-sm text-[#F4F1EA] rounded-xl focus:border-[#D5F05B]"
                  />
                </div>

                <div>
                  <Label htmlFor="name" className="text-xs font-mono text-[#A4A5AA] uppercase">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. RANA ABDUL REHMAN"
                    className="mt-1.5 bg-[#101114] border-white/[0.1] text-sm text-[#F4F1EA] rounded-xl focus:border-[#D5F05B]"
                  />
                </div>

                <div>
                  <Label htmlFor="rollNumber" className="text-xs font-mono text-[#A4A5AA] uppercase">
                    PUCIT Roll Number *
                  </Label>
                  <Input
                    id="rollNumber"
                    value={formData.rollNumber}
                    onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                    placeholder="e.g. BCSF23M032"
                    className="mt-1.5 bg-[#101114] border-white/[0.1] text-sm text-[#F4F1EA] rounded-xl focus:border-[#D5F05B]"
                  />
                </div>

                <div>
                  <Label htmlFor="gender" className="text-xs font-mono text-[#A4A5AA] uppercase">
                    Competition Division (Gender) *
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                  >
                    <SelectTrigger className="mt-1.5 bg-[#101114] border-white/[0.1] text-sm text-[#F4F1EA] rounded-xl focus:border-[#D5F05B]">
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181B22] border-white/[0.1] text-[#F4F1EA]">
                      <SelectItem value="boys">Boys Division</SelectItem>
                      <SelectItem value="girls">Girls Division</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="teamName" className="text-xs font-mono text-[#A4A5AA] uppercase">
                    Official Team Name *
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="teamName"
                      value={formData.teamName}
                      onChange={(e) => handleInputChange('teamName', e.target.value)}
                      placeholder="e.g. Cyber Strikers / PUCIT Titans"
                      className={`flex-1 bg-[#101114] border-white/[0.1] text-sm text-[#F4F1EA] rounded-xl ${teamNameStatus === 'taken'
                          ? 'border-red-500'
                          : teamNameStatus === 'available'
                            ? 'border-[#D5F05B]'
                            : ''
                        }`}
                    />
                    <Button
                      type="button"
                      onClick={checkTeamName}
                      disabled={!formData.teamName.trim() || teamNameStatus === 'checking'}
                      className="px-6 rounded-xl text-xs font-mono font-bold tracking-wider text-[#101114] bg-[#D5F05B] hover:bg-[#c2de4a]"
                    >
                      {teamNameStatus === 'checking' ? 'CHECKING...' : 'CHECK AVAILABILITY'}
                    </Button>
                  </div>

                  {teamNameStatus === 'available' && (
                    <p className="text-xs text-[#D5F05B] font-mono mt-1.5 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Team name is available for registration!
                    </p>
                  )}
                  {teamNameStatus === 'taken' && (
                    <p className="text-xs text-red-500 font-mono mt-1.5 flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5" />
                      {teamNameError}
                    </p>
                  )}
                  {teamNameStatus === 'idle' && (
                    <p className="text-xs text-[#A4A5AA]/70 font-mono mt-1">
                      Choose a unique name and verify before proceeding.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactNumber" className="text-xs font-mono text-[#A4A5AA] uppercase">
                    Primary WhatsApp Contact *
                  </Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    placeholder="0300-1234567"
                    className="mt-1.5 bg-[#101114] border-white/[0.1] text-sm text-[#F4F1EA] rounded-xl focus:border-[#D5F05B]"
                  />
                </div>

                <div>
                  <Label htmlFor="altContact" className="text-xs font-mono text-[#A4A5AA] uppercase">
                    Alternative Contact (Optional)
                  </Label>
                  <Input
                    id="altContact"
                    type="tel"
                    value={formData.alternativeContactNumber}
                    onChange={(e) => handleInputChange('alternativeContactNumber', e.target.value)}
                    placeholder="0321-7654321"
                    className="mt-1.5 bg-[#101114] border-white/[0.1] text-sm text-[#F4F1EA] rounded-xl focus:border-[#D5F05B]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Game Selection & Team Roster */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1B1D21] border border-white/[0.08] text-xs font-mono text-[#D5F05B] uppercase tracking-wider mb-2">
                    <span>// STEP 02: DISCIPLINES & ROSTER</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#F4F1EA] uppercase font-['Space_Grotesk']">
                    Select Your Events
                  </h2>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[#101114] border border-white/[0.08] text-xs font-mono text-[#D5F05B]">
                  Division: <span className="font-bold uppercase">{formData.gender}</span>
                </div>
              </div>

              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
                {availableGames.map((game) => {
                  const price = formData.gender === 'boys' ? game.boys : game.girls;
                  const isSelected = formData.selectedGames.includes(game.name);
                  if (price === null) return null;

                  return (
                    <div
                      key={game.name}
                      onClick={() => handleGameToggle(game.name)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${isSelected
                          ? 'bg-[#1F2430] border-[#D5F05B] shadow-md shadow-[#D5F05B]/15'
                          : 'bg-[#101114] border-white/[0.07] hover:border-white/[0.2]'
                        }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-[#F4F1EA] font-['Space_Grotesk']">{game.name}</div>
                        <div className="text-xs font-mono text-[#A4A5AA] mt-0.5">
                          Rs. {price.toLocaleString()}
                          {formData.gender === 'boys' && game.boysPlayers && ` • ${game.boysPlayers} Players`}
                          {formData.gender === 'girls' && game.girlsPlayers && ` • ${game.girlsPlayers} Players`}
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${isSelected
                            ? 'bg-[#D5F05B] border-[#D5F05B] text-[#101114]'
                            : 'border-white/[0.2] text-transparent'
                          }`}
                      >
                        <Check className="w-4 h-4 font-black" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Team Member Roster Requirements */}
              {formData.selectedGames.map((gameName) => {
                if (!formData.gender || !isTeamGame(gameName, formData.gender)) return null;
                const requiredPlayers = getRequiredPlayers(gameName, formData.gender) || 0;
                const teamMembers = formData.teamMembers[gameName] || [];

                return (
                  <div key={gameName} className="p-5 rounded-2xl bg-[#101114] border border-[#F15A29]/30">
                    <h4 className="font-bold text-sm sm:text-base text-[#F4F1EA] font-['Space_Grotesk'] uppercase mb-1">
                      {gameName} — SQUAD ROSTER ({requiredPlayers} PLAYERS TOTAL)
                    </h4>
                    <p className="text-xs text-[#A4A5AA] font-mono mb-4">
                      You are Captain ({formData.name || 'Yourself'}). Please add the remaining {requiredPlayers - 1} team members:
                    </p>

                    <div className="space-y-3">
                      {teamMembers.map((member, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#161820] border border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Input
                            value={member.name}
                            onChange={(e) => handleTeamMemberChange(gameName, idx, 'name', e.target.value)}
                            placeholder={`Player ${idx + 2} Full Name`}
                            className="bg-[#101114] border-white/[0.08] text-xs text-[#F4F1EA] rounded-lg"
                          />
                          <Input
                            value={member.rollNumber}
                            onChange={(e) => handleTeamMemberChange(gameName, idx, 'rollNumber', e.target.value)}
                            placeholder="Roll Number (e.g. BCSF22M...)"
                            className="bg-[#101114] border-white/[0.08] text-xs text-[#F4F1EA] rounded-lg"
                          />
                          <Input
                            value={member.contactNumber}
                            onChange={(e) => handleTeamMemberChange(gameName, idx, 'contactNumber', e.target.value)}
                            placeholder="Contact Number (03XX...)"
                            className="bg-[#101114] border-white/[0.08] text-xs text-[#F4F1EA] rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 3: Payment Terminal */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1B1D21] border border-white/[0.08] text-xs font-mono text-[#D5F05B] uppercase tracking-wider mb-2">
                  <span>// STEP 03: PAYMENT TERMINAL</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#F4F1EA] uppercase font-['Space_Grotesk']">
                  Complete Your Payment
                </h2>
              </div>

              {/* Coupon Code Section */}
              <div className="p-4 rounded-2xl bg-[#101114] border border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs font-mono text-[#D5F05B] mb-2 uppercase">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Promotional Coupon Code</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#D5F05B]/10 border border-[#D5F05B]/30">
                    <span className="text-xs font-mono font-bold text-[#D5F05B]">
                      COUPON {appliedCoupon.code} APPLIED ({appliedCoupon.discountPercent}% OFF)
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-mono text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 max-w-sm">
                    <Input
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      placeholder="ENTER CODE"
                      className="bg-[#161820] border-white/[0.1] text-xs font-mono text-[#F4F1EA] uppercase rounded-xl"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponInput.trim()}
                      className="rounded-xl text-xs font-mono font-bold text-[#101114] bg-[#D5F05B] hover:bg-[#c2de4a]"
                    >
                      {validatingCoupon ? 'VERIFYING...' : 'APPLY'}
                    </Button>
                  </div>
                )}
                {couponError && <p className="text-xs text-red-500 font-mono mt-1.5">{couponError}</p>}
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                {/* Online Payment Card */}
                <div
                  onClick={() => handleInputChange('paymentMethod', 'online')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${formData.paymentMethod === 'online'
                      ? 'bg-[#1C2028] border-[#D5F05B] shadow-xl shadow-[#D5F05B]/10'
                      : 'bg-[#101114] border-white/[0.08] hover:border-white/[0.2]'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-[#D5F05B]" />
                      <span className="font-bold text-sm sm:text-base text-[#F4F1EA] font-['Space_Grotesk'] uppercase">
                        Online Transfer (Easypaisa / Bank)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D5F05B]/15 text-[#D5F05B]">
                      RECOMMENDED
                    </span>
                  </div>

                  {formData.paymentMethod === 'online' && (
                    <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-4">
                      {/* Bank Details Box */}
                      <div className="p-4 rounded-xl bg-[#101114] border border-white/[0.08] space-y-2.5 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#A4A5AA]">Bank / Provider:</span>
                          <span className="font-bold text-[#F4F1EA]">Easypaisa</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#A4A5AA]">Account Title:</span>
                          <span className="font-bold text-[#F4F1EA]">Muhammad Moin U Din</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                          <span className="text-[#A4A5AA]">Account Number:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#D5F05B]">03028791634</span>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText('03028791634');
                                  setAccountCopied(true);
                                  setTimeout(() => setAccountCopied(false), 2000);
                                } catch { }
                              }}
                              className="px-2 py-0.5 rounded text-[10px] bg-white/[0.08] text-white hover:bg-white/[0.15]"
                            >
                              {accountCopied ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-[11px]">
                          Transfer exact amount (<strong>Rs. {finalAmount.toLocaleString()}</strong>) and upload your payment proof screenshot below.
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="txId" className="text-xs font-mono text-[#A4A5AA] uppercase">
                          Bank Transaction ID / Reference *
                        </Label>
                        <Input
                          id="txId"
                          value={formData.transactionId}
                          onChange={(e) => handleInputChange('transactionId', e.target.value)}
                          placeholder="e.g. 2389104829"
                          className="mt-1 bg-[#101114] border-white/[0.1] text-xs font-mono text-[#F4F1EA] rounded-xl"
                        />
                      </div>

                      <div>
                        <Label htmlFor="proof" className="text-xs font-mono text-[#A4A5AA] uppercase">
                          Upload Payment Proof Screenshot *
                        </Label>
                        <Input
                          id="proof"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="mt-1 bg-[#101114] border-white/[0.1] text-xs text-[#F4F1EA] rounded-xl file:bg-[#181B22] file:text-white file:border-0 file:rounded-lg file:mr-3"
                        />
                        {formData.screenshotUrl && (
                          <p className="text-xs text-[#D5F05B] font-mono mt-1.5 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Receipt proof attached successfully.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cash Payment Card (if enabled) */}
                {cashPaymentEnabled && (
                  <div
                    onClick={() => handleInputChange('paymentMethod', 'cash')}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${formData.paymentMethod === 'cash'
                        ? 'bg-[#1C2028] border-[#D5F05B] shadow-xl shadow-[#D5F05B]/10'
                        : 'bg-[#101114] border-white/[0.08] hover:border-white/[0.2]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className="w-5 h-5 text-[#F15A29]" />
                      <span className="font-bold text-sm sm:text-base text-[#F4F1EA] font-['Space_Grotesk'] uppercase">
                        Cash Desk Payment (Slip Verification)
                      </span>
                    </div>

                    {formData.paymentMethod === 'cash' && (
                      <div className="mt-3 pt-3 border-t border-white/[0.08] text-xs font-mono text-[#A4A5AA]">
                        An instant Cash Slip ID will be generated upon submission. Present your slip ID or QR code at the FCIT Sports Society registration desk to complete payment.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Review and Submit */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1B1D21] border border-white/[0.08] text-xs font-mono text-[#D5F05B] uppercase tracking-wider mb-2">
                  <span>// STEP 04: FINAL AUDIT & CONFIRMATION</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#F4F1EA] uppercase font-['Space_Grotesk']">
                  Review Registration Details
                </h2>
              </div>

              <div className="p-6 rounded-2xl bg-[#101114] border border-white/[0.08] space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-white/[0.06]">
                  <div>
                    <span className="text-[#A4A5AA] block">ATHLETE NAME</span>
                    <span className="text-sm font-bold text-[#F4F1EA]">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-[#A4A5AA] block">ROLL NUMBER</span>
                    <span className="text-sm font-bold text-[#F4F1EA]">{formData.rollNumber}</span>
                  </div>
                  <div>
                    <span className="text-[#A4A5AA] block">OFFICIAL TEAM NAME</span>
                    <span className="text-sm font-bold text-[#D5F05B]">{formData.teamName}</span>
                  </div>
                  <div>
                    <span className="text-[#A4A5AA] block">DIVISION & CONTACT</span>
                    <span className="text-sm font-bold text-[#F4F1EA] uppercase">
                      {formData.gender} • {formData.contactNumber}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[#A4A5AA] block mb-2">SELECTED DISCIPLINES ({formData.selectedGames.length})</span>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedGames.map((g) => (
                      <span key={g} className="px-3 py-1 rounded-lg bg-[#181B22] border border-white/[0.08] text-[#F4F1EA] font-semibold text-xs">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.06] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#A4A5AA]">Subtotal:</span>
                    <span className="font-bold text-[#F4F1EA]">Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-[#D5F05B]">
                      <span>Discount ({appliedCoupon.code} - {appliedCoupon.discountPercent}%):</span>
                      <span>- Rs. {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-white/[0.08] text-sm">
                    <span className="font-bold text-white uppercase">Final Payable Amount:</span>
                    <span className="font-black text-lg text-[#D5F05B]">
                      Rs. {finalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-mono font-bold tracking-wider uppercase bg-transparent text-[#A4A5AA] hover:text-white border-white/[0.1] hover:border-white/[0.2]"
            >
              PREVIOUS STEP
            </Button>

            {step < 4 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-mono font-black tracking-wider text-[#101114] bg-[#D5F05B] hover:bg-[#c2de4a] uppercase transition-all shadow-lg shadow-[#D5F05B]/20"
              >
                PROCEED TO STEP {step + 1} →
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="w-full sm:w-auto px-10 py-3.5 rounded-xl text-xs font-mono font-black tracking-wider text-[#101114] bg-[#D5F05B] hover:bg-[#c2de4a] uppercase transition-all shadow-xl shadow-[#D5F05B]/30"
              >
                {loading ? 'SUBMITTING TO DATABASE...' : 'SUBMIT REGISTRATION NOW ✦'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#101114] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#D5F05B] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
