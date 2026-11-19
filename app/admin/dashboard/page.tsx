'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  Wallet,
  ArrowRight,
  Loader2,
  Medal,
  ShieldCheck,
  Clock,
  Activity,
  BarChart3,
  Radio,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';
import { useAdminSession, canEditPage } from '@/lib/admin-session-context';
import { OlympicRingsIcon } from '@/components/olympic-rings-icon';

type Stats = {
  total: number;
  paid: number;
  pendingOnline: number;
  pendingCash: number;
  rejected: number;
  boys: number;
  girls: number;
};

type MatchSummary = {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
};

type RecentMatch = {
  id: string;
  game_name: string;
  gender: string;
  round_name: string;
  match_number: number;
  player1_name: string;
  player2_name: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  venue: string | null;
  status: string;
  winner_name: string | null;
  score_summary: string | null;
  coordinator_username: string | null;
};

export default function AdminDashboard() {
  const adminSession = useAdminSession();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    paid: 0,
    pendingOnline: 0,
    pendingCash: 0,
    rejected: 0,
    boys: 0,
    girls: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [financeStats, setFinanceStats] = useState<{ income: number; expense: number; balance: number } | null>(null);
  const [inventoryStats, setInventoryStats] = useState<{ totalItems: number; totalStock: number; lowStock: number } | null>(null);
  const [topGames, setTopGames] = useState<Array<{ name: string; count: number }>>([]);
  const [matchSummary, setMatchSummary] = useState<MatchSummary | null>(null);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [systemHealth, setSystemHealth] = useState<{
    status: string;
    activeUsers: number;
    activeSessions: number;
    totalMatches: number;
    unsyncedPaidRegistrations: number;
  } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const hasAccess = (pageKey: string) =>
    adminSession.role === 'super_admin' || adminSession.permissions.includes(pageKey);
  const canEditRegistrations = canEditPage(adminSession, '/admin/registrations');

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/dashboard?_t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load dashboard metrics');
      }
      setStats({
        total: data.registrations?.total || 0,
        paid: data.registrations?.paid || 0,
        pendingOnline: data.registrations?.pendingOnline || 0,
        pendingCash: data.registrations?.pendingCash || 0,
        rejected: data.registrations?.rejected || 0,
        boys: data.registrations?.boys || 0,
        girls: data.registrations?.girls || 0,
      });
      setFinanceStats(data.finance || null);
      setInventoryStats(data.inventory || null);
      setTopGames(Array.isArray(data.topGames) ? data.topGames : []);
      setMatchSummary(data.matches || null);
      setRecentMatches(Array.isArray(data.recentMatches) ? data.recentMatches : []);
      setSystemHealth(data.systemHealth || null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#12E2C4] mx-auto" />
          <p className="text-xs font-mono text-[#94A3B8] tracking-widest uppercase">
            LOADING TOURNAMENT DASHBOARD METRICS...
          </p>
        </div>
      </div>
    );
  }

  const totalPending = stats.pendingOnline + stats.pendingCash;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            Ongoing
          </span>
        );
      case 'completed':
      case 'walkover':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5" />
            {status === 'walkover' ? 'Walkover' : 'Completed'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <CalendarClock className="w-2.5 h-2.5" />
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131B38] border border-white/[0.08] text-xs font-mono text-[#12E2C4] uppercase tracking-wider mb-2">
            <OlympicRingsIcon className="w-5 h-3" />
            <span>// TOURNAMENT COMMAND CENTER</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] uppercase font-['Space_Grotesk'] tracking-tight">
            OPERATIONS DASHBOARD
          </h1>
          <p className="text-xs font-mono text-[#94A3B8] mt-1">
            MINI OLYMPICS 2026 • REAL-TIME REGISTRATION, MATCHES &amp; LOGISTICS OVERVIEW
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDashboardData}
            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider text-[#F8FAFC] bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] uppercase transition-all"
          >
            Refresh
          </button>
          {canEditRegistrations && (
            <Link
              href="/verify-cash"
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] uppercase transition-all inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>OPEN VERIFICATION DESK</span>
            </Link>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-center justify-between gap-4">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={loadDashboardData}
            className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Hero KPI Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Registrations */}
        <div className="relative p-6 rounded-3xl bg-[#131B38] border border-white/[0.08] hover:border-[#12E2C4]/40 transition-all shadow-xl group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">TOTAL REGISTRATIONS</span>
            <div className="p-2.5 rounded-xl bg-[#12E2C4]/10 text-[#12E2C4]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl sm:text-5xl font-black text-[#F8FAFC] font-['Space_Grotesk'] leading-none">
            {stats.total}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <span className="text-[#12E2C4] font-bold">{stats.paid} Verified</span>
            <span className="text-[#94A3B8]">{totalPending} Pending</span>
          </div>
          <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#12E2C4] opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Pending Approvals */}
        <div className="relative p-6 rounded-3xl bg-[#131B38] border border-white/[0.08] hover:border-[#F59E0B]/40 transition-all shadow-xl group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">PENDING REVIEW</span>
            <div className="p-2.5 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl sm:text-5xl font-black text-[#F59E0B] font-['Space_Grotesk'] leading-none">
            {totalPending}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <span className="text-[#94A3B8]">Cash: {stats.pendingCash}</span>
            <span className="text-[#94A3B8]">Online: {stats.pendingOnline}</span>
          </div>
          <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#F59E0B] opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Financial Treasury Balance */}
        {hasAccess('/admin/finance') && financeStats && (
          <div className="relative p-6 rounded-3xl bg-[#131B38] border border-white/[0.08] hover:border-[#3B82F6]/40 transition-all shadow-xl group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">TREASURY BALANCE</span>
              <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[#F8FAFC] font-['Space_Grotesk'] leading-none truncate">
              Rs. {financeStats.balance.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400">+{financeStats.income.toLocaleString()} In</span>
              <span className="text-rose-400">-{financeStats.expense.toLocaleString()} Out</span>
            </div>
            <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#3B82F6] opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Equipment & Inventory */}
        {hasAccess('/admin/inventory') && inventoryStats && (
          <div className="relative p-6 rounded-3xl bg-[#131B38] border border-white/[0.08] hover:border-[#FFD700]/40 transition-all shadow-xl group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">EQUIPMENT ASSETS</span>
              <div className="p-2.5 rounded-xl bg-[#FFD700]/10 text-[#FFD700]">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-4xl sm:text-5xl font-black text-[#F8FAFC] font-['Space_Grotesk'] leading-none">
              {inventoryStats.totalItems}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-[#12E2C4] font-bold">{inventoryStats.totalStock} Units</span>
              <span className={inventoryStats.lowStock > 0 ? 'text-amber-400 font-bold' : 'text-[#94A3B8]'}>
                {inventoryStats.lowStock} Low Stock
              </span>
            </div>
            <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#FFD700] opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Live & Completed Matches Sync Panel */}
      {matchSummary && (
        <div className="p-6 rounded-3xl bg-[#131B38] border border-white/[0.08] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <OlympicRingsIcon className="w-6 h-3.5" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#F8FAFC]">
                Match Center — Live, Scheduled &amp; Completed
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Ongoing: {matchSummary.inProgress}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30">
                Scheduled: {matchSummary.scheduled}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Completed: {matchSummary.completed}
              </span>
            </div>
          </div>

          {recentMatches.length === 0 ? (
            <div className="p-5 rounded-2xl bg-[#080D1C] border border-white/[0.06] text-xs font-mono text-[#94A3B8] text-center">
              No matches scheduled yet. Coordinators &amp; HOC fixtures will sync here in real time.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentMatches.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-[#080D1C] border border-white/[0.06] hover:border-[#12E2C4]/30 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-[#12E2C4] truncate">
                      {m.game_name} • {m.gender === 'girls' ? 'Girls' : 'Boys'} • {m.round_name}
                    </span>
                    {statusBadge(m.status)}
                  </div>
                  <div className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <span className="truncate">{m.player1_name}</span>
                    <span className="text-[11px] font-mono text-[#94A3B8] shrink-0">vs</span>
                    <span className="truncate">{m.player2_name}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#94A3B8]">
                    <span>
                      {m.scheduled_date || 'TBD'} {m.scheduled_time ? `• ${m.scheduled_time}` : ''}
                      {m.venue ? ` • ${m.venue}` : ''}
                    </span>
                    {m.winner_name && (
                      <span className="text-emerald-400 font-bold">
                        Winner: {m.winner_name}
                        {m.score_summary ? ` (${m.score_summary})` : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics & System Health Row */}
      {(topGames.length > 0 || systemHealth) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {topGames.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#131B38] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#12E2C4]" />
                  Top Registered Games
                </h2>
                <span className="text-xs font-mono text-[#94A3B8]">
                  Boys: {stats.boys} • Girls: {stats.girls}
                </span>
              </div>
              <div className="space-y-2.5">
                {topGames.slice(0, 6).map((g) => {
                  const max = topGames[0]?.count || 1;
                  const pct = Math.max(8, Math.round((g.count / max) * 100));
                  return (
                    <div key={g.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#E2E8F0] truncate">{g.name}</span>
                        <span className="text-[#12E2C4] font-bold">{g.count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#080D1C] overflow-hidden">
                        <div className="h-full bg-[#12E2C4] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {systemHealth && (
            <div className="p-6 rounded-3xl bg-[#131B38] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  System Health
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase">
                  {systemHealth.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-4 rounded-xl bg-[#080D1C] border border-white/[0.06]">
                  <p className="text-[#94A3B8]">Active Staff Accounts</p>
                  <p className="text-2xl font-black text-[#F8FAFC] mt-1">{systemHealth.activeUsers}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#080D1C] border border-white/[0.06]">
                  <p className="text-[#94A3B8]">Live Fixtures Scheduled</p>
                  <p className="text-2xl font-black text-[#12E2C4] mt-1">{systemHealth.totalMatches}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#080D1C] border border-white/[0.06]">
                  <p className="text-[#94A3B8]">Active Sessions</p>
                  <p className="text-xl font-black text-sky-400 mt-1">{systemHealth.activeSessions}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#080D1C] border border-white/[0.06]">
                  <p className="text-[#94A3B8]">Unsynced Paid Regs</p>
                  <p className={`text-xl font-black mt-1 ${systemHealth.unsyncedPaidRegistrations > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {systemHealth.unsyncedPaidRegistrations}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Module Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Registrations Management Module */}
        {hasAccess('/admin/registrations') && (
          <div className="p-6 rounded-3xl bg-[#131B38] border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#F8FAFC] font-['Space_Grotesk'] uppercase">
                    Registrations &amp; Verification
                  </h3>
                  <p className="text-xs font-mono text-[#94A3B8]">Participant review &amp; audit logs</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs mb-4">
                <div className="p-3 rounded-xl bg-[#080D1C] border border-white/[0.06]">
                  <p className="text-lg font-bold text-[#12E2C4]">{stats.paid}</p>
                  <p className="text-[10px] text-[#94A3B8]">Paid</p>
                </div>
                <div className="p-3 rounded-xl bg-[#080D1C] border border-white/[0.06]">
                  <p className="text-lg font-bold text-amber-400">{totalPending}</p>
                  <p className="text-[10px] text-[#94A3B8]">Pending</p>
                </div>
                <div className="p-3 rounded-xl bg-[#080D1C] border border-white/[0.06]">
                  <p className="text-lg font-bold text-rose-400">{stats.rejected}</p>
                  <p className="text-[10px] text-[#94A3B8]">Rejected</p>
                </div>
              </div>
            </div>

            <Link
              href="/admin/registrations"
              className="w-full py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-center text-[#F8FAFC] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all flex items-center justify-center gap-2 uppercase"
            >
              <span>MANAGE ALL REGISTRATIONS</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Coordinator Portal Module */}
        {hasAccess('/admin/coordinator') && (
          <div className="p-6 rounded-3xl bg-[#131B38] border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-[#12E2C4]/10 text-[#12E2C4]">
                  <Medal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#F8FAFC] font-['Space_Grotesk'] uppercase">
                    Coordinator Portal
                  </h3>
                  <p className="text-xs font-mono text-[#94A3B8]">Players, match timings &amp; results</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#080D1C] border border-white/[0.06] text-xs font-mono text-[#94A3B8] space-y-1 mb-4">
                <div className="flex justify-between">
                  <span>Match Scheduler:</span>
                  <span className="text-[#12E2C4] font-bold">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>HOC Live Sync:</span>
                  <span className="text-white font-bold">Enabled</span>
                </div>
              </div>
            </div>

            <Link
              href="/admin/coordinator"
              className="w-full py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-center text-[#F8FAFC] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all flex items-center justify-center gap-2 uppercase"
            >
              <span>OPEN COORDINATOR PORTAL</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Finance Ledger Module */}
        {hasAccess('/admin/finance') && financeStats && (
          <div className="p-6 rounded-3xl bg-[#131B38] border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#F8FAFC] font-['Space_Grotesk'] uppercase">
                    Finance &amp; Treasury
                  </h3>
                  <p className="text-xs font-mono text-[#94A3B8]">Incomes, expenses &amp; sync</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs mb-4">
                <div className="p-3 rounded-xl bg-[#080D1C] border border-white/[0.06]">
                  <p className="text-sm font-bold text-emerald-400">Rs. {financeStats.income.toLocaleString()}</p>
                  <p className="text-[10px] text-[#94A3B8]">Income</p>
                </div>
                <div className="p-3 rounded-xl bg-[#080D1C] border border-white/[0.06]">
                  <p className="text-sm font-bold text-rose-400">Rs. {financeStats.expense.toLocaleString()}</p>
                  <p className="text-[10px] text-[#94A3B8]">Expense</p>
                </div>
              </div>
            </div>

            <Link
              href="/admin/finance"
              className="w-full py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-center text-[#F8FAFC] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all flex items-center justify-center gap-2 uppercase"
            >
              <span>ACCESS FINANCE LEDGER</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Head of Competition (HOC) Module */}
        {hasAccess('/admin/hoc') && (
          <div className="p-6 rounded-3xl bg-[#131B38] border border-white/[0.08] flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B]">
                  <OlympicRingsIcon className="w-6 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#F8FAFC] font-['Space_Grotesk'] uppercase">
                    HOC Tournament Brackets
                  </h3>
                  <p className="text-xs font-mono text-[#94A3B8]">Match fixtures, sport groups &amp; oversight</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#080D1C] border border-white/[0.06] text-xs font-mono text-[#94A3B8] space-y-1 mb-4">
                <div className="flex justify-between">
                  <span>Active Format:</span>
                  <span className="text-[#12E2C4] font-bold">Knockout &amp; Groups</span>
                </div>
                <div className="flex justify-between">
                  <span>PDF Generator:</span>
                  <span className="text-white font-bold">Available</span>
                </div>
              </div>
            </div>

            <Link
              href="/admin/hoc"
              className="w-full py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-center text-[#F8FAFC] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all flex items-center justify-center gap-2 uppercase"
            >
              <span>HOC FIXTURE ENGINE</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
