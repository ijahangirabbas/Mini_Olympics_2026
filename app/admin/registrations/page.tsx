'use client';

import { useState, useEffect } from 'react';
import { OlympicRingsIcon } from '@/components/olympic-rings-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  DollarSign,
  Clock,
  XCircle,
  Download,
  CheckCircle2,
  X,
  Eye,
  Calendar,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  TrendingUp,
  CreditCard,
  Banknote,
  Search,
  Loader2,
  MessageCircle,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { canEditPage, useAdminSession } from '@/lib/admin-session-context';

type TeamMember = { name: string; rollNumber: string; contactNumber: string };
type Registration = {
  id: string;
  registration_number: number | null;
  email: string;
  name: string;
  roll_number: string;
  contact_number: string;
  alternative_contact_number: string | null;
  gender: string;
  selected_games: string[] | string;
  team_members?: string | Record<string, TeamMember[]> | null;
  total_amount: number;
  discount: number | null;
  coupon_code?: string | null;
  payment_method: string;
  slip_id: string | null;
  transaction_id: string | null;
  screenshot_url: string | null;
  status: string;
  created_at: string;
  has_screenshot?: boolean;
  is_duplicate_roll?: boolean;
  items?: Array<{ game_name: string; unit_price: number; currency: string; players_count?: number }>;
};

type Stats = {
  total: number;
  paid: number;
  pendingOnline: number;
  pendingCash: number;
  rejected: number;
};

type GamePrice = {
  name: string;
  boys: number | null;
  girls: number | null;
};

