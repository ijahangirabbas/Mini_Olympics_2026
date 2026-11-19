'use client';

import { useState, useEffect, useMemo } from 'react';
import { OlympicRingsIcon } from '@/components/olympic-rings-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Calendar,
  Plus,
  Loader2,
  Search,
  Clock,
  MapPin,
  CheckCircle2,
  Swords,
  Trash2,
  Edit,
  Sparkles,
  RefreshCw,
  Radio,
  Phone,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { canEditPage, useAdminSession } from '@/lib/admin-session-context';

type PlayerRecord = {
  id: string;
  registrationNumber: number;
  name: string;
  rollNumber: string;
  contactNumber: string;
  alternativeContactNumber: string | null;
  email: string;
  gender: 'boys' | 'girls';
  teamName: string;
  selectedGames: string[];
  teamMembers: Record<string, { name: string; rollNumber: string; contactNumber: string }[]>;
  status: string;
};

type MatchRecord = {
  id: string;
  game_name: string;
  gender: 'boys' | 'girls';
  round_name: string;
  match_number: number;
  player1_name: string;
  player1_roll: string | null;
  player1_contact: string | null;
  player2_name: string;
  player2_roll: string | null;
  player2_contact: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  venue: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'walkover';
  winner_name: string | null;
  score_summary: string | null;
  pair_reason?: string | null;
  notes: string | null;
  coordinator_username: string | null;
  updated_at: string;
};

