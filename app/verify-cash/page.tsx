'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  DollarSign,
  User,
  Phone,
  Mail,
  Lock,
  ArrowLeft,
  ShieldCheck,
  Search,
  Tag,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

type Registration = {
  id: string;
  registration_number: number;
  email: string;
  name: string;
  roll_number: string;
  contact_number: string;
  alternative_contact_number: string | null;
  gender: string;
  selected_games: string[] | string;
  total_amount: number;
  discount: number | null;
  coupon_code?: string | null;
  payment_method: string;
  slip_id: string;
  status: string;
  created_at: string;
};

function VerifyCashContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const regNum = searchParams?.get('regNum');
  const slipId = searchParams?.get('slipId');

  const [lookupQuery, setLookupQuery] = useState('');
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [discount, setDiscount] = useState<string>('0');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authenticated && (regNum || slipId)) {
      fetchRegistration(regNum, slipId);
    } else if (!checkingAuth && !authenticated) {
      setShowLogin(true);
      setLoading(false);
    }
  }, [authenticated, regNum, slipId, checkingAuth]);

  useEffect(() => {
    if (registration && registration.discount !== null && registration.discount !== undefined) {
      setDiscount(registration.discount.toString());
    }
  }, [registration]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/verify', { cache: 'no-store' });
      const data = await response.json();
      const canVerifyCash =
        data.authenticated &&
        (data.role === 'super_admin' ||
          data.role === 'admin' ||
          Boolean(data.permissionDetails?.['/admin/registrations']?.canEdit));
      if (canVerifyCash) {
        setAuthenticated(true);
      } else {
        if (data.authenticated) {
          setLoginError('Your current account does not have Registration Desk edit permission. Please sign in as a Registration Admin or Super Admin.');
        }
        setShowLogin(true);
      }
    } catch {
      setShowLogin(true);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (data.success) {
        setAuthenticated(true);
        setShowLogin(false);
        if (regNum || slipId) {
          fetchRegistration(regNum, slipId);
        }
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch {
      setLoginError('Login failed. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  const fetchRegistration = async (rNum?: string | null, sId?: string | null) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (rNum) params.set('regNum', rNum);
      if (sId) params.set('slipId', sId);

      const response = await fetch(`/api/registrations/verify?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRegistration(data.data);
      } else {
        setError(data.error || 'Registration not found');
        setRegistration(null);
      }
    } catch {
      setError('Failed to load registration details');
      setRegistration(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const q = lookupQuery.trim();
    if (!q) return;

    if (q.toUpperCase().startsWith('MO26-') || q.includes('-')) {
      fetchRegistration(null, q);
    } else {
      fetchRegistration(q, null);
    }
  };

  const handleApprove = async () => {
    if (!registration) return;

    setApproving(true);
    try {
      const discountValue = parseFloat(discount) || 0;
      if (discountValue < 0) {
        toast.error('Discount cannot be negative');
        setApproving(false);
        return;
      }

      const response = await fetch(`/api/registrations/${registration.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          discount: discountValue,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRegistration(registration.registration_number?.toString(), registration.slip_id);
        toast.success('Payment verified & marked PAID successfully!');
      } else {
        toast.error(data.error || 'Failed to approve payment');
      }
    } catch {
      toast.error('Failed to approve payment');
    } finally {
      setApproving(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0B1124] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#12E2C4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Admin login requirement modal
  if (showLogin && !authenticated) {
    return (
      <div className="min-h-screen bg-[#0B1124] text-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#131B38] border border-white/[0.08] shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-[#F59E0B]" />
          </div>
          <h2 className="text-2xl font-black text-center font-['Space_Grotesk'] uppercase mb-1">
            VERIFICATION DESK LOGIN
          </h2>
          <p className="text-xs font-mono text-center text-[#94A3B8] mb-6">
            Organizer credentials required to verify cash slips.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-xs font-mono text-[#94A3B8] uppercase">Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="mt-1 bg-[#0B1124] border-white/[0.1] text-xs font-mono text-[#F8FAFC] rounded-xl"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs font-mono text-[#94A3B8] uppercase">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 bg-[#0B1124] border-white/[0.1] text-xs font-mono text-[#F8FAFC] rounded-xl"
              />
            </div>

            {loginError && (
              <p className="text-xs font-mono text-red-500">{loginError}</p>
            )}

            <Button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] uppercase"
            >
              {loggingIn ? 'VERIFYING...' : 'LOGIN TO CASH DESK'}
            </Button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-white/[0.06]">
            <Link href="/" className="text-xs font-mono text-[#94A3B8] hover:text-white">
              ← Return to Main Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Parse games array
  const gamesList: string[] = registration?.selected_games
    ? Array.isArray(registration.selected_games)
      ? registration.selected_games
      : JSON.parse(registration.selected_games || '[]')
    : [];

  const rawTotal = Number(registration?.total_amount) || 0;
  const currentDiscount = parseFloat(discount) || 0;
  const finalPayable = Math.max(0, rawTotal - currentDiscount);
  const isPaid = registration?.status === 'paid';

  return (
    <div className="min-h-screen bg-[#0B1124] text-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#94A3B8] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#12E2C4]" />
                <h1 className="text-xl sm:text-2xl font-black font-['Space_Grotesk'] uppercase tracking-tight">
                  CASH DESK VERIFICATION KIOSK
                </h1>
              </div>
              <p className="text-xs font-mono text-[#94A3B8] mt-0.5">
                MINI OLYMPICS 2026 • REGISTRATION DESK TERMINAL
              </p>
            </div>
          </div>

          <Link
            href="/admin/registrations"
            className="text-xs font-mono text-[#12E2C4] hover:underline"
          >
            Go to Admin Registrations →
          </Link>
        </div>

        {/* Search Bar for Quick Lookup */}
        <form
          onSubmit={handleManualLookup}
          className="p-4 rounded-2xl bg-[#131B38] border border-white/[0.08] flex gap-3 shadow-xl"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Scan QR or enter Slip ID (e.g. MO26-CASH-4912) or Ticket #"
              className="pl-10 bg-[#0B1124] border-white/[0.1] text-xs font-mono text-[#F8FAFC] rounded-xl focus:border-[#12E2C4]"
            />
          </div>
          <Button
            type="submit"
            className="px-6 rounded-xl text-xs font-mono font-bold tracking-wider text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] uppercase"
          >
            LOOKUP
          </Button>
        </form>

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#12E2C4] mx-auto mb-2" />
            <p className="text-xs font-mono text-[#94A3B8]">FETCHING REGISTRATION RECORD...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Card */}
        {registration && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#131B38] border border-white/[0.08] space-y-6 shadow-2xl">
            {/* Top Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
              <div>
                <span className="text-xs font-mono text-[#94A3B8]">TICKET #{registration.registration_number}</span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] font-['Space_Grotesk'] uppercase">
                  {registration.name}
                </h2>
                <div className="flex items-center gap-2 text-xs font-mono text-[#12E2C4] mt-1">
                  <span>{registration.roll_number}</span>
                  <span>•</span>
                  <span className="uppercase">{registration.gender}</span>
                  <span>•</span>
                  <span>{registration.contact_number}</span>
                </div>
              </div>

              <div>
                {isPaid ? (
                  <span className="px-4 py-2 rounded-xl text-xs font-mono font-black tracking-wider uppercase bg-[#12E2C4] text-[#0B1124] inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    STATUS: PAID / VERIFIED
                  </span>
                ) : (
                  <span className="px-4 py-2 rounded-xl text-xs font-mono font-black tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    STATUS: PENDING PAYMENT
                  </span>
                )}
              </div>
            </div>

            {/* Slip and Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-[#0B1124] border border-white/[0.06]">
                <span className="text-[#94A3B8] block mb-1">SLIP ID</span>
                <span className="font-bold text-sm text-[#F59E0B]">{registration.slip_id}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#0B1124] border border-white/[0.06]">
                <span className="text-[#94A3B8] block mb-1">METHOD</span>
                <span className="font-bold text-sm uppercase text-white">{registration.payment_method}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#0B1124] border border-white/[0.06]">
                <span className="text-[#94A3B8] block mb-1">REGISTERED AT</span>
                <span className="text-white text-xs">{new Date(registration.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Disciplines */}
            <div>
              <span className="text-xs font-mono text-[#94A3B8] block mb-2">SELECTED DISCIPLINES ({gamesList.length})</span>
              <div className="flex flex-wrap gap-2">
                {gamesList.map((g) => (
                  <span key={g} className="px-3 py-1.5 rounded-xl bg-[#0B1124] border border-white/[0.08] text-xs font-bold text-[#F8FAFC]">
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Financials & Approval Box */}
            <div className="p-6 rounded-2xl bg-[#0B1124] border border-white/[0.08] space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8]">System Calculated Total:</span>
                <span className="text-sm font-bold text-white">Rs. {rawTotal.toLocaleString()}</span>
              </div>

              {/* Adjust Discount Input */}
              <div className="flex items-center justify-between gap-4 py-2 border-t border-b border-white/[0.06]">
                <span className="text-[#94A3B8]">Manual Desk Discount (Rs):</span>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  disabled={isPaid}
                  className="w-28 bg-[#131B38] border-white/[0.1] text-xs font-mono text-right text-[#12E2C4] rounded-lg"
                />
              </div>

              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-white uppercase">Final Amount Due:</span>
                <span className="text-2xl font-black text-[#12E2C4]">
                  Rs. {finalPayable.toLocaleString()}
                </span>
              </div>

              {!isPaid && (
                <Button
                  type="button"
                  onClick={handleApprove}
                  disabled={approving}
                  className="w-full mt-4 py-4 rounded-xl text-xs font-mono font-black tracking-wider text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] uppercase transition-all shadow-xl shadow-[#12E2C4]/20"
                >
                  {approving ? 'VERIFYING IN DATABASE...' : 'CONFIRM CASH RECEIVED & MARK PAID ✦'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyCashPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B1124] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#12E2C4] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyCashContent />
    </Suspense>
  );
}