export default function RegistrationsPage() {
  const adminSession = useAdminSession();
  const canEdit = canEditPage(adminSession, '/admin/registrations');
  const toast = useToast();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    paid: 0,
    pendingOnline: 0,
    pendingCash: 0,
    rejected: 0,
  });
  const [filter, setFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateRangeStats, setDateRangeStats] = useState<{ 
    count: number; 
    totalAmount: number;
    online: { count: number; amount: number };
    cash: { count: number; amount: number };
  }>({ 
    count: 0, 
    totalAmount: 0,
    online: { count: 0, amount: 0 },
    cash: { count: 0, amount: 0 }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [allGames, setAllGames] = useState<GamePrice[]>([]);

  const loadGames = async () => {
    try {
      const res = await fetch(`/api/games?includeInactive=true&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setAllGames(data.data);
      }
    } catch (error) {
      console.error('Load games error:', error);
    }
  };

  useEffect(() => {
    loadData();
    loadGames();
  }, []);

  const loadData = () => {
    setLoading(true);
    // Load stats
    fetch('/api/stats?' + new URLSearchParams({ _t: Date.now().toString() }), { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch(console.error);

    fetchRegistrations();
  };

  const fetchRegistrations = () => {
    const params = new URLSearchParams();
    if (filter !== 'all') {
      if (filter === 'paid') params.set('status', 'paid');
      else if (filter === 'pending_online') params.set('status', 'pending_online');
      else if (filter === 'pending_cash') params.set('status', 'pending_cash');
    }
    if (genderFilter !== 'all') params.set('gender', genderFilter);
    if (gameFilter !== 'all') params.set('game', gameFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('limit', '500');

    fetch(`/api/registrations?${params.toString()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRegistrations(data.data || []);
          setSelectedIds([]);
          calculateDateRangeStats(data.data || []);
        } else {
          toast.error(data.error || 'Failed to fetch registrations');
        }
      })
      .catch(() => toast.error('Failed to fetch registrations'))
      .finally(() => setLoading(false));
  };

  const calculateDateRangeStats = (regs: Registration[]) => {
    let totalAmount = 0, onlineCount = 0, onlineAmount = 0, cashCount = 0, cashAmount = 0;
    regs.forEach((reg) => {
      const finalAmount = reg.total_amount - (reg.discount || 0);
      totalAmount += finalAmount;
      if (reg.payment_method === 'online') { onlineCount++; onlineAmount += finalAmount; }
      else if (reg.payment_method === 'cash') { cashCount++; cashAmount += finalAmount; }
    });
    setDateRangeStats({ count: regs.length, totalAmount, online: { count: onlineCount, amount: onlineAmount }, cash: { count: cashCount, amount: cashAmount } });
  };

  useEffect(() => {
    fetchRegistrations();
  }, [filter, startDate, endDate, genderFilter, gameFilter]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        if (newStatus === 'paid' || newStatus === 'rejected') {
          if (data.emailSent) {
            toast.success(`Marked ${newStatus.replace('_', ' ')} & confirmation email sent!`);
          } else if (data.emailWarning) {
            toast.success(`Marked ${newStatus.replace('_', ' ')} (Email skipped: configure Gmail SMTP in Settings)`);
          } else {
            toast.success(`Updated status to ${newStatus.replace('_', ' ')}`);
          }
        } else {
          toast.success(`Updated status to ${newStatus.replace('_', ' ')}`);
        }
        loadData();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleBulkStatus = (targetStatus: 'paid' | 'rejected') => {
    if (selectedIds.length === 0) return;
    setConfirmState({
      open: true,
      title: `${targetStatus === 'paid' ? 'Approve' : 'Reject'} ${selectedIds.length} selected registrations?`,
      description:
        targetStatus === 'paid'
          ? 'Eligible pending/rejected entries will be marked Paid, synced to Finance Ledger, and notified by email.'
          : 'Eligible pending entries will be marked Rejected and notified by email.',
      confirmLabel: targetStatus === 'paid' ? 'Approve Selected' : 'Reject Selected',
      destructive: targetStatus === 'rejected',
      onConfirm: async () => {
        setBulkProcessing(true);
        try {
          const res = await fetch('/api/registrations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds, status: targetStatus }),
          });
          const data = await res.json();
          if (data.success) {
            toast.success(`Updated ${data.updatedCount} registrations (${data.skippedCount} skipped)`);
            loadData();
          } else {
            toast.error(data.error || 'Bulk update failed');
          }
        } finally {
          setBulkProcessing(false);
        }
      },
    });
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      open: true,
      title: 'Delete this registration?',
      description: 'Paid registrations cannot be deleted directly and must be refunded instead.',
      confirmLabel: 'Delete Registration',
      destructive: true,
      onConfirm: async () => {
        const response = await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          toast.success('Registration deleted');
          loadData();
        } else {
          toast.error(data.error || 'Failed to delete registration');
        }
      },
    });
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') {
      if (filter === 'paid') params.set('status', 'paid');
      else if (filter === 'pending_online') params.set('status', 'pending_online');
      else if (filter === 'pending_cash') params.set('status', 'pending_cash');
    }
    if (genderFilter !== 'all') params.set('gender', genderFilter);
    if (gameFilter !== 'all') params.set('game', gameFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    try {
      const res = await fetch(`/api/export?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || `Export failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.match(/filename="?([^"]+)"?/)?.[1] || `registrations_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed. Please try again.');
    }
  };

  const handleView = async (reg: Registration) => {
    setSelectedRegistration(reg);
    setDiscountValue(reg.discount?.toString() || '0');
    setEditingDiscount(false);
    setViewDialogOpen(true);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/registrations/${reg.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedRegistration(data.data);
      }
    } catch {
      // Keep summary record
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveDiscount = async () => {
    if (!selectedRegistration) return;
    const discountNum = parseFloat(discountValue) || 0;
    if (discountNum < 0) {
      toast.error('Discount cannot be negative');
      return;
    }

    setSavingDiscount(true);
    try {
      const response = await fetch(`/api/registrations/${selectedRegistration.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedRegistration.status, discount: discountNum }),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedRegistration({ ...selectedRegistration, discount: discountNum });
        setEditingDiscount(false);
        toast.success('Discount updated');
        fetchRegistrations();
      } else {
        toast.error(data.error || 'Failed to update discount');
      }
    } finally {
      setSavingDiscount(false);
    }
  };

  // Search and pagination
  const searchedRegistrations = registrations.filter((reg) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return reg.name.toLowerCase().includes(q) || reg.email.toLowerCase().includes(q) ||
      reg.roll_number.toLowerCase().includes(q) || reg.contact_number.includes(q) ||
      (reg.registration_number?.toString() || '').includes(q) || (reg.slip_id || '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(searchedRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRegistrations = searchedRegistrations.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [filter, startDate, endDate, itemsPerPage, genderFilter, gameFilter, searchQuery]);

  if (loading && registrations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto text-[#F8FAFC]">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-white/[0.08]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131B38] border border-white/[0.08] text-xs font-mono text-[#12E2C4] uppercase tracking-wider mb-2">
          <OlympicRingsIcon className="w-5 h-3" />
          <span>// PARTICIPANT REGISTRY</span>
        </div>
        <h1 className="text-3xl font-black text-[#F8FAFC] uppercase font-['Space_Grotesk'] tracking-tight flex items-center gap-3">
          Registrations
        </h1>
        <p className="text-xs font-mono text-[#94A3B8] mt-1">Manage participant registrations, verification &amp; exports</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Paid</p>
                <p className="text-3xl font-bold">{stats.paid}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Pending Online</p>
                <p className="text-3xl font-bold">{stats.pendingOnline}</p>
              </div>
              <CreditCard className="h-8 w-8 text-amber-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Pending Cash</p>
                <p className="text-3xl font-bold">{stats.pendingCash}</p>
              </div>
              <Banknote className="h-8 w-8 text-purple-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-500 to-red-600 text-white col-span-2 sm:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm">Rejected</p>
                <p className="text-3xl font-bold">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-rose-200/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card className="mb-6 border-0 shadow-lg">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search by name, email, roll, phone, ticket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'border-blue-500 bg-blue-50' : ''}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" onClick={() => setWhatsappDialogOpen(true)} className="border-green-500 text-green-600 hover:bg-green-50">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp Verify
              </Button>
              <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-5 pt-5 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 flex gap-3">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="flex-1" />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending_online">Pending Online</SelectItem>
                  <SelectItem value="pending_cash">Pending Cash</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Gender</SelectItem>
                  <SelectItem value="boys">Male</SelectItem>
                  <SelectItem value="girls">Female</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gameFilter} onValueChange={setGameFilter}>
                <SelectTrigger><SelectValue placeholder="Game" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  {allGames.map((game) => (
                    <SelectItem key={game.name} value={game.name}>{game.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtered Stats */}
      {(filter !== 'all' || genderFilter !== 'all' || gameFilter !== 'all' || startDate || endDate) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <p className="text-sm text-indigo-100">Filtered</p>
              <p className="text-2xl font-bold">{dateRangeStats.count}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-4">
              <p className="text-sm text-emerald-100">Total Amount</p>
              <p className="text-xl font-bold">Rs. {dateRangeStats.totalAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-4">
              <p className="text-sm text-blue-100">Online ({dateRangeStats.online.count})</p>
              <p className="text-xl font-bold">Rs. {dateRangeStats.online.amount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <p className="text-sm text-amber-100">Cash ({dateRangeStats.cash.count})</p>
              <p className="text-xl font-bold">Rs. {dateRangeStats.cash.amount.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Registrations Table */}
      <Card className="bg-[#131B38] border border-white/[0.08] text-[#F8FAFC] shadow-xl overflow-hidden">
        <CardHeader className="bg-[#182244] border-b border-white/[0.08] px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-[#F8FAFC]">Registrations</CardTitle>
              <CardDescription className="text-[#94A3B8]">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, searchedRegistrations.length)} of {searchedRegistrations.length}</CardDescription>
            </div>
            <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
              <SelectTrigger className="w-32 bg-[#0B1124] border-white/15 text-[#F8FAFC]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {canEdit && selectedIds.length > 0 && (
            <div className="p-3 bg-[#12E2C4]/10 border-b border-[#12E2C4]/25 flex flex-wrap items-center justify-between gap-2 text-[#F8FAFC]">
              <span className="text-sm font-medium">{selectedIds.length} registration(s) selected</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={bulkProcessing}
                  onClick={() => handleBulkStatus('paid')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={bulkProcessing}
                  onClick={() => handleBulkStatus('rejected')}
                >
                  Reject Selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0B1124]/60 text-xs font-mono uppercase text-[#94A3B8] border-b border-white/[0.08]">
                  {canEdit && (
                    <th className="p-4 text-left w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all visible registrations"
                        checked={
                          paginatedRegistrations.length > 0 &&
                          paginatedRegistrations.every((r) => selectedIds.includes(r.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(paginatedRegistrations.map((r) => r.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>
                  )}
                  <th className="p-4 text-left font-semibold">Ticket</th>
                  <th className="p-4 text-left font-semibold">Participant</th>
                  <th className="p-4 text-left font-semibold">Games</th>
                  <th className="p-4 text-left font-semibold">Amount</th>
                  <th className="p-4 text-left font-semibold">Payment</th>
                  <th className="p-4 text-left font-semibold">Status</th>
                  <th className="p-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {paginatedRegistrations.map((reg) => {
                  let selectedGames: string[] = [];
                  try { selectedGames = Array.isArray(reg.selected_games) ? reg.selected_games : JSON.parse(reg.selected_games); } catch {}
                  return (
                    <tr key={reg.id} className="hover:bg-white/[0.03] transition-colors group">
                      {canEdit && (
                        <td className="p-4">
                          <input
                            type="checkbox"
                            aria-label={`Select registration ${reg.name}`}
                            checked={selectedIds.includes(reg.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds((prev) => Array.from(new Set([...prev, reg.id])));
                              } else {
                                setSelectedIds((prev) => prev.filter((x) => x !== reg.id));
                              }
                            }}
                          />
                        </td>
                      )}
                      <td className="p-4">
                        {reg.registration_number ? <span className="font-bold font-mono text-[#12E2C4]">#{reg.registration_number}</span> : <span className="text-[#94A3B8]">-</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-[#F8FAFC]">{reg.name}</p>
                          {reg.is_duplicate_roll && (
                            <span
                              title="Roll number appears in multiple registrations"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-medium"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Multi
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-[#94A3B8]">{reg.roll_number}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${reg.gender === 'boys' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'}`}>
                          {reg.gender === 'boys' ? 'Boys' : 'Girls'}
                        </span>
                        <span className="ml-2 text-sm text-[#E2E8F0]">{selectedGames.length} game(s)</span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold font-mono text-emerald-400">Rs. {(reg.total_amount - (reg.discount || 0)).toLocaleString()}</p>
                        {(reg.discount && Number(reg.discount) > 0) && (
                          <p className="text-xs text-[#94A3B8] mt-0.5">
                            {reg.coupon_code ? `Coupon: ${reg.coupon_code}` : `Discount: Rs. ${Number(reg.discount).toLocaleString()}`}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${reg.payment_method === 'online' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'}`}>
                            {reg.payment_method}
                          </span>
                          {reg.has_screenshot && (
                            <button
                              type="button"
                              onClick={() => handleView(reg)}
                              title="View payment screenshot"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#12E2C4]/15 text-[#12E2C4] border border-[#12E2C4]/30 hover:bg-[#12E2C4]/25 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              Proof
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          reg.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          reg.status === 'refunded' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          reg.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {reg.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 opacity-80 group-hover:opacity-100">
                          <Button size="sm" variant="outline" onClick={() => handleView(reg)}><Eye className="h-4 w-4" /></Button>
                          {canEdit && reg.status !== 'paid' && reg.status !== 'refunded' && (
                            <Button size="sm" onClick={() => handleStatusUpdate(reg.id, 'paid')} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit && (reg.status === 'pending_cash' || reg.status === 'pending_online') && (
                            <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(reg.id, 'rejected')}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit && reg.status === 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              title="Mark Refunded"
                              onClick={() =>
                                setConfirmState({
                                  open: true,
                                  title: 'Refund this paid registration?',
                                  description: 'This marks the registration Refunded and records a compensating expense entry in Finance.',
                                  confirmLabel: 'Mark Refunded',
                                  destructive: true,
                                  onConfirm: () => handleStatusUpdate(reg.id, 'refunded'),
                                })
                              }
                              className="text-purple-700 border-purple-200 hover:bg-purple-50"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit && reg.status !== 'paid' && (
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(reg.id)} className="text-slate-400 hover:text-red-600">
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y">
            {paginatedRegistrations.map((reg) => {
              let selectedGames: string[] = [];
              try { selectedGames = Array.isArray(reg.selected_games) ? reg.selected_games : JSON.parse(reg.selected_games); } catch {}
              return (
                <div key={reg.id} className="p-4">
                  <div className="flex justify-between mb-2">
                    <div>
                      {reg.registration_number && <span className="font-bold text-blue-600">#{reg.registration_number}</span>}
                      <p className="font-semibold">{reg.name}</p>
                      <p className="text-sm text-slate-500">{reg.roll_number}</p>
                    </div>
                    <span className={`h-fit px-2 py-1 rounded-full text-xs font-semibold ${
                      reg.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      reg.status === 'refunded' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      reg.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {reg.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm mb-3 items-center text-[#94A3B8]">
                    <span className="font-bold font-mono text-emerald-400">Rs. {(reg.total_amount - (reg.discount || 0)).toLocaleString()}</span>
                    {(reg.discount && Number(reg.discount) > 0) && (
                      <span className="text-xs text-[#94A3B8]">
                        ({reg.coupon_code ? `Coupon: ${reg.coupon_code}` : `Rs. ${Number(reg.discount).toLocaleString()} off`})
                      </span>
                    )}
                    <span>•</span>
                    <span>{selectedGames.length} game(s)</span>
                    <span>•</span>
                    <span className="capitalize">{reg.payment_method}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleView(reg)} className="flex-1 bg-[#0B1124] border-white/15 text-[#F8FAFC]">View</Button>
                    {canEdit && reg.status !== 'paid' && <Button size="sm" onClick={() => handleStatusUpdate(reg.id, 'paid')} className="flex-1 bg-emerald-500 text-[#080D1C] font-bold">Approve</Button>}
                    {canEdit && reg.status !== 'rejected' && <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(reg.id, 'rejected')} className="flex-1">Reject</Button>}
                  </div>
                </div>
              );
            })}
          </div>

          {searchedRegistrations.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No registrations found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t p-4 flex justify-between items-center">
              <p className="text-sm text-slate-500">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                  return (
                    <Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(pageNum)} className={currentPage === pageNum ? 'bg-blue-600' : ''}>
                      {pageNum}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <OlympicRingsIcon className="w-6 h-3.5" />
              Registration Details
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">Complete information</DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4 mt-4">
              {selectedRegistration.registration_number && (
                <div className="bg-gradient-to-r from-[#182244] to-[#131B38] border border-[#12E2C4]/30 rounded-xl p-5 text-center text-[#F8FAFC]">
                  <p className="text-[#12E2C4] text-xs font-mono uppercase">Ticket Number</p>
                  <p className="text-4xl font-black font-['Space_Grotesk']">#{selectedRegistration.registration_number}</p>
                </div>
              )}

              <div className="bg-[#131B38] border border-white/[0.08] text-[#F8FAFC] rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-[#F8FAFC]"><Users className="h-4 w-4 text-[#12E2C4]" /> Personal Info</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-[#94A3B8] text-xs">Name</p><p className="font-medium">{selectedRegistration.name}</p></div>
                  <div><p className="text-[#94A3B8] text-xs">Roll</p><p className="font-medium font-mono">{selectedRegistration.roll_number}</p></div>
                  <div><p className="text-[#94A3B8] text-xs">Gender</p><p className="font-medium capitalize">{selectedRegistration.gender}</p></div>
                  <div><p className="text-[#94A3B8] text-xs">Phone</p><p className="font-medium font-mono">{selectedRegistration.contact_number}</p></div>
                  <div className="col-span-2"><p className="text-[#94A3B8] text-xs">Email</p><p className="font-medium">{selectedRegistration.email}</p></div>
                </div>
              </div>

              <div className="bg-[#131B38] border border-emerald-500/25 text-[#F8FAFC] rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-[#F8FAFC]"><OlympicRingsIcon className="w-5 h-3" /> Games</h3>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(selectedRegistration.selected_games) ? selectedRegistration.selected_games : JSON.parse(selectedRegistration.selected_games || '[]')).map((g: string) => (
                    <span key={g} className="px-3 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg text-sm font-medium">{g}</span>
                  ))}
                </div>
              </div>

              {/* Team Members for team games */}
              {(() => {
                const selectedGamesList = Array.isArray(selectedRegistration.selected_games) ? selectedRegistration.selected_games : JSON.parse(selectedRegistration.selected_games || '[]');
                let teamMembersMap: Record<string, TeamMember[]> = {};
                try {
                  const raw = selectedRegistration.team_members;
                  if (raw) {
                    teamMembersMap = typeof raw === 'string' ? JSON.parse(raw) : raw;
                  }
                } catch (_) {}
                const gamesWithTeams = selectedGamesList.filter((g: string) => Array.isArray(teamMembersMap[g]) && teamMembersMap[g].length > 0);
                if (gamesWithTeams.length === 0) return null;
                return (
                  <div className="bg-[#131B38] border border-sky-500/25 text-[#F8FAFC] rounded-xl p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-sky-400" /> Team Members (Team Games)</h3>
                    <div className="space-y-4">
                      {gamesWithTeams.map((gameName: string) => (
                        <div key={gameName} className="border border-white/10 rounded-lg p-3 bg-[#0B1124]">
                          <p className="font-medium text-[#12E2C4] mb-2">{gameName}</p>
                          <div className="space-y-2">
                            {(teamMembersMap[gameName] || []).map((member: TeamMember, idx: number) => (
                              <div key={idx} className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#E2E8F0]">
                                <span><span className="text-[#94A3B8]">Name:</span> {member.name || '—'}</span>
                                <span><span className="text-[#94A3B8]">Roll:</span> {member.rollNumber || '—'}</span>
                                <span><span className="text-[#94A3B8]">Contact:</span> {member.contactNumber || '—'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="bg-[#131B38] border border-amber-500/25 text-[#F8FAFC] rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4 text-amber-400" /> Payment</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-[#94A3B8] text-xs">Method</p><p className="font-medium capitalize">{selectedRegistration.payment_method}</p></div>
                  <div><p className="text-[#94A3B8] text-xs">Status</p><p className="font-medium capitalize">{selectedRegistration.status.replace('_', ' ')}</p></div>
                  <div><p className="text-[#94A3B8] text-xs">Amount</p><p className="font-medium font-mono">Rs. {selectedRegistration.total_amount?.toLocaleString()}</p></div>
                  {selectedRegistration.coupon_code && (
                    <div className="col-span-2"><p className="text-[#94A3B8] text-xs">Coupon applied</p><p className="font-medium text-amber-300">{selectedRegistration.coupon_code}</p></div>
                  )}
                  <div>
                    <p className="text-[#94A3B8] text-xs">Discount</p>
                    {editingDiscount && canEdit ? (
                      <div className="flex gap-2">
                        <Input type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="w-20 h-7 bg-[#0B1124] border-white/15" />
                        <Button size="sm" onClick={handleSaveDiscount} disabled={savingDiscount}>{savingDiscount ? '...' : 'Save'}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingDiscount(false)}>X</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-medium font-mono text-rose-400">Rs. {(selectedRegistration.discount || 0).toLocaleString()}</p>
                        {canEdit && selectedRegistration.status !== 'paid' && <Button size="sm" variant="outline" onClick={() => setEditingDiscount(true)} className="h-6 text-xs bg-[#0B1124] border-white/15 text-[#F8FAFC]">Edit</Button>}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-[#94A3B8] text-xs">Final Amount</p>
                    <p className="text-2xl font-bold font-mono text-emerald-400">Rs. {(selectedRegistration.total_amount - (selectedRegistration.discount || 0)).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2"><p className="text-[#94A3B8] text-xs">Reference</p><p className="font-mono text-[#12E2C4]">{selectedRegistration.slip_id || 'N/A'}</p></div>
                </div>
                {loadingDetail && selectedRegistration.has_screenshot && !selectedRegistration.screenshot_url ? (
                  <p className="mt-4 text-xs text-[#94A3B8] flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading payment screenshot...
                  </p>
                ) : selectedRegistration.screenshot_url ? (
                  <div className="mt-4">
                    <p className="text-[#94A3B8] text-xs mb-2">Screenshot</p>
                    <img src={selectedRegistration.screenshot_url} alt="Payment" className="max-w-full rounded-lg border border-white/10" />
                  </div>
                ) : null}
              </div>

              <div className="bg-[#131B38] border border-purple-500/25 text-[#F8FAFC] rounded-xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-purple-400" /> Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-[#94A3B8] text-xs">ID</p><p className="font-mono text-xs break-all">{selectedRegistration.id}</p></div>
                  <div><p className="text-[#94A3B8] text-xs">Date</p><p className="font-medium">{new Date(selectedRegistration.created_at).toLocaleString()}</p></div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* WhatsApp Verification Dialog */}
      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              WhatsApp Group Verification
            </DialogTitle>
            <DialogDescription>
              Search by phone number to verify paid registrations for WhatsApp group requests
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Enter phone number to search (e.g., 03001234567)"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                className="pl-10 h-12 text-lg"
                autoFocus
              />
            </div>

            <div className="bg-[#131B38] border border-white/[0.08] text-[#F8FAFC] rounded-lg p-4">
              <h4 className="font-medium text-[#94A3B8] mb-3">
                {phoneSearch ? 'Search Results' : 'All Paid Registrations'}
              </h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {registrations
                  .filter(r => r.status === 'paid')
                  .filter(r => {
                    if (!phoneSearch) return true;
                    const search = phoneSearch.replace(/\D/g, '');
                    const phone = r.contact_number.replace(/\D/g, '');
                    const altPhone = (r.alternative_contact_number || '').replace(/\D/g, '');
                    return phone.includes(search) || altPhone.includes(search);
                  })
                  .slice(0, 50)
                  .map(reg => {
                    let selectedGames: string[] = [];
                    try { selectedGames = Array.isArray(reg.selected_games) ? reg.selected_games : JSON.parse(reg.selected_games); } catch {}
                    const isMatch = phoneSearch && (
                      reg.contact_number.replace(/\D/g, '').includes(phoneSearch.replace(/\D/g, '')) ||
                      (reg.alternative_contact_number || '').replace(/\D/g, '').includes(phoneSearch.replace(/\D/g, ''))
                    );
                    return (
                      <div
                        key={reg.id}
                        className={`p-3 rounded-lg border transition-all ${
                          isMatch
                            ? 'bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30'
                            : 'bg-[#0B1124] border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold font-mono text-[#12E2C4]">#{reg.registration_number}</span>
                              <span className="font-semibold text-[#F8FAFC]">{reg.name}</span>
                              <span className="text-xs font-mono text-[#94A3B8]">{reg.roll_number}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-lg font-semibold text-[#F8FAFC]">
                                {reg.contact_number}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(reg.contact_number);
                                  setCopiedPhone(reg.contact_number);
                                  setTimeout(() => setCopiedPhone(null), 2000);
                                }}
                              >
                                {copiedPhone === reg.contact_number ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-slate-400" />
                                )}
                              </Button>
                            </div>
                            {reg.alternative_contact_number && (
                              <p className="text-sm text-slate-500">Alt: {reg.alternative_contact_number}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedGames.map(g => (
                                <span key={g} className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">{g}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs px-2 py-1 rounded ${reg.gender === 'boys' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                              {reg.gender === 'boys' ? 'Male' : 'Female'}
                            </span>
                            {isMatch && (
                              <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                VERIFIED
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {registrations.filter(r => r.status === 'paid').filter(r => {
                  if (!phoneSearch) return true;
                  const search = phoneSearch.replace(/\D/g, '');
                  const phone = r.contact_number.replace(/\D/g, '');
                  const altPhone = (r.alternative_contact_number || '').replace(/\D/g, '');
                  return phone.includes(search) || altPhone.includes(search);
                }).length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <XCircle className="h-12 w-12 mx-auto text-rose-300 mb-2" />
                    <p className="font-medium text-rose-600">No paid registration found</p>
                    <p className="text-sm">This phone number is not in paid registrations</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">How to use:</h4>
              <ol className="text-sm text-green-700 list-decimal list-inside space-y-1">
                <li>Copy the phone number from WhatsApp group join request</li>
                <li>Paste it in the search box above</li>
                <li>If the number matches a paid registration, you'll see "VERIFIED"</li>
                <li>Approve the WhatsApp group request for verified users</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {confirmState && (
        <ConfirmDialog
          open={confirmState.open}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          destructive={confirmState.destructive}
          loading={confirmBusy}
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => {
            setConfirmBusy(true);
            try {
              await confirmState.onConfirm();
              setConfirmState(null);
            } finally {
              setConfirmBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}
