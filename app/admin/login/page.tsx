'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Lock, User, ArrowLeft, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { OlympicRingsIcon } from '@/components/olympic-rings-icon';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (data.success) {
        router.push(data.redirectTo || '/admin/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080D1C] text-[#F8FAFC] flex flex-col justify-between py-10 px-4 sm:px-6 relative overflow-hidden">
      {/* Stadium Floodlight Glows */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[780px] h-[420px] bg-[#12E2C4]/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[300px] bg-[#F59E0B]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/5 w-[400px] h-[260px] bg-[#3B82F6]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Back Link */}
      <div className="max-w-lg w-full mx-auto relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#94A3B8] hover:text-[#12E2C4] transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Public Portal</span>
        </Link>
      </div>

      {/* Main Mini Olympics Portal Card */}
      <div className="max-w-lg w-full mx-auto relative z-10 my-auto">
        <div className="rounded-3xl bg-[#131B38]/95 border border-white/[0.1] shadow-[0_25px_80px_rgba(0,0,0,0.65)] overflow-hidden backdrop-blur-xl">
          {/* Olympic Multi-Ring Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0081C8] via-[#FCB131] via-[#12E2C4] to-[#EE334E]" />

          {/* Dual-Logo Stadium Header: Mini Olympics (Left) + Welcome Title (Center) + FOC Logo (Right) */}
          <div className="px-6 sm:px-8 pt-7 pb-6 bg-gradient-to-b from-[#182244]/90 to-[#131B38] border-b border-white/[0.08]">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Mini Olympics Rings Logo */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0B1124] border border-white/[0.12] flex items-center justify-center p-2 shadow-lg shrink-0">
                <OlympicRingsIcon className="w-11 h-6 sm:w-12 sm:h-7" />
              </div>

              {/* Center: Welcome Header */}
              <div className="text-center flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#12E2C4]/10 border border-[#12E2C4]/25 text-[10px] font-mono text-[#12E2C4] uppercase tracking-widest mb-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Official Portal</span>
                </div>
                <h1 className="text-lg sm:text-xl font-black uppercase font-['Space_Grotesk'] tracking-tight text-[#F8FAFC] leading-tight">
                  Welcome to Mini Olympics 2026
                </h1>
                <p className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider mt-1">
                  FCIT Sports Society • Control Center
                </p>
              </div>

              {/* Right: FOC Logo */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0B1124] border border-white/[0.12] flex items-center justify-center p-2 shadow-lg shrink-0">
                <img
                  src="/images/foc-logo.png"
                  alt="FOC Sports Society Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Sign-In Form */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">
                  Username or Email
                </Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your staff or coordinator username"
                    required
                    autoFocus
                    autoComplete="username"
                    className="pl-10 h-11 bg-[#080D1C] border-white/[0.12] text-sm font-mono text-[#F8FAFC] rounded-xl focus:border-[#12E2C4]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">
                  Security Password
                </Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="pl-10 pr-10 h-11 bg-[#080D1C] border-white/[0.12] text-sm font-mono text-[#F8FAFC] rounded-xl focus:border-[#12E2C4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Toggle password visibility"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-xs font-mono font-black tracking-widest text-[#0B1124] bg-gradient-to-r from-[#12E2C4] to-[#0FC9AE] hover:from-[#18F0D2] hover:to-[#12E2C4] uppercase transition-all shadow-xl shadow-[#12E2C4]/20"
              >
                {loading ? 'AUTHENTICATING...' : 'SIGN IN TO CONTROL CENTER →'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#94A3B8]/80">
              <span>Role-Based Access • Admin, HOC &amp; Coordinators</span>
              <span className="text-[#F59E0B]">2026 Season</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg w-full mx-auto relative z-10 text-center text-xs font-mono text-[#94A3B8]/60">
        PUCIT OLD CAMPUS • LAHORE • MINI OLYMPICS 2026
      </div>
    </div>
  );
}