export default function CoordinatorPortalPage() {
  const adminSession = useAdminSession();
  const canEdit =
    canEditPage(adminSession, '/admin/coordinator') || canEditPage(adminSession, '/admin/hoc');
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'players'>('matches');
  const [isScopedCoordinator, setIsScopedCoordinator] = useState(true);
  const [assignedGames, setAssignedGames] = useState<string[]>([]);
  const [assignedGender, setAssignedGender] = useState<'boys' | 'girls' | 'both'>('both');
  const [games, setGames] = useState<string[]>([]);
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Match create/edit dialog
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchRecord | null>(null);
  const [savingMatch, setSavingMatch] = useState(false);
  const [matchForm, setMatchForm] = useState({
    gameName: '',
    gender: 'boys' as 'boys' | 'girls',
    roundName: 'Round 1',
    matchNumber: '1',
    player1Id: '',
    player1Name: '',
    player2Id: '',
    player2Name: '',
    scheduledDate: '',
    scheduledTime: '',
    venue: '',
    status: 'scheduled',
    winnerName: '',
    scoreSummary: '',
    notes: '',
    notifyPlayers: false,
  });
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Auto-pair dialog
  const [autoPairOpen, setAutoPairOpen] = useState(false);
  const [autoPairing, setAutoPairing] = useState(false);
  const [autoPairForm, setAutoPairForm] = useState({
    gameName: '',
    gender: 'boys' as 'boys' | 'girls',
    roundName: 'Round 1',
    scheduledDate: '',
    venue: '',
    onlyPaid: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/coordinator?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setIsScopedCoordinator(Boolean(data.isScopedCoordinator));
        setAssignedGames(data.assignedGames || []);
        setAssignedGender(data.assignedGender || 'both');
        setGames(data.games || []);
        setPlayers(data.players || []);
        setMatches(data.matches || []);

        if ((data.games || []).length === 1) {
          setSelectedGame(data.games[0]);
        }
        if (data.assignedGender && data.assignedGender !== 'both') {
          setSelectedGender(data.assignedGender);
        }
      }
    } catch (err) {
      console.error('Failed to load coordinator portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const baseFilteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (selectedGame !== 'all' && !p.selectedGames.some((g) => g.toLowerCase() === selectedGame.toLowerCase())) {
        return false;
      }
      if (selectedGender !== 'all' && p.gender !== selectedGender) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hay = [p.name, p.teamName, p.rollNumber, p.contactNumber, String(p.registrationNumber)]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [players, selectedGame, selectedGender, searchQuery]);

  const filteredPlayers = useMemo(() => {
    if (paymentFilter === 'paid') {
      return baseFilteredPlayers.filter((p) => p.status === 'paid');
    }
    return baseFilteredPlayers;
  }, [baseFilteredPlayers, paymentFilter]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedGame !== 'all' && m.game_name.toLowerCase() !== selectedGame.toLowerCase()) {
        return false;
      }
      if (selectedGender !== 'all' && m.gender !== selectedGender) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hay = [m.player1_name, m.player2_name, m.round_name, m.venue || '', m.game_name]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [matches, selectedGame, selectedGender, searchQuery]);

  const playersForMatchForm = useMemo(() => {
    return players.filter(
      (p) =>
        p.gender === matchForm.gender &&
        (!matchForm.gameName ||
          p.selectedGames.some((g) => g.toLowerCase() === matchForm.gameName.toLowerCase()))
    );
  }, [players, matchForm.gameName, matchForm.gender]);

  const openNewMatchDialog = () => {
    const defaultGame = selectedGame !== 'all' ? selectedGame : games[0] || '';
    const defaultGender: 'boys' | 'girls' =
      selectedGender === 'girls'
        ? 'girls'
        : assignedGender === 'girls'
          ? 'girls'
          : 'boys';
    setEditingMatch(null);
    setMatchForm({
      gameName: defaultGame,
      gender: defaultGender,
      roundName: 'Round 1',
      matchNumber: String(filteredMatches.length + 1),
      player1Id: '',
      player1Name: '',
      player2Id: '',
      player2Name: '',
      scheduledDate: '',
      scheduledTime: '',
      venue: '',
      status: 'scheduled',
      winnerName: '',
      scoreSummary: '',
      notes: '',
      notifyPlayers: false,
    });
    setMatchDialogOpen(true);
  };

  const openEditMatchDialog = (m: MatchRecord) => {
    setEditingMatch(m);
    setMatchForm({
      gameName: m.game_name,
      gender: m.gender,
      roundName: m.round_name,
      matchNumber: String(m.match_number),
      player1Id: '',
      player1Name: m.player1_name,
      player2Id: '',
      player2Name: m.player2_name,
      scheduledDate: m.scheduled_date || '',
      scheduledTime: m.scheduled_time || '',
      venue: m.venue || '',
      status: m.status,
      winnerName: m.winner_name || '',
      scoreSummary: m.score_summary || '',
      notes: m.notes || '',
      notifyPlayers: false,
    });
    setMatchDialogOpen(true);
  };

  const handleSelectPlayer1 = (playerId: string) => {
    const p = playersForMatchForm.find((x) => x.id === playerId);
    setMatchForm((prev) => ({
      ...prev,
      player1Id: playerId,
      player1Name: p ? p.teamName || p.name : prev.player1Name,
    }));
  };

  const handleSelectPlayer2 = (playerId: string) => {
    const p = playersForMatchForm.find((x) => x.id === playerId);
    setMatchForm((prev) => ({
      ...prev,
      player2Id: playerId,
      player2Name: p ? p.teamName || p.name : prev.player2Name,
    }));
  };

  const submitMatchRequest = async (forceOverride = false) => {
    if (!matchForm.gameName || !matchForm.player1Name.trim() || !matchForm.player2Name.trim()) {
      toast.error('Game, Player/Team 1, and Player/Team 2 are required.');
      return;
    }

    setSavingMatch(true);
    try {
      const p1 = players.find((x) => x.id === matchForm.player1Id);
      const p2 = players.find((x) => x.id === matchForm.player2Id);
      const res = await fetch('/api/admin/coordinator', {
        method: editingMatch ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingMatch
            ? {
                id: editingMatch.id,
                roundName: matchForm.roundName,
                matchNumber: Number(matchForm.matchNumber) || 1,
                player1Name: matchForm.player1Name.trim(),
                player2Name: matchForm.player2Name.trim(),
                scheduledDate: matchForm.scheduledDate,
                scheduledTime: matchForm.scheduledTime,
                venue: matchForm.venue,
                status: matchForm.status,
                winnerName: matchForm.winnerName || null,
                scoreSummary: matchForm.scoreSummary || null,
                notes: matchForm.notes || null,
                notifyPlayers: matchForm.notifyPlayers,
                forceOverride,
                overrideReason: forceOverride ? 'HOC schedule/state override' : undefined,
              }
            : {
                gameName: matchForm.gameName,
                gender: matchForm.gender,
                roundName: matchForm.roundName,
                matchNumber: Number(matchForm.matchNumber) || 1,
                player1Name: matchForm.player1Name.trim(),
                player1RegId: p1?.id || null,
                player1Roll: p1?.rollNumber || null,
                player1Contact: p1?.contactNumber || null,
                player2Name: matchForm.player2Name.trim(),
                player2RegId: p2?.id || null,
                player2Roll: p2?.rollNumber || null,
                player2Contact: p2?.contactNumber || null,
                scheduledDate: matchForm.scheduledDate,
                scheduledTime: matchForm.scheduledTime,
                venue: matchForm.venue,
                notes: matchForm.notes,
                notifyPlayers: matchForm.notifyPlayers,
                forceOverride,
              }
        ),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 409 && data.canOverride && !forceOverride) {
          setConfirmState({
            open: true,
            title: 'Schedule Conflict / Override Required',
            description: `${data.error} Do you want to force override using HOC permissions?`,
            confirmLabel: 'Force Override',
            destructive: true,
            onConfirm: () => submitMatchRequest(true),
          });
          return;
        }
        toast.error(data.error || 'Failed to save match');
        return;
      }

      toast.success(editingMatch ? 'Match updated' : 'Match scheduled');
      setMatchDialogOpen(false);
      await loadData();
    } catch {
      toast.error('Failed to save match');
    } finally {
      setSavingMatch(false);
    }
  };

  const handleSaveMatch = () => submitMatchRequest(false);

  const handleQuickWinner = async (match: MatchRecord, winnerName: string) => {
    try {
      const res = await fetch('/api/admin/coordinator', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: match.id,
          status: 'completed',
          winnerName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Recorded winner: ${winnerName}`);
        await loadData();
      } else {
        toast.error(data.error || 'Failed to record winner');
      }
    } catch {
      toast.error('Failed to update match');
    }
  };

  const handleQuickStart = async (match: MatchRecord) => {
    try {
      const res = await fetch('/api/admin/coordinator', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: match.id,
          status: 'in_progress',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Match #${match.match_number} is now Ongoing / Live`);
        await loadData();
      } else {
        toast.error(data.error || 'Failed to start match');
      }
    } catch {
      toast.error('Failed to update match status');
    }
  };

  const handleDeleteMatch = (id: string) => {
    setConfirmState({
      open: true,
      title: 'Delete this match record?',
      description: 'Scheduled fixtures can be removed; completed matches require HOC override.',
      confirmLabel: 'Delete Match',
      destructive: true,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/coordinator?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success('Match deleted');
          await loadData();
        } else {
          toast.error(data.error || 'Failed to delete match');
        }
      },
    });
  };

  const handleAutoPair = async () => {
    if (!autoPairForm.gameName) {
      toast.error('Please select a game');
      return;
    }

    const eligible = players.filter(
      (p) =>
        p.gender === autoPairForm.gender &&
        p.selectedGames.some((g) => g.toLowerCase() === autoPairForm.gameName.toLowerCase()) &&
        p.status === 'paid'
    );

    if (eligible.length < 2) {
      toast.error('Need at least 2 verified Paid players/teams to auto-pair.');
      return;
    }

    setAutoPairing(true);
    try {
      const res = await fetch('/api/admin/coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto_pair',
          gameName: autoPairForm.gameName,
          gender: autoPairForm.gender,
          roundName: autoPairForm.roundName,
          scheduledDate: autoPairForm.scheduledDate,
          venue: autoPairForm.venue,
          playerIds: eligible.map((p) => p.id),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to auto-pair matches');
        return;
      }
      toast.success(`Paired ${data.count} Round fixtures`);
      setAutoPairOpen(false);
      await loadData();
    } catch {
      toast.error('Failed to auto-pair matches');
    } finally {
      setAutoPairing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#12E2C4] mx-auto" />
          <p className="text-xs font-mono text-[#94A3B8] tracking-widest uppercase">
            LOADING COORDINATOR PORTAL...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131B38] border border-white/[0.08] text-xs font-mono text-[#F068B1] uppercase tracking-wider mb-2">
            <Swords className="w-3.5 h-3.5" />
            <span>GAME COORDINATOR MATCH DESK</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] uppercase font-['Space_Grotesk'] tracking-tight">
            COORDINATOR PORTAL
          </h1>
          <p className="text-xs font-mono text-[#94A3B8] mt-1">
            {isScopedCoordinator && assignedGames.length > 0
              ? `Assigned Games: ${assignedGames.join(', ')} (${assignedGender})`
              : 'View registered players, arrange match times & venues, and record match results for Admin & HOC.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            className="rounded-xl text-xs font-mono font-bold border-white/[0.12] bg-[#131B38] text-[#F8FAFC] hover:bg-white/[0.08]"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          {canEdit && games.length > 0 && (
            <>
              <Button
                onClick={() => {
                  setAutoPairForm({
                    gameName: selectedGame !== 'all' ? selectedGame : games[0] || '',
                    gender: assignedGender === 'girls' ? 'girls' : 'boys',
                    roundName: 'Round 1',
                    scheduledDate: '',
                    venue: '',
                    onlyPaid: true,
                  });
                  setAutoPairOpen(true);
                }}
                variant="outline"
                className="rounded-xl text-xs font-mono font-bold border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B]/10"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Auto-Pair Round 1
              </Button>
              <Button
                onClick={openNewMatchDialog}
                className="rounded-xl text-xs font-mono font-black tracking-wider bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#0B1124] uppercase"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Schedule Match
              </Button>
            </>
          )}
        </div>
      </div>

      {isScopedCoordinator && assignedGames.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[#131B38] border border-[#F59E0B]/30 text-center space-y-2">
          <OlympicRingsIcon className="w-16 h-9 mx-auto" />
          <h2 className="text-xl font-bold font-['Space_Grotesk'] uppercase">No Games Assigned Yet</h2>
          <p className="text-xs font-mono text-[#94A3B8]">
            Ask your Super Admin or Sub-Admin to assign your sport/game in Permissions & Accounts.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#131B38] border border-white/[0.08]">
              <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Registered Players/Teams</span>
              <p className="text-3xl font-black font-['Space_Grotesk'] text-[#F8FAFC] mt-1">
                {filteredPlayers.length}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#131B38] border border-[#12E2C4]/30">
              <span className="text-[11px] font-mono text-[#12E2C4] uppercase">Total Matches</span>
              <p className="text-3xl font-black font-['Space_Grotesk'] text-[#12E2C4] mt-1">
                {filteredMatches.length}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#131B38] border border-[#F59E0B]/30">
              <span className="text-[11px] font-mono text-[#F59E0B] uppercase">Scheduled / Live</span>
              <p className="text-3xl font-black font-['Space_Grotesk'] text-[#F59E0B] mt-1">
                {filteredMatches.filter((m) => m.status === 'scheduled' || m.status === 'in_progress').length}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#131B38] border border-[#3B82F6]/30">
              <span className="text-[11px] font-mono text-[#3B82F6] uppercase">Completed</span>
              <p className="text-3xl font-black font-['Space_Grotesk'] text-[#3B82F6] mt-1">
                {filteredMatches.filter((m) => m.status === 'completed' || m.status === 'walkover').length}
              </p>
            </div>
          </div>

          {/* Controls & Tabs */}
          <div className="p-4 rounded-2xl bg-[#131B38] border border-white/[0.08] flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('matches')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors ${
                  activeTab === 'matches'
                    ? 'bg-[#12E2C4] text-[#0B1124]'
                    : 'bg-[#0B1124] text-[#94A3B8] hover:text-white border border-white/[0.08]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Matches & Results ({filteredMatches.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('players')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors ${
                  activeTab === 'players'
                    ? 'bg-[#12E2C4] text-[#0B1124]'
                    : 'bg-[#0B1124] text-[#94A3B8] hover:text-white border border-white/[0.08]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Players & Teams ({filteredPlayers.length})</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger className="w-44 bg-[#0B1124] border-white/[0.1] text-xs font-mono rounded-xl">
                  <SelectValue placeholder="All Assigned Games" />
                </SelectTrigger>
                <SelectContent className="bg-[#131B38] border-white/[0.15] text-[#F8FAFC]">
                  <SelectItem value="all">All Games ({games.length})</SelectItem>
                  {games.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(!isScopedCoordinator || assignedGender === 'both') && (
                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger className="w-32 bg-[#0B1124] border-white/[0.1] text-xs font-mono rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131B38] border-white/[0.15] text-[#F8FAFC]">
                    <SelectItem value="all">All Divisions</SelectItem>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search player, team, venue..."
                  className="pl-8 bg-[#0B1124] border-white/[0.1] text-xs font-mono rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* MATCHES TAB */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              {filteredMatches.length === 0 ? (
                <div className="p-12 rounded-2xl bg-[#131B38] border border-white/[0.08] text-center space-y-3">
                  <Swords className="w-10 h-10 text-[#94A3B8] mx-auto opacity-60" />
                  <p className="text-sm font-mono text-[#94A3B8]">
                    No matches scheduled yet. Click &quot;Schedule Match&quot; or &quot;Auto-Pair Round 1&quot; to arrange matches.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl bg-[#131B38] border border-white/[0.08] space-y-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-[#0B1124] border border-[#12E2C4]/30 text-[#12E2C4] text-[11px] font-mono font-bold">
                            {m.game_name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              m.gender === 'boys'
                                ? 'bg-[#3B82F6]/20 text-[#3B82F6]'
                                : 'bg-[#F068B1]/20 text-[#F068B1]'
                            }`}
                          >
                            {m.gender}
                          </span>
                          <span className="text-xs font-mono text-[#F59E0B] font-bold">
                            {m.round_name} • Match #{m.match_number}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            m.status === 'completed' || m.status === 'walkover'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : m.status === 'in_progress'
                                ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                                : m.status === 'cancelled'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-[#3B82F6]/20 text-[#3B82F6]'
                          }`}
                        >
                          {m.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Matchup */}
                      <div className="p-4 rounded-xl bg-[#0B1124] border border-white/[0.06] flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-bold text-sm font-['Space_Grotesk'] truncate ${
                              m.winner_name === m.player1_name ? 'text-[#12E2C4]' : 'text-[#F8FAFC]'
                            }`}
                          >
                            {m.player1_name}
                            {m.winner_name === m.player1_name && ' 🏆'}
                          </p>
                          {m.player1_roll && (
                            <p className="text-[10px] font-mono text-[#94A3B8]">{m.player1_roll}</p>
                          )}
                        </div>

                        <span className="px-2.5 py-1 rounded-lg bg-[#182244] text-[10px] font-mono font-bold text-[#F59E0B] shrink-0">
                          VS
                        </span>

                        <div className="flex-1 min-w-0 text-right">
                          <p
                            className={`font-bold text-sm font-['Space_Grotesk'] truncate ${
                              m.winner_name === m.player2_name ? 'text-[#12E2C4]' : 'text-[#F8FAFC]'
                            }`}
                          >
                            {m.winner_name === m.player2_name && '🏆 '}
                            {m.player2_name}
                          </p>
                          {m.player2_roll && (
                            <p className="text-[10px] font-mono text-[#94A3B8]">{m.player2_roll}</p>
                          )}
                        </div>
                      </div>

                      {/* Time & Venue & Score */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#94A3B8]">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#12E2C4]" />
                          {m.scheduled_date || 'Date TBD'} {m.scheduled_time ? `• ${m.scheduled_time}` : ''}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
                          {m.venue || 'Venue TBD'}
                        </span>
                        {m.score_summary && (
                          <span className="text-[#F8FAFC] font-bold">Score: {m.score_summary}</span>
                        )}
                      </div>
                      {m.pair_reason && (
                        <p className="text-[11px] font-mono text-[#94A3B8]">{m.pair_reason}</p>
                      )}

                      {/* Quick Actions */}
                      {canEdit && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.06]">
                          <div className="flex flex-wrap gap-1.5">
                            {m.status === 'scheduled' && m.player2_name !== 'BYE' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickStart(m)}
                                className="h-7 px-2 text-[10px] font-mono bg-[#0B1124] border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                              >
                                <Radio className="w-3 h-3 mr-1" />
                                Start Live
                              </Button>
                            )}
                            {m.status !== 'completed' && m.player2_name !== 'BYE' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickWinner(m, m.player1_name)}
                                  className="h-7 px-2 text-[10px] font-mono bg-[#0B1124] border-[#12E2C4]/30 text-[#12E2C4] hover:bg-[#12E2C4]/10"
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {m.player1_name.slice(0, 14)} Won
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickWinner(m, m.player2_name)}
                                  className="h-7 px-2 text-[10px] font-mono bg-[#0B1124] border-[#12E2C4]/30 text-[#12E2C4] hover:bg-[#12E2C4]/10"
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {m.player2_name.slice(0, 14)} Won
                                </Button>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditMatchDialog(m)}
                              className="h-7 px-2.5 text-[11px] font-mono bg-[#0B1124] border-white/[0.1] text-[#F8FAFC]"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit / Score
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteMatch(m.id)}
                              className="h-7 w-7 p-0 bg-[#0B1124] border-white/[0.1] text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PLAYERS TAB */}
          {activeTab === 'players' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono ${
                    paymentFilter === 'all'
                      ? 'bg-[#3B82F6] text-white font-bold'
                      : 'bg-[#131B38] text-[#94A3B8] border border-white/[0.08]'
                  }`}
                >
                  All Non-Rejected ({baseFilteredPlayers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentFilter('paid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono ${
                    paymentFilter === 'paid'
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'bg-[#131B38] text-[#94A3B8] border border-white/[0.08]'
                  }`}
                >
                  Paid / Verified Only ({baseFilteredPlayers.filter((p) => p.status === 'paid').length})
                </button>
              </div>

              {filteredPlayers.length === 0 ? (
                <div className="p-12 rounded-2xl bg-[#131B38] border border-white/[0.08] text-center text-sm font-mono text-[#94A3B8]">
                  No registered players or teams found for this filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPlayers.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl bg-[#131B38] border border-white/[0.08] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-[#12E2C4]">
                              #{p.registrationNumber}
                            </span>
                            <h3 className="font-bold text-base font-['Space_Grotesk'] text-[#F8FAFC]">
                              {p.teamName}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                                p.gender === 'boys'
                                  ? 'bg-[#3B82F6]/20 text-[#3B82F6]'
                                  : 'bg-[#F068B1]/20 text-[#F068B1]'
                              }`}
                            >
                              {p.gender}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-[#94A3B8] mt-1">
                            Captain: <span className="text-[#F8FAFC]">{p.name}</span> ({p.rollNumber})
                          </p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            p.status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {p.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#94A3B8]">
                        <span className="inline-flex items-center gap-1 text-[#F8FAFC]">
                          <Phone className="w-3.5 h-3.5 text-[#12E2C4]" />
                          {p.contactNumber}
                        </span>
                        {p.alternativeContactNumber && <span>Alt: {p.alternativeContactNumber}</span>}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {p.selectedGames.map((g) => (
                          <span
                            key={g}
                            className="px-2 py-0.5 rounded bg-[#0B1124] border border-white/[0.08] text-[11px] font-mono text-[#F59E0B]"
                          >
                            {g}
                          </span>
                        ))}
                      </div>

                      {/* Team Roster if present */}
                      {Object.entries(p.teamMembers || {}).map(([gName, members]) =>
                        Array.isArray(members) && members.length > 0 ? (
                          <div
                            key={gName}
                            className="p-3 rounded-xl bg-[#0B1124] border border-white/[0.06] space-y-1"
                          >
                            <p className="text-[10px] font-mono font-bold text-[#12E2C4] uppercase">
                              {gName} Roster ({members.length + 1} players)
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-mono text-[#94A3B8]">
                              {members.map((m, idx) => (
                                <div key={idx} className="truncate">
                                  • {m.name || 'Unnamed'} ({m.rollNumber || '-'})
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Schedule / Edit Match Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[#131B38] border border-white/[0.15] text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk'] uppercase">
              {editingMatch ? 'Edit Match & Result' : 'Schedule New Match'}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-[#94A3B8]">
              Arrange match time, venue, participants, and record match results.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Game *</Label>
                <Select
                  value={matchForm.gameName}
                  onValueChange={(v) => setMatchForm({ ...matchForm, gameName: v })}
                  disabled={!!editingMatch}
                >
                  <SelectTrigger className="bg-[#0B1124] border-white/[0.1] text-xs font-mono">
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131B38] border-white/[0.15] text-[#F8FAFC]">
                    {games.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Division *</Label>
                <Select
                  value={matchForm.gender}
                  onValueChange={(v) => setMatchForm({ ...matchForm, gender: v as 'boys' | 'girls' })}
                  disabled={!!editingMatch || (isScopedCoordinator && assignedGender !== 'both')}
                >
                  <SelectTrigger className="bg-[#0B1124] border-white/[0.1] text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131B38] border-white/[0.15] text-[#F8FAFC]">
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Round Name</Label>
                <Input
                  value={matchForm.roundName}
                  onChange={(e) => setMatchForm({ ...matchForm, roundName: e.target.value })}
                  placeholder="Round 1 / Quarter Final"
                  className="bg-[#0B1124] border-white/[0.1] text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Match #</Label>
                <Input
                  type="number"
                  value={matchForm.matchNumber}
                  onChange={(e) => setMatchForm({ ...matchForm, matchNumber: e.target.value })}
                  className="bg-[#0B1124] border-white/[0.1] text-xs font-mono"
                />
              </div>
            </div>

            {/* Player 1 & Player 2 pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Player / Team 1 *</Label>
                {!editingMatch && playersForMatchForm.length > 0 && (
                  <Select value={matchForm.player1Id} onValueChange={handleSelectPlayer1}>
                    <SelectTrigger className="bg-[#0B1124] border-white/[0.1] text-xs font-mono">
                      <SelectValue placeholder="Pick registered team/player" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#131B38] border-white/[0.15] text-[#F8FAFC]">
                      {playersForMatchForm.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          #{p.registrationNumber} {p.teamName} ({p.name}) [{p.status === 'paid' ? 'Paid' : 'Pending'}]
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  value={matchForm.player1Name}
                  onChange={(e) => setMatchForm({ ...matchForm, player1Name: e.target.value })}
                  placeholder="Or type name"
                  className="bg-[#0B1124] border-white/[0.1] text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Player / Team 2 *</Label>
                {!editingMatch && playersForMatchForm.length > 0 && (
                  <Select value={matchForm.player2Id} onValueChange={handleSelectPlayer2}>
                    <SelectTrigger className="bg-[#0B1124] border-white/[0.1] text-xs font-mono">
                      <SelectValue placeholder="Pick registered team/player" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#131B38] border-white/[0.15] text-[#F8FAFC]">
                      {playersForMatchForm.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          #{p.registrationNumber} {p.teamName} ({p.name}) [{p.status === 'paid' ? 'Paid' : 'Pending'}]
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  value={matchForm.player2Name}
                  onChange={(e) => setMatchForm({ ...matchForm, player2Name: e.target.value })}
                  placeholder="Or type name / BYE"
                  className="bg-[#0B1124] border-white/[0.1] text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Date</Label>
                <Input
                  type="date"
                  value={matchForm.scheduledDate}
                  onChange={(e) => setMatchForm({ ...matchForm, scheduledDate: e.target.value })}
                  className="bg-[#0B1124] border-white/[0.1] text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Time</Label>
                <Input
                  type="time"
                  value={matchForm.scheduledTime}
                  onChange={(e) => setMatchForm({ ...matchForm, scheduledTime: e.target.value })}
                  className="bg-[#0B1124] border-white/[0.1] text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Venue / Court</Label>
                <Input
                  value={matchForm.venue}
                  onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                  placeholder="Ground / Hall 1"
                  className="bg-[#0B1124] border-white/[0.1] text-xs font-mono"
                />
              </div>
            </div>

            {editingMatch && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/[0.08]">
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono text-[#94A3B8]">Status</Label>
                  <Select
                    value={matchForm.status}
                    onValueChange={(v) => setMatchForm({ ...matchForm, status: v })}
                  >
                    <SelectTrigger className="bg-[#0B1124] border-white/[0.1] text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#131B38] border-white/[0.15] text-[#F8FAFC]">
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="walkover">Walkover</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-mono text-[#94A3B8]">Winner</Label>
                  <Select
                    value={matchForm.winnerName || 'none'}
                    onValueChange={(v) => setMatchForm({ ...matchForm, winnerName: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger className="bg-[#0B1124] border-white/[0.1] text-xs font-mono">
                      <SelectValue placeholder="Select winner" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#131B38] border-white/[0.15] text-[#F8FAFC]">
                      <SelectItem value="none">Not Decided</SelectItem>
                      {matchForm.player1Name && (
                        <SelectItem value={matchForm.player1Name}>{matchForm.player1Name}</SelectItem>
                      )}
                      {matchForm.player2Name && (
                        <SelectItem value={matchForm.player2Name}>{matchForm.player2Name}</SelectItem>
                      )}
                      <SelectItem value="Draw">Draw / Tie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-mono text-[#94A3B8]">Score / Result Summary</Label>
                  <Input
                    value={matchForm.scoreSummary}
                    onChange={(e) => setMatchForm({ ...matchForm, scoreSummary: e.target.value })}
                    placeholder="e.g. 2-1 (21-18, 19-21, 21-14)"
                    className="bg-[#0B1124] border-white/[0.1] text-xs font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-[#94A3B8]">Notes</Label>
              <Input
                value={matchForm.notes}
                onChange={(e) => setMatchForm({ ...matchForm, notes: e.target.value })}
                placeholder="Optional umpire / court notes"
                className="bg-[#0B1124] border-white/[0.1] text-xs font-mono"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] cursor-pointer">
              <input
                type="checkbox"
                checked={matchForm.notifyPlayers}
                onChange={(e) => setMatchForm({ ...matchForm, notifyPlayers: e.target.checked })}
                className="w-4 h-4 accent-[#12E2C4]"
              />
              <span>Send schedule / result update email to players</span>
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMatchDialogOpen(false)}
              className="bg-transparent border-white/[0.15] text-[#94A3B8]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMatch}
              disabled={savingMatch}
              className="bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#0B1124] font-mono font-bold"
            >
              {savingMatch && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingMatch ? 'Update Match' : 'Create Match'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Pair Round 1 Dialog */}
      <Dialog open={autoPairOpen} onOpenChange={setAutoPairOpen}>
        <DialogContent className="max-w-md bg-[#131B38] border border-white/[0.15] text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk'] uppercase flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#F59E0B]" />
              Auto-Pair Round 1 Matches
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-[#94A3B8]">
              Randomly pairs registered players/teams for your game into Round 1 fixtures. You can edit times & venues afterward.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-[#94A3B8]">Game</Label>
              <Select
                value={autoPairForm.gameName}
                onValueChange={(v) => setAutoPairForm({ ...autoPairForm, gameName: v })}
              >
                <SelectTrigger className="bg-[#0B1124] border-white/[0.1] text-xs font-mono">
                  <SelectValue placeholder="Select game" />
                </SelectTrigger>
                <SelectContent className="bg-[#131B38] border-white/[0.15] text-[#F8FAFC]">
                  {games.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Division</Label>
                <Select
                  value={autoPairForm.gender}
                  onValueChange={(v) => setAutoPairForm({ ...autoPairForm, gender: v as 'boys' | 'girls' })}
                  disabled={isScopedCoordinator && assignedGender !== 'both'}
                >
                  <SelectTrigger className="bg-[#0B1124] border-white/[0.1] text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131B38] border-white/[0.15] text-[#F8FAFC]">
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Round Name</Label>
                <Input
                  value={autoPairForm.roundName}
                  onChange={(e) => setAutoPairForm({ ...autoPairForm, roundName: e.target.value })}
                  className="bg-[#0B1124] border-white/[0.1] text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Date (optional)</Label>
                <Input
                  type="date"
                  value={autoPairForm.scheduledDate}
                  onChange={(e) => setAutoPairForm({ ...autoPairForm, scheduledDate: e.target.value })}
                  className="bg-[#0B1124] border-white/[0.1] text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Default Venue</Label>
                <Input
                  value={autoPairForm.venue}
                  onChange={(e) => setAutoPairForm({ ...autoPairForm, venue: e.target.value })}
                  placeholder="Court / Ground"
                  className="bg-[#0B1124] border-white/[0.1] text-xs font-mono"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] cursor-pointer">
              <input
                type="checkbox"
                checked={autoPairForm.onlyPaid}
                onChange={(e) => setAutoPairForm({ ...autoPairForm, onlyPaid: e.target.checked })}
                className="w-4 h-4 accent-[#12E2C4]"
              />
              <span>Include Paid / Verified registrations only</span>
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAutoPairOpen(false)}
              className="bg-transparent border-white/[0.15] text-[#94A3B8]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAutoPair}
              disabled={autoPairing}
              className="bg-[#F59E0B] hover:bg-[#d98a07] text-[#0B1124] font-mono font-bold"
            >
              {autoPairing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Generate Pairings
            </Button>
          </DialogFooter>
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
