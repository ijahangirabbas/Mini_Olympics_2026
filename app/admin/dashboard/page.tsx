'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  DollarSign,
  Package,
  Wallet,
  TrendingUp,
  Trophy,
  ArrowRight,
  Loader2,
  Medal,
  Target,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Stats = {
  total: number;
  paid: number;
  pendingOnline: number;
  pendingCash: number;
  rejected: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    paid: 0,
    pendingOnline: 0,
    pendingCash: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [financeStats, setFinanceStats] = useState({ income: 0, expense: 0, balance: 0 });
  const [inventoryStats, setInventoryStats] = useState({ totalItems: 0, activeLoans: 0 });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load registration stats
      const statsRes = await fetch('/api/stats?' + new URLSearchParams({ _t: Date.now().toString() }), { cache: 'no-store' });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Load finance stats
      try {
        const financeRes = await fetch('/api/admin/finance', { cache: 'no-store' });
        const financeData = await financeRes.json();
        if (financeData.success && financeData.summary) {
          setFinanceStats({
            income: financeData.summary.totalIncome || 0,
            expense: financeData.summary.totalExpense || 0,
            balance: financeData.summary.balance || 0,
          });
        }
      } catch {}

      // Load inventory stats
      try {
        const invRes = await fetch('/api/admin/inventory', { cache: 'no-store' });
        const invData = await invRes.json();
        if (invData.success) {
          setInventoryStats({
            totalItems: invData.data?.length || 0,
            activeLoans: 0,
          });
        }
        const loansRes = await fetch('/api/admin/inventory/loans', { cache: 'no-store' });
        const loansData = await loansRes.json();
        if (loansData.success) {
          setInventoryStats((prev) => ({
            ...prev,
            activeLoans: loansData.data?.filter((l: any) => l.status === 'active')?.length || 0,
          }));
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#D5F05B] mx-auto" />
          <p className="text-xs font-mono text-[#A4A5AA] tracking-widest uppercase">
            LOADING TOURNAMENT DASHBOARD METRICS...
          </p>
        </div>
      </div>
    );
  }

  const totalPending = stats.pendingOnline + stats.pendingCash;

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#14161C] border border-white/[0.08] text-xs font-mono text-[#D5F05B] uppercase tracking-wider mb-2">
            <span>// TOURNAMENT COMMAND CENTER</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#F4F1EA] uppercase font-['Space_Grotesk'] tracking-tight">
            OPERATIONS DASHBOARD
          </h1>
          <p className="text-xs font-mono text-[#A4A5AA] mt-1">
            MINI OLYMPICS 2026 • REAL-TIME REGISTRATION & LOGISTICS OVERVIEW
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/verify-cash"
            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider text-[#101114] bg-[#D5F05B] hover:bg-[#c2de4a] uppercase transition-all inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>OPEN VERIFICATION DESK</span>
          </Link>
        </div>
      </div>

      {/* 4 Hero KPI Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Registrations */}
        <div className="relative p-6 rounded-3xl bg-[#14161C] border border-white/[0.08] hover:border-[#D5F05B]/40 transition-all shadow-xl group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-[#A4A5AA] uppercase tracking-wider">TOTAL REGISTRATIONS</span>
            <div className="p-2.5 rounded-xl bg-[#D5F05B]/10 text-[#D5F05B]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl sm:text-5xl font-black text-[#F4F1EA] font-['Space_Grotesk'] leading-none">
            {stats.total}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <span className="text-[#D5F05B] font-bold">{stats.paid} Verified</span>
            <span className="text-[#A4A5AA]">{totalPending} Pending</span>
          </div>
          <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#D5F05B] opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Pending Approvals */}
        <div className="relative p-6 rounded-3xl bg-[#14161C] border border-white/[0.08] hover:border-[#F15A29]/40 transition-all shadow-xl group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-[#A4A5AA] uppercase tracking-wider">PENDING REVIEW</span>
            <div className="p-2.5 rounded-xl bg-[#F15A29]/10 text-[#F15A29]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl sm:text-5xl font-black text-[#F15A29] font-['Space_Grotesk'] leading-none">
            {totalPending}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <span className="text-[#A4A5AA]">Cash: {stats.pendingCash}</span>
            <span className="text-[#A4A5AA]">Online: {stats.pendingOnline}</span>
          </div>
          <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#F15A29] opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Financial Treasury Balance */}
        <div className="relative p-6 rounded-3xl bg-[#14161C] border border-white/[0.08] hover:border-[#00E5FF]/40 transition-all shadow-xl group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-[#A4A5AA] uppercase tracking-wider">TREASURY BALANCE</span>
            <div className="p-2.5 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#F4F1EA] font-['Space_Grotesk'] leading-none truncate">
            Rs. {financeStats.balance.toLocaleString()}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400">+{financeStats.income.toLocaleString()} In</span>
            <span className="text-rose-400">-{financeStats.expense.toLocaleString()} Out</span>
          </div>
          <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#00E5FF] opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Equipment & Inventory */}
        <div className="relative p-6 rounded-3xl bg-[#14161C] border border-white/[0.08] hover:border-[#FFD700]/40 transition-all shadow-xl group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-[#A4A5AA] uppercase tracking-wider">EQUIPMENT ASSETS</span>
            <div className="p-2.5 rounded-xl bg-[#FFD700]/10 text-[#FFD700]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl sm:text-5xl font-black text-[#F4F1EA] font-['Space_Grotesk'] leading-none">
            {inventoryStats.totalItems}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <span className="text-[#FFD700] font-bold">{inventoryStats.activeLoans} Active Loans</span>
            <span className="text-[#A4A5AA]">Tracked</span>
          </div>
          <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#FFD700] opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Module Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Registrations Management Module */}
        <div className="p-6 rounded-3xl bg-[#14161C] border border-white/[0.08] flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F4F1EA] font-['Space_Grotesk'] uppercase">
                  Registrations & Verification
                </h3>
                <p className="text-xs font-mono text-[#A4A5AA]">Participant review & audit logs</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs mb-4">
              <div className="p-3 rounded-xl bg-[#0A0B0E] border border-white/[0.06]">
                <p className="text-lg font-bold text-[#D5F05B]">{stats.paid}</p>
                <p className="text-[10px] text-[#A4A5AA]">Paid</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0B0E] border border-white/[0.06]">
                <p className="text-lg font-bold text-amber-400">{totalPending}</p>
                <p className="text-[10px] text-[#A4A5AA]">Pending</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0B0E] border border-white/[0.06]">
                <p className="text-lg font-bold text-rose-400">{stats.rejected}</p>
                <p className="text-[10px] text-[#A4A5AA]">Rejected</p>
              </div>
            </div>
          </div>

          <Link
            href="/admin/registrations"
            className="w-full py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-center text-[#F4F1EA] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all flex items-center justify-center gap-2 uppercase"
          >
            <span>MANAGE ALL REGISTRATIONS</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Finance Ledger Module */}
        <div className="p-6 rounded-3xl bg-[#14161C] border border-white/[0.08] flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F4F1EA] font-['Space_Grotesk'] uppercase">
                  Finance & Treasury
                </h3>
                <p className="text-xs font-mono text-[#A4A5AA]">Incomes, expenses & sync</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs mb-4">
              <div className="p-3 rounded-xl bg-[#0A0B0E] border border-white/[0.06]">
                <p className="text-sm font-bold text-emerald-400">Rs. {financeStats.income.toLocaleString()}</p>
                <p className="text-[10px] text-[#A4A5AA]">Income</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0B0E] border border-white/[0.06]">
                <p className="text-sm font-bold text-rose-400">Rs. {financeStats.expense.toLocaleString()}</p>
                <p className="text-[10px] text-[#A4A5AA]">Expense</p>
              </div>
            </div>
          </div>

          <Link
            href="/admin/finance"
            className="w-full py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-center text-[#F4F1EA] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all flex items-center justify-center gap-2 uppercase"
          >
            <span>ACCESS FINANCE LEDGER</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Head of Competition (HOC) Module */}
        <div className="p-6 rounded-3xl bg-[#14161C] border border-white/[0.08] flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#F15A29]/10 text-[#F15A29]">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F4F1EA] font-['Space_Grotesk'] uppercase">
                  HOC Tournament Brackets
                </h3>
                <p className="text-xs font-mono text-[#A4A5AA]">Match fixtures & referee sheets</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0B0E] border border-white/[0.06] text-xs font-mono text-[#A4A5AA] space-y-1 mb-4">
              <div className="flex justify-between">
                <span>Active Format:</span>
                <span className="text-[#D5F05B] font-bold">Knockout & Groups</span>
              </div>
              <div className="flex justify-between">
                <span>PDF Generator:</span>
                <span className="text-white font-bold">Available</span>
              </div>
            </div>
          </div>

          <Link
            href="/admin/hoc"
            className="w-full py-3 rounded-xl text-xs font-mono font-bold tracking-wider text-center text-[#F4F1EA] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all flex items-center justify-center gap-2 uppercase"
          >
            <span>HOC FIXTURE ENGINE</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
