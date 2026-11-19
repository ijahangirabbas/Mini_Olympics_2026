'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { canEditPage, useAdminSession } from '@/lib/admin-session-context';
import {
  Calendar,
  Users,
  Loader2,
  Download,
  Trash2,
  RefreshCw,
  FileText,
  Swords,
  Clock,
  MapPin,
  UserPlus,
  ArrowRightLeft,
  ShieldAlert,
  Radio,
  MessageSquare,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { OlympicRingsIcon } from '@/components/olympic-rings-icon';

type GamePrice = {
  name: string;
  boys: number | null;
  girls: number | null;
};

type Team = {
  id?: string;
  team_name: string;
  name: string;
  gender: string;
  selected_games: string[];
};

type MatchSchedule = {
  id: string;
  game_name: string;
  gender: string;
  schedule_data: string;
  generated_by: string;
  created_at: string;
};

type CoordinatorMatch = {
  id: string;
  game_name: string;
  gender: 'boys' | 'girls';
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
  pair_reason?: string | null;
  coordinator_id?: string | null;
  coordinator_username: string | null;
};

type CoordinatorSummary = {
  id: string;
  username: string;
  displayName: string;
  assignedGames: string[];
  assignedGender: string;
  isActive: boolean;
};

export default function HOCPage() {
  const adminSession = useAdminSession();
  const canEdit = canEditPage(adminSession, '/admin/hoc');
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedules, setSchedules] = useState<MatchSchedule[]>([]);
  const [coordinatorMatches, setCoordinatorMatches] = useState<CoordinatorMatch[]>([]);
  const [coordinators, setCoordinators] = useState<CoordinatorSummary[]>([]);
  const [playersPool, setPlayersPool] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [availableGames, setAvailableGames] = useState<GamePrice[]>([]);

  // Filters on unified coordinator_matches view
  const [coordGameFilter, setCoordGameFilter] = useState('all');
  const [coordStatusFilter, setCoordStatusFilter] = useState('all');
  const [coordUserFilter, setCoordUserFilter] = useState('all');
  const [coordDateFilter, setCoordDateFilter] = useState('');

  // Deterministic bracket builder state
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedGender, setSelectedGender] = useState<'boys' | 'girls'>('boys');
  const [format, setFormat] = useState<'knockout' | 'round_robin' | 'group_stage'>('knockout');
  const [matchDate, setMatchDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [venue, setVenue] = useState('Main Ground');
  const [seedInput, setSeedInput] = useState('');
  const [syncToMatches, setSyncToMatches] = useState(true);

  // Coordinator assignment & reassignment state
  const [assignCoordId, setAssignCoordId] = useState('');
  const [assignPlayerId, setAssignPlayerId] = useState('');
  const [assignGameName, setAssignGameName] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [reassignFromId, setReassignFromId] = useState('');
  const [reassignToId, setReassignToId] = useState('');
  const [reassignGame, setReassignGame] = useState('all');
  const [reassigning, setReassigning] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [mRes, gRes, cRes, aRes] = await Promise.all([
        fetch('/api/admin/matches', { cache: 'no-store' }),
        fetch(`/api/games?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/admin/coordinator?t=${Date.now()}`, { cache: 'no-store' }),
        fetch('/api/admin/coordinators/assignments', { cache: 'no-store' }),
      ]);
      const [mData, gData, cData, aData] = await Promise.all([
        mRes.json(),
        gRes.json(),
        cRes.json(),
        aRes.json(),
      ]);
      if (mData.success) {
        setTeams(mData.teams || []);
        setSchedules(mData.schedules || []);
      }
      if (gData.success) {
        setAvailableGames(gData.data || []);
      }
      if (cData.success) {
        setCoordinatorMatches(cData.matches || []);
        setCoordinators(cData.coordinators || []);
        setPlayersPool(cData.players || []);
      }
      if (aData.success) {
        setAssignments(aData.playerAssignments || []);
      }
    } catch {
      toast.error('Failed to load HOC portal data');
    } finally {
      setLoading(false);
    }
  };

  const getTeamsForGame = () => {
    if (!selectedGame || !selectedGender) return [];
    return teams.filter((t) => {
      const games = Array.isArray(t.selected_games)
        ? t.selected_games
        : typeof t.selected_games === 'string'
          ? JSON.parse(t.selected_games || '[]')
          : [];
      return (
        t.gender === selectedGender &&
        games.some((g: string) => g.toLowerCase() === selectedGame.toLowerCase())
      );
    });
  };

  const handleGenerateMatches = async () => {
    const gameTeams = getTeamsForGame();
    if (gameTeams.length < 2) {
      toast.error('Need at least 2 verified paid teams to generate fixtures');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: selectedGame,
          gender: selectedGender,
          format,
          matchDate: matchDate || undefined,
          startTime: startTime || undefined,
          venue: venue || undefined,
          seed: seedInput.trim() || undefined,
          syncToMatches,
          teams: gameTeams.map((t) => t.team_name),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Generated ${format.replace('_', ' ')} schedule` +
            (data.syncedMatchesCount ? ` & synced ${data.syncedMatchesCount} live fixtures` : '')
        );
        await loadAll();
      } else {
        toast.error(data.error || 'Failed to generate fixtures');
      }
    } catch {
      toast.error('Failed to generate schedule');
    } finally {
      setGenerating(false);
    }
  };

  const handleAssignPlayer = async () => {
    if (!assignCoordId || !assignPlayerId) {
      toast.error('Select both a coordinator and a player');
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/coordinators/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinatorUserId: assignCoordId,
          registrationId: assignPlayerId,
          gameName: assignGameName || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Player assigned to coordinator roster');
        setAssignPlayerId('');
        await loadAll();
      } else {
        toast.error(data.error || 'Failed to assign player');
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleReassignDuties = async () => {
    if (!reassignFromId || !reassignToId) {
      toast.error('Select source and target coordinators');
      return;
    }
    setReassigning(true);
    try {
      const res = await fetch('/api/admin/coordinators/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCoordinatorId: reassignFromId,
          toCoordinatorId: reassignToId,
          gameName: reassignGame === 'all' ? undefined : reassignGame,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Transferred ${data.movedMatches} matches and ${data.movedPlayers} player assignments to @${data.targetUsername}`);
        await loadAll();
      } else {
        toast.error(data.error || 'Failed to reassign');
      }
    } finally {
      setReassigning(false);
    }
  };

  const handleDownloadPDF = (schedule: MatchSchedule) => {
    try {
      const scheduleData: any = JSON.parse(schedule.schedule_data);
      const pdf = new jsPDF('portrait');
      const pageWidth = pdf.internal.pageSize.getWidth();

      pdf.setFillColor(19, 27, 56);
      pdf.rect(0, 0, pageWidth, 35, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MINI OLYMPICS 2026', pageWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(13);
      pdf.text(`${schedule.game_name} - ${schedule.gender.toUpperCase()}`, pageWidth / 2, 24, { align: 'center' });
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Format: ${scheduleData.format} | Seed: ${scheduleData.seed || 'default'}`, pageWidth / 2, 31, { align: 'center' });

      let y = 46;
      const rounds: any[] = Array.isArray(scheduleData.rounds) ? scheduleData.rounds : [];
      for (const round of rounds) {
        if (y > 260) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFillColor(18, 226, 196);
        pdf.rect(10, y, pageWidth - 20, 8, 'F');
        pdf.setTextColor(8, 13, 28);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(round.round || round.name || 'Round', 14, y + 5.5);
        y += 12;

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');

        for (const match of round.matches || []) {
          if (y > 275) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(`#${match.matchNumber || match.match}:`, 12, y);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${match.team1}  vs  ${match.team2}`, 28, y);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`${match.time || 'TBD'} | ${match.venue || 'Arena'}`, 132, y);
          y += 8;
        }
        y += 4;
      }

      pdf.save(`Match_Schedule_${schedule.game_name}_${schedule.gender}.pdf`);
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const gameTeams = getTeamsForGame();
  const existingSchedule = schedules.find(
    (s) => s.game_name.toLowerCase() === selectedGame.toLowerCase() && s.gender === selectedGender
  );

  const filteredMatches = coordinatorMatches.filter((m) => {
    if (coordGameFilter !== 'all' && m.game_name !== coordGameFilter) return false;
    if (coordStatusFilter !== 'all' && m.status !== coordStatusFilter) return false;
    if (coordUserFilter !== 'all' && m.coordinator_id !== coordUserFilter) return false;
    if (coordDateFilter && m.scheduled_date !== coordDateFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080D1C]">
        <Loader2 className="h-8 w-8 animate-spin text-[#12E2C4]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto space-y-6 text-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131B38] border border-white/[0.08] text-xs font-mono text-[#12E2C4] uppercase tracking-wider mb-2">
            <span>// HEAD OF COMPETITION</span>
          </div>
          <h1 className="text-3xl font-black text-[#F8FAFC] uppercase font-['Space_Grotesk'] tracking-tight flex items-center gap-3">
            <OlympicRingsIcon className="w-10 h-6" />
            HOC Tournament Control
          </h1>
          <p className="text-xs font-mono text-[#94A3B8] mt-1">
            DETERMINISTIC SEEDED FIXTURES • COORDINATOR OVERSIGHT • MATCH OVERRIDE
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={loadAll}
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/5 text-[#F8FAFC]"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Link href="/admin/super">
            <Button
              variant="outline"
              size="sm"
              className="border-white/15 bg-white/5 text-[#F8FAFC] hover:bg-white/10"
            >
              <MessageSquare className="h-4 w-4 mr-1.5 text-[#12E2C4]" />
              Sport Groups
            </Button>
          </Link>
          <Link href="/admin/coordinator">
            <Button size="sm" className="bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#080D1C] font-bold">
              <Swords className="h-4 w-4 mr-1.5" />
              Coordinator Board
            </Button>
          </Link>
        </div>
      </div>

      {/* Deterministic Bracket Generator & Preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-[#131B38] text-[#F8FAFC] border border-white/[0.08]">
          <CardHeader className="border-b border-white/[0.08]">
            <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <Calendar className="h-5 w-5 text-[#12E2C4]" />
              Deterministic Bracket Generator
            </CardTitle>
            <CardDescription className="text-[#94A3B8]">
              Reproducible seeded fixtures strictly from verified paid registrations (no external AI dependency).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#94A3B8]">Game</Label>
                <Select value={selectedGame} onValueChange={setSelectedGame}>
                  <SelectTrigger className="bg-[#0B1124] border-white/15 text-[#F8FAFC]">
                    <SelectValue placeholder="Choose a game" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGames.map((g) => (
                      <SelectItem key={g.name} value={g.name}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#94A3B8]">Division</Label>
                <Select value={selectedGender} onValueChange={(v: 'boys' | 'girls') => setSelectedGender(v)}>
                  <SelectTrigger className="bg-[#0B1124] border-white/15 text-[#F8FAFC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedGame && (
              <div className="p-3 rounded-xl bg-[#0B1124] border border-white/[0.08] flex items-center justify-between text-xs font-mono">
                <span className="text-[#94A3B8]">Verified Paid Teams ({selectedGender})</span>
                <span className="text-[#12E2C4] font-bold">{gameTeams.length}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#94A3B8]">Tournament Format</Label>
                <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                  <SelectTrigger className="bg-[#0B1124] border-white/15 text-[#F8FAFC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="knockout">Single Elimination Knockout</SelectItem>
                    <SelectItem value="round_robin">Round Robin (Circle Method)</SelectItem>
                    <SelectItem value="group_stage">Group Stage (Groups of 4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#94A3B8]">Venue</Label>
                <Input
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#94A3B8]">Match Date</Label>
                <Input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#94A3B8]">Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#94A3B8]">Draw Seed (Optional)</Label>
                <Input
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  placeholder="Auto daily seed if empty"
                  className="bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-[#E2E8F0] pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncToMatches}
                  onChange={(e) => setSyncToMatches(e.target.checked)}
                />
                <span>Publish fixtures directly to Coordinator Matches</span>
              </label>
            </div>

            {canEdit && (
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleGenerateMatches}
                  disabled={generating || !selectedGame || gameTeams.length < 2}
                  className="flex-1 bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#080D1C] font-bold"
                >
                  {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate Seeded Schedule
                </Button>
                {existingSchedule && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadPDF(existingSchedule)}
                    className="border-white/15 bg-white/5 text-[#F8FAFC]"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    PDF
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="bg-[#131B38] text-[#F8FAFC] border border-white/[0.08]">
          <CardHeader className="border-b border-white/[0.08]">
            <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <FileText className="h-5 w-5 text-[#F59E0B]" />
              Schedule Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {existingSchedule ? (
              (() => {
                let data: any = null;
                try {
                  data =
                    typeof existingSchedule.schedule_data === 'string'
                      ? JSON.parse(existingSchedule.schedule_data)
                      : existingSchedule.schedule_data;
                } catch {
                  data = null;
                }
                if (!data) {
                  return (
                    <div className="py-12 text-center text-xs font-mono text-red-300">
                      Unable to parse saved schedule data. Regenerate the bracket to fix it.
                    </div>
                  );
                }
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2.5 py-1 rounded-full bg-[#12E2C4]/15 text-[#12E2C4] uppercase">
                        {data.format}
                      </span>
                      <span className="text-[#94A3B8]">Seed: {data.seed || 'default'}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                      {(data.rounds || []).map((round: any, idx: number) => (
                        <div key={idx} className="border border-white/10 rounded-xl overflow-hidden bg-[#0B1124]">
                          <div className="bg-[#182244] px-3 py-2 text-xs font-mono font-bold text-[#12E2C4]">
                            {round.round || round.name}
                          </div>
                          <div className="divide-y divide-white/[0.06]">
                            {(round.matches || []).map((m: any, mIdx: number) => (
                              <div key={mIdx} className="p-2.5 flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#F8FAFC]">{m.team1}</span>
                                <span className="text-[#94A3B8] font-mono">vs</span>
                                <span className="font-semibold text-[#F8FAFC]">{m.team2}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="py-16 text-center text-xs font-mono text-[#94A3B8]">
                Select a game &amp; division and click Generate Seeded Schedule to preview rounds.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coordinator Player Assignment & Bulk Duty Reassignment */}
      {canEdit && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-[#131B38] text-[#F8FAFC] border border-white/[0.08]">
            <CardHeader className="border-b border-white/[0.08]">
              <CardTitle className="flex items-center gap-2 text-base text-[#F8FAFC]">
                <UserPlus className="h-4 w-4 text-[#12E2C4]" />
                Assign Player to Coordinator Roster
              </CardTitle>
              <CardDescription className="text-[#94A3B8] text-xs">
                Optionally scope a coordinator to specific players/teams ({assignments.length} explicit assignments active).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Select value={assignCoordId} onValueChange={setAssignCoordId}>
                  <SelectTrigger className="bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]">
                    <SelectValue placeholder="Coordinator" />
                  </SelectTrigger>
                  <SelectContent>
                    {coordinators.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        @{c.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={assignPlayerId} onValueChange={setAssignPlayerId}>
                  <SelectTrigger className="bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]">
                    <SelectValue placeholder="Verified Player" />
                  </SelectTrigger>
                  <SelectContent>
                    {playersPool.slice(0, 100).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        #{p.registrationNumber} {p.teamName} ({p.gender})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={assignGameName}
                  onChange={(e) => setAssignGameName(e.target.value)}
                  placeholder="Game (optional)"
                  className="bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]"
                />
              </div>
              <Button
                onClick={handleAssignPlayer}
                disabled={assigning || !assignCoordId || !assignPlayerId}
                size="sm"
                className="bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#080D1C] font-bold"
              >
                {assigning && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Assign Player
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#131B38] text-[#F8FAFC] border border-white/[0.08]">
            <CardHeader className="border-b border-white/[0.08]">
              <CardTitle className="flex items-center gap-2 text-base text-[#F8FAFC]">
                <ArrowRightLeft className="h-4 w-4 text-[#F59E0B]" />
                Bulk Reassign Coordinator Duties
              </CardTitle>
              <CardDescription className="text-[#94A3B8] text-xs">
                Transfer scheduled fixtures &amp; assigned players cleanly if a coordinator steps away.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Select value={reassignFromId} onValueChange={setReassignFromId}>
                  <SelectTrigger className="bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]">
                    <SelectValue placeholder="From Coordinator" />
                  </SelectTrigger>
                  <SelectContent>
                    {coordinators.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        @{c.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={reassignToId} onValueChange={setReassignToId}>
                  <SelectTrigger className="bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]">
                    <SelectValue placeholder="To Coordinator" />
                  </SelectTrigger>
                  <SelectContent>
                    {coordinators.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        @{c.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={reassignGame} onValueChange={setReassignGame}>
                  <SelectTrigger className="bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]">
                    <SelectValue placeholder="Game scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    {availableGames.map((g) => (
                      <SelectItem key={g.name} value={g.name}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleReassignDuties}
                disabled={reassigning || !reassignFromId || !reassignToId}
                size="sm"
                className="bg-[#F59E0B] hover:bg-amber-600 text-[#080D1C] font-bold"
              >
                {reassigning && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Transfer Scheduled Matches
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Unified Live Match Oversight (Single source: coordinator_matches) */}
      <Card className="bg-[#131B38] text-[#F8FAFC] border border-white/[0.08]">
        <CardHeader className="border-b border-white/[0.08]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
                <Swords className="h-5 w-5 text-[#12E2C4]" />
                Live Match Feed ({filteredMatches.length})
              </CardTitle>
              <CardDescription className="text-[#94A3B8]">
                Synced directly from Coordinator Portal &amp; Bracket Generator (single source of truth).
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={coordGameFilter} onValueChange={setCoordGameFilter}>
                <SelectTrigger className="w-36 bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]">
                  <SelectValue placeholder="All Games" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  {availableGames.map((g) => (
                    <SelectItem key={g.name} value={g.name}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={coordStatusFilter} onValueChange={setCoordStatusFilter}>
                <SelectTrigger className="w-32 bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="walkover">Walkover</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={coordUserFilter} onValueChange={setCoordUserFilter}>
                <SelectTrigger className="w-36 bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]">
                  <SelectValue placeholder="Coordinator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coordinators</SelectItem>
                  {coordinators.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      @{c.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={coordDateFilter}
                onChange={(e) => setCoordDateFilter(e.target.value)}
                className="w-36 bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-[#94A3B8]">
              No matches match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="bg-[#0B1124] border-b border-white/10">
                    <TableHead className="text-[#94A3B8] text-xs font-mono">Game &amp; Round</TableHead>
                    <TableHead className="text-[#94A3B8] text-xs font-mono">Matchup &amp; Pair Reason</TableHead>
                    <TableHead className="text-[#94A3B8] text-xs font-mono">Time &amp; Venue</TableHead>
                    <TableHead className="text-[#94A3B8] text-xs font-mono">Status &amp; Result</TableHead>
                    <TableHead className="text-[#94A3B8] text-xs font-mono">Coordinator</TableHead>
                    {canEdit && <TableHead className="text-[#94A3B8] text-xs font-mono text-right">Override</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((m) => (
                    <TableRow key={m.id} className="border-b border-white/[0.06]">
                      <TableCell>
                        <p className="font-semibold text-[#F8FAFC]">{m.game_name}</p>
                        <p className="text-xs text-[#94A3B8] font-mono">
                          {m.gender.toUpperCase()} • {m.round_name} #{m.match_number}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-[#F8FAFC]">
                          {m.player1_name} <span className="text-[#94A3B8]">vs</span> {m.player2_name}
                        </p>
                        {m.pair_reason && (
                          <p className="text-[11px] text-[#94A3B8] font-mono mt-0.5">{m.pair_reason}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-[#E2E8F0]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#12E2C4]" />
                          <span>
                            {m.scheduled_date || 'Date TBD'} {m.scheduled_time || ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[#94A3B8] mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{m.venue || 'Venue TBD'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                            m.status === 'completed' || m.status === 'walkover'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : m.status === 'in_progress'
                                ? 'bg-amber-500/20 text-amber-300'
                                : m.status === 'cancelled'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {m.status.replace('_', ' ')}
                        </span>
                        {m.winner_name && (
                          <p className="text-xs font-semibold text-emerald-300 mt-1">Winner: {m.winner_name}</p>
                        )}
                        {m.score_summary && <p className="text-xs text-[#94A3B8]">{m.score_summary}</p>}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-[#94A3B8]">
                        {m.coordinator_username ? `@${m.coordinator_username}` : '—'}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right space-x-1 whitespace-nowrap">
                          {m.status === 'scheduled' && m.player2_name !== 'BYE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              title="Mark Match Ongoing / Live"
                              onClick={async () => {
                                const res = await fetch('/api/admin/coordinator', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: m.id, status: 'in_progress' }),
                                });
                                if (res.ok) {
                                  toast.success(`Match #${m.match_number} marked Ongoing`);
                                  await loadAll();
                                } else {
                                  toast.error('Failed to start match');
                                }
                              }}
                              className="h-7 px-2 border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs"
                            >
                              <Radio className="w-3 h-3 mr-1" />
                              Start Live
                            </Button>
                          )}
                          {(m.status === 'completed' || m.status === 'walkover') && (
                            <Button
                              size="sm"
                              variant="outline"
                              title="HOC Force Reopen"
                              onClick={() =>
                                setConfirmAction({
                                  open: true,
                                  title: 'Force reopen finalized match?',
                                  description: `Reset ${m.player1_name} vs ${m.player2_name} back to scheduled? This override is recorded in audit logs.`,
                                  onConfirm: async () => {
                                    const res = await fetch('/api/admin/coordinator', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        id: m.id,
                                        status: 'scheduled',
                                        winnerName: null,
                                        forceOverride: true,
                                        overrideReason: 'HOC reopen override',
                                      }),
                                    });
                                    if (res.ok) {
                                      toast.success('Match reopened');
                                      await loadAll();
                                    } else {
                                      toast.error('Override failed');
                                    }
                                  },
                                })
                              }
                              className="h-7 px-2 border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs"
                            >
                              <ShieldAlert className="w-3 h-3 mr-1" />
                              Reopen
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Force Unmatch / Delete"
                            onClick={() =>
                              setConfirmAction({
                                open: true,
                                title: 'Force unmatch & delete fixture?',
                                description: `Remove ${m.player1_name} vs ${m.player2_name} from ${m.game_name}?`,
                                onConfirm: async () => {
                                  const res = await fetch(`/api/admin/coordinator?id=${encodeURIComponent(m.id)}`, {
                                    method: 'DELETE',
                                  });
                                  if (res.ok) {
                                    toast.success('Match deleted');
                                    await loadAll();
                                  } else {
                                    const d = await res.json();
                                    toast.error(d.error || 'Delete failed');
                                  }
                                },
                              })
                            }
                            className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/15"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {confirmAction && (
        <ConfirmDialog
          open={confirmAction.open}
          title={confirmAction.title}
          description={confirmAction.description}
          destructive
          loading={confirmBusy}
          onCancel={() => setConfirmAction(null)}
          onConfirm={async () => {
            setConfirmBusy(true);
            try {
              await confirmAction.onConfirm();
              setConfirmAction(null);
            } finally {
              setConfirmBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}
