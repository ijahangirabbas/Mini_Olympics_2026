import crypto from 'crypto';

function hashToUint32(seedStr: string): number {
  const digest = crypto.createHash('sha256').update(seedStr).digest();
  return digest.readUInt32BE(0);
}

/** Deterministic Mulberry32 PRNG */
export function createSeededRng(seedStr: string): () => number {
  let state = hashToUint32(seedStr) || 1;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic Fisher-Yates shuffle */
export function seededShuffle<T>(items: T[], seedStr: string): T[] {
  const arr = [...items];
  const rand = createSeededRng(seedStr);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export type BracketTeamInput = {
  id?: string | null;
  teamName: string;
  rollNumber?: string | null;
  contactNumber?: string | null;
  email?: string | null;
};

export type GeneratedMatchSlot = {
  matchNumber: number;
  round: string;
  player1: BracketTeamInput;
  player2: BracketTeamInput | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  venue: string | null;
  isBye: boolean;
  pairReason: string;
};

function addMinutesToTime(baseDate: string | null, startTime: string | null, offsetMinutes: number, durationMinutes: number) {
  if (!startTime) {
    return { timeLabel: null, startIso: null, endIso: null };
  }
  const [hhStr, mmStr] = startTime.split(':');
  const baseHours = Number(hhStr) || 9;
  const baseMins = Number(mmStr) || 0;
  const totalStart = baseHours * 60 + baseMins + offsetMinutes;
  const h = Math.floor(totalStart / 60) % 24;
  const m = totalStart % 60;
  const timeLabel = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  if (!baseDate) {
    return { timeLabel, startIso: null, endIso: null };
  }
  const startDt = new Date(`${baseDate}T${timeLabel}:00`);
  if (Number.isNaN(startDt.getTime())) {
    return { timeLabel, startIso: null, endIso: null };
  }
  const endDt = new Date(startDt.getTime() + durationMinutes * 60_000);
  return {
    timeLabel,
    startIso: startDt.toISOString(),
    endIso: endDt.toISOString(),
  };
}

export function generateDeterministicSchedule(params: {
  gameName: string;
  gender: string;
  teams: BracketTeamInput[];
  format: 'knockout' | 'round_robin' | 'group_stage';
  matchDate?: string | null;
  startTime?: string | null;
  venue?: string | null;
  breakMinutes?: number;
  matchDurationMinutes?: number;
  seed?: string;
}) {
  const {
    gameName,
    gender,
    teams,
    format,
    matchDate = null,
    startTime = null,
    venue = null,
    breakMinutes = 10,
    matchDurationMinutes = 30,
    seed = `${gameName}:${gender}:${format}:${teams.length}`,
  } = params;

  const shuffled = seededShuffle(teams, seed);
  const slotStep = Math.max(5, matchDurationMinutes + breakMinutes);
  const rounds: Array<{ round: string; matches: any[] }> = [];
  const flatMatches: GeneratedMatchSlot[] = [];

  let matchCounter = 1;

  if (format === 'round_robin') {
    const list: Array<BracketTeamInput | null> = [...shuffled];
    if (list.length % 2 === 1) list.push(null); // BYE
    const n = list.length;
    const numRounds = n - 1;
    const half = n / 2;

    for (let r = 0; r < numRounds; r++) {
      const roundName = `Round ${r + 1}`;
      const roundMatches: any[] = [];
      for (let i = 0; i < half; i++) {
        const p1 = list[i];
        const p2 = list[n - 1 - i];
        if (!p1 || !p2) continue;
        const slot = addMinutesToTime(matchDate, startTime, (matchCounter - 1) * slotStep, matchDurationMinutes);
        const entry: GeneratedMatchSlot = {
          matchNumber: matchCounter,
          round: roundName,
          player1: p1,
          player2: p2,
          scheduledDate: matchDate,
          scheduledTime: slot.timeLabel,
          scheduledStartAt: slot.startIso,
          scheduledEndAt: slot.endIso,
          venue,
          isBye: false,
          pairReason: `Round-robin circle pairing (seed: ${seed}, round ${r + 1})`,
        };
        flatMatches.push(entry);
        roundMatches.push({
          matchNumber: matchCounter,
          team1: p1.teamName,
          team2: p2.teamName,
          time: slot.timeLabel || 'TBD',
          venue: venue || 'Main Arena',
          date: matchDate || undefined,
        });
        matchCounter++;
      }
      rounds.push({ round: roundName, matches: roundMatches });
      // Rotate keeping list[0] fixed
      const last = list.pop()!;
      list.splice(1, 0, last);
    }
  } else if (format === 'group_stage') {
    const groupSize = 4;
    const numGroups = Math.max(1, Math.ceil(shuffled.length / groupSize));
    for (let g = 0; g < numGroups; g++) {
      const groupTeams = shuffled.slice(g * groupSize, (g + 1) * groupSize);
      const groupLabel = `Group ${String.fromCharCode(65 + g)}`;
      const groupMatches: any[] = [];
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          const slot = addMinutesToTime(matchDate, startTime, (matchCounter - 1) * slotStep, matchDurationMinutes);
          const entry: GeneratedMatchSlot = {
            matchNumber: matchCounter,
            round: groupLabel,
            player1: groupTeams[i],
            player2: groupTeams[j],
            scheduledDate: matchDate,
            scheduledTime: slot.timeLabel,
            scheduledStartAt: slot.startIso,
            scheduledEndAt: slot.endIso,
            venue,
            isBye: false,
            pairReason: `Group stage ${groupLabel} (seed: ${seed})`,
          };
          flatMatches.push(entry);
          groupMatches.push({
            matchNumber: matchCounter,
            team1: groupTeams[i].teamName,
            team2: groupTeams[j].teamName,
            time: slot.timeLabel || 'TBD',
            venue: venue || 'Main Arena',
            date: matchDate || undefined,
          });
          matchCounter++;
        }
      }
      if (groupMatches.length > 0) {
        rounds.push({ round: groupLabel, matches: groupMatches });
      }
    }
  } else {
    // Single-elimination Knockout Round 1 (+ placeholder subsequent rounds)
    const round1Matches: any[] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      const p1 = shuffled[i];
      const p2 = shuffled[i + 1] || null;
      const slot = addMinutesToTime(matchDate, startTime, (matchCounter - 1) * slotStep, matchDurationMinutes);
      const entry: GeneratedMatchSlot = {
        matchNumber: matchCounter,
        round: 'Round 1',
        player1: p1,
        player2: p2,
        scheduledDate: matchDate,
        scheduledTime: slot.timeLabel,
        scheduledStartAt: slot.startIso,
        scheduledEndAt: slot.endIso,
        venue,
        isBye: !p2,
        pairReason: p2
          ? `Knockout deterministic draw (seed: ${seed})`
          : `Knockout automatic BYE (odd entrant count, seed: ${seed})`,
      };
      flatMatches.push(entry);
      round1Matches.push({
        matchNumber: matchCounter,
        team1: p1.teamName,
        team2: p2 ? p2.teamName : 'BYE',
        time: slot.timeLabel || 'TBD',
        venue: venue || 'Main Arena',
        date: matchDate || undefined,
      });
      matchCounter++;
    }
    rounds.push({ round: 'Round 1', matches: round1Matches });

    let remainingCount = round1Matches.length;
    let roundIdx = 2;
    while (remainingCount > 1) {
      const nextRoundName =
        remainingCount === 2 ? 'Final' : remainingCount <= 4 ? 'Semi-Finals' : `Round ${roundIdx}`;
      const pairs = Math.ceil(remainingCount / 2);
      const nextMatches: any[] = [];
      for (let i = 0; i < pairs; i++) {
        nextMatches.push({
          matchNumber: matchCounter++,
          team1: 'Winner Prev Match',
          team2: i * 2 + 1 < remainingCount ? 'Winner Prev Match' : 'BYE',
          time: 'TBD',
          venue: venue || 'Main Arena',
        });
      }
      rounds.push({ round: nextRoundName, matches: nextMatches });
      remainingCount = nextMatches.length;
      roundIdx++;
    }
  }

  return {
    seed,
    algorithm: 'deterministic_seeded_v1',
    gameName,
    gender,
    format,
    totalTeams: shuffled.length,
    rounds,
    flatMatches,
  };
}
