import type { GamePrice } from './games-pricing';

export type SportCategory = 
  | 'team' 
  | 'indoor' 
  | 'track' 
  | 'fun' 
  | 'esports';

export interface GameInfo {
  id: string;
  name: string;
  category: SportCategory;
  categoryLabel: string;
  headline: string;
  tagline: string;
  division: 'boys_and_girls' | 'boys_only' | 'girls_only';
  playerFormat: string;
  matchFormat: string;
  boysPlayers?: number;
  girlsPlayers?: number;
  boysFee?: number;
  girlsFee?: number;
  isTeam: boolean;
  featured?: boolean;
  featuredLayout?: 'hero' | 'tall' | 'wide' | 'standard';
  rulesOverview: string;
  venueNote: string;
  accentColor: string;
  iconKey: string;
  image: string;
}

export const CATEGORIES: { id: SportCategory; label: string; count: number; description: string }[] = [
  { id: 'team', label: 'Team Sports', count: 10, description: 'Big matches & squad events across the main campus arenas.' },
  { id: 'indoor', label: 'Indoor & Table Games', count: 12, description: 'Singles & doubles precision clashes across badminton, table tennis, carrom, ludo, foosball & darts.' },
  { id: 'track', label: 'Track & Field', count: 9, description: 'Athletics events, sprint velocity, endurance tests, laser run & campus challenges.' },
  { id: 'fun', label: 'Fun Games', count: 11, description: 'Target shooting, arm wrestling, strategy boards, and high-energy campus challenges.' },
  { id: 'esports', label: 'Esports Arena', count: 7, description: 'Indoor, console & PC competitive battles in FIFA, Tekken, COD, PUBG & arcade speedruns.' },
];

export const GAMES_DATA: GameInfo[] = [
  // --- TEAM SPORTS (10) ---
  {
    id: 'cricket',
    name: 'Tape Ball Cricket',
    category: 'team',
    categoryLabel: 'Team Sports',
    headline: 'THE FLOODLIT DERBY',
    tagline: 'The flagship campus tournament. High-octane tape ball action under floodlights with official umpires and packed sidelines.',
    division: 'boys_and_girls',
    playerFormat: '♂ 8 Players | ♀ 5 Players',
    matchFormat: '6-OVERS T10 KNOCKOUT',
    boysPlayers: 8,
    girlsPlayers: 5,
    boysFee: 1600,
    girlsFee: 1200,
    isTeam: true,
    featured: true,
    featuredLayout: 'hero',
    rulesOverview: 'Standard 6-over tape ball knockouts. Powerplay rules in overs 1-2. Boundary boundaries and official arbiters strictly regulate play.',
    venueNote: 'Main Campus Cricket Ground',
    accentColor: '#F59E0B',
    iconKey: 'cricket',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'football',
    name: 'Football Championship',
    category: 'team',
    categoryLabel: 'Team Sports',
    headline: 'THE TURF WAR',
    tagline: 'Tactical passing, high-pressing counters, and clinical finishing on the floodlit synthetic turf arena.',
    division: 'boys_and_girls',
    playerFormat: '♂ 11 Players | ♀ 6 Players',
    matchFormat: '2x15 MIN HALVES',
    boysPlayers: 11,
    girlsPlayers: 6,
    boysFee: 2200,
    girlsFee: 1200,
    isTeam: true,
    featured: true,
    featuredLayout: 'tall',
    rulesOverview: 'Knockout format with 15-minute halves. Tied matches proceed directly to a best-of-5 penalty shootout.',
    venueNote: 'FCIT Sports Complex Field',
    accentColor: '#12E2C4',
    iconKey: 'football',
    image: '/images/games/football.avif',
  },
  {
    id: 'kabaddi',
    name: 'Kabaddi Championship',
    category: 'team',
    categoryLabel: 'Team Sports',
    headline: 'RAW TENDON & POWER',
    tagline: 'Raw power, synchronized defensive chains, and breath-holding raids in the traditional clay court circle.',
    division: 'boys_and_girls',
    playerFormat: '♂ 7 Players | ♀ 7 Players',
    matchFormat: '30-SEC RAID TIMER',
    boysPlayers: 7,
    girlsPlayers: 7,
    boysFee: 500,
    girlsFee: 500,
    isTeam: true,
    featured: true,
    featuredLayout: 'wide',
    rulesOverview: 'Standard Circle and Standard rules with super-tackles active. 30-second raid clock monitored by arbiters.',
    venueNote: 'Central Clay Court Arena',
    accentColor: '#FF6B00',
    iconKey: 'kabaddi',
    image: '/images/games/kabaddi.avif',
  },
  {
    id: 'handball',
    name: 'Handball Clash',
    category: 'team',
    categoryLabel: 'Team Sports',
    headline: 'AERIAL TRANSITIONS',
    tagline: 'Continuous fast transitions, wing cuts, and high-velocity jump shots outside the 6-meter crease.',
    division: 'boys_and_girls',
    playerFormat: '♂ 6 Players | ♀ 6 Players',
    matchFormat: '2x12 MIN HALVES',
    boysPlayers: 6,
    girlsPlayers: 6,
    boysFee: 1200,
    girlsFee: 1200,
    isTeam: true,
    rulesOverview: 'Standard court dimensions with 6m goal crease. Rolling substitutions permitted at stoppage.',
    venueNote: 'Outdoor Multi-Purpose Court',
    accentColor: '#3B82F6',
    iconKey: 'handball',
    image: 'https://images.unsplash.com/photo-1553627220-92f0446b6a5f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'volleyball',
    name: 'Volleyball Spike',
    category: 'team',
    categoryLabel: 'Team Sports',
    headline: 'ABOVE THE NET',
    tagline: 'High-flying spikes, quick middle sets, and relentless defensive digs at the collegiate net.',
    division: 'boys_and_girls',
    playerFormat: '♂ 6 Players | ♀ 6 Players',
    matchFormat: 'BEST OF 3 SETS',
    boysPlayers: 6,
    girlsPlayers: 6,
    boysFee: 1200,
    girlsFee: 1200,
    isTeam: true,
    rulesOverview: 'Best of 3 sets to 21 points with rally scoring. Official FIVB regulation net height.',
    venueNote: 'Volleyball Court #1',
    accentColor: '#FFE600',
    iconKey: 'volleyball',
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'frisbee',
    name: 'Ultimate Frisbee',
    category: 'team',
    categoryLabel: 'Team Sports',
    headline: 'END-ZONE PRECISION',
    tagline: 'End-to-end aerial strategy, layout catches, and high-speed disc turnover play.',
    division: 'boys_and_girls',
    playerFormat: 'Individual / Squad Entry',
    matchFormat: 'FIRST TO 11 GOALS',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 250,
    girlsFee: 250,
    isTeam: false,
    rulesOverview: 'End zone scoring format. Non-contact self-officiated with tournament field marshals.',
    venueNote: 'North Lawn Arena',
    accentColor: '#38EF7D',
    iconKey: 'frisbee',
    image: 'https://images.unsplash.com/photo-1686605972972-d7b17f7ebc7a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'pitho-gol-garam',
    name: 'Pitho Gol Garam',
    category: 'team',
    categoryLabel: 'Team Sports',
    headline: 'THE 7-STONE SHOWDOWN',
    tagline: 'The timeless street classic elevated to championship status with 7 stone stacks and rapid dodges.',
    division: 'boys_only',
    playerFormat: '6 Players per Team',
    matchFormat: '3 ROUND INNINGS',
    boysPlayers: 6,
    boysFee: 1000,
    isTeam: true,
    rulesOverview: 'Break the pyramid, evade the ball, and reconstruct the stack before full team elimination.',
    venueNote: 'Courtyard Zone B',
    accentColor: '#FF2A6D',
    iconKey: 'target',
    image: '/images/games/pitho-gol-garam.avif',
  },
  {
    id: 'tug-of-war',
    name: 'Tug of War',
    category: 'team',
    categoryLabel: 'Team Sports',
    headline: 'THE ANCHOR BATTLE',
    tagline: 'Pure collective grit, team synchronized pulling, and unyielding campus dominance.',
    division: 'boys_and_girls',
    playerFormat: '♂ 8 Players | ♀ 8 Players',
    matchFormat: 'BEST OF 3 PULLS',
    boysPlayers: 8,
    girlsPlayers: 8,
    boysFee: 600,
    girlsFee: 600,
    isTeam: true,
    featured: true,
    featuredLayout: 'wide',
    rulesOverview: 'Best of 3 pulls across the 4-meter marker tape. Cleats prohibited for safety.',
    venueNote: 'Central Arena Turf',
    accentColor: '#F59E0B',
    iconKey: 'tug-of-war',
    image: '/images/games/tug-of-war.avif',
  },
  {
    id: 'double-wicket',
    name: 'Double Wicket Cricket',
    category: 'team',
    categoryLabel: 'Team Sports',
    headline: 'DUO CRICKET PRESSURE',
    tagline: 'Duo cricket pressure. 2 overs, 2 batsmen, maximum explosive stroke-play.',
    division: 'boys_only',
    playerFormat: '2 Players (Duo)',
    matchFormat: '2 OVERS PER SQUAD',
    boysPlayers: 2,
    boysFee: 500,
    isTeam: true,
    rulesOverview: 'Each pair bats for 2 overs. Dismissals deduct runs from the final score tally.',
    venueNote: 'Center Pitch Cage',
    accentColor: '#05FFA1',
    iconKey: 'cricket',
    image: 'https://images.unsplash.com/photo-1674986778924-7a33c1531443?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'basketball-team',
    name: 'Basketball Team',
    category: 'team',
    categoryLabel: 'Team Sports',
    headline: 'FULL-COURT HOOPS',
    tagline: 'Full-court squad basketball. Fast breaks, perimeter shooting, and rim protection.',
    division: 'boys_and_girls',
    playerFormat: '♂ 7 Players | ♀ 7 Players',
    matchFormat: '4x8 MIN QUARTERS',
    boysPlayers: 7,
    girlsPlayers: 7,
    boysFee: 2200,
    girlsFee: 2200,
    isTeam: true,
    rulesOverview: '7-player squad roster (5 on court + 2 subs). Standard FIBA half/full court rules.',
    venueNote: 'Main Basketball Court',
    accentColor: '#FF8800',
    iconKey: 'basketball',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
  },

  // --- RACKET SPORTS (4) ---
  {
    id: 'badminton-singles',
    name: 'Badminton Singles',
    category: 'indoor',
    categoryLabel: 'Indoor & Table Games',
    headline: 'SHUTTLE FLIGHT',
    tagline: 'Sub-second drops, explosive jump smashes, and total court coverage in the indoor arena.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 vs 1)',
    matchFormat: 'BEST OF 3 SETS',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 200,
    girlsFee: 200,
    isTeam: false,
    featured: true,
    featuredLayout: 'standard',
    rulesOverview: 'Single elimination BWF format. Sets played to 21 rally points.',
    venueNote: 'Indoor Gymnasium Hall 1',
    accentColor: '#9D00FF',
    iconKey: 'shuttlecock',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'badminton-doubles',
    name: 'Badminton Doubles',
    category: 'indoor',
    categoryLabel: 'Indoor & Table Games',
    headline: 'SMASH ROTATION',
    tagline: 'Synchronized tandem court coverage, net intercepts, and aggressive smash rotation.',
    division: 'boys_and_girls',
    playerFormat: 'Doubles (2 Players)',
    matchFormat: 'BWF REGULATION 21',
    boysPlayers: 2,
    girlsPlayers: 2,
    boysFee: 400,
    girlsFee: 400,
    isTeam: true,
    featured: true,
    featuredLayout: 'hero',
    rulesOverview: 'Best of 3 sets to 21. Both teammates must wear matching or sports-approved uniforms.',
    venueNote: 'Indoor Gymnasium Hall 2',
    accentColor: '#B026FF',
    iconKey: 'shuttlecock',
    image: 'https://images.unsplash.com/photo-1626721105368-a69248e93b32?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'table-tennis-singles',
    name: 'Table Tennis Singles',
    category: 'indoor',
    categoryLabel: 'Indoor & Table Games',
    headline: 'HEAVY TOPSPIN',
    tagline: 'Sub-second spins, heavy topspins, and counter-looping showdowns.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 vs 1)',
    matchFormat: '11-POINT KNOCKOUT',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 200,
    girlsFee: 200,
    isTeam: false,
    rulesOverview: '11-point games, alternate two serves each, best of 3 sets knockout format.',
    venueNote: 'Student Lounge TT Arena',
    accentColor: '#FF416C',
    iconKey: 'table-tennis',
    image: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'table-tennis-doubles',
    name: 'Table Tennis Doubles',
    category: 'indoor',
    categoryLabel: 'Indoor & Table Games',
    headline: 'CROSS-COURT REFLEXES',
    tagline: 'Alternate hitting sequences, cross-court placement, and rapid reflex exchanges.',
    division: 'boys_and_girls',
    playerFormat: 'Doubles (2 Players)',
    matchFormat: 'BEST OF 3 SETS',
    boysPlayers: 2,
    girlsPlayers: 2,
    boysFee: 400,
    girlsFee: 400,
    isTeam: true,
    rulesOverview: 'Strict alternate hitting rule applies. Service must cross right-half to right-half.',
    venueNote: 'Student Lounge TT Arena',
    accentColor: '#FF4B2B',
    iconKey: 'table-tennis',
    image: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?auto=format&fit=crop&w=800&q=80',
  },

  // --- BOARD & CARD GAMES (8) ---
  {
    id: 'chess',
    name: 'Championship Chess',
    category: 'fun',
    categoryLabel: 'Fun Games',
    headline: 'THE GRANDMASTER CLASH',
    tagline: '10+0 Blitz & Rapid classical formats under digital clocks. Precision calculation with no room for error.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 vs 1)',
    matchFormat: 'FIDE 10+0 BLITZ',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 200,
    girlsFee: 200,
    isTeam: false,
    featured: true,
    featuredLayout: 'tall',
    rulesOverview: 'FIDE standard blitz rules on digital chess clocks. Touch-move strictly enforced by arbiters.',
    venueNote: 'Library Quiet Hall A',
    accentColor: '#F8FAFC',
    iconKey: 'chess',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'ludo-singles',
    name: 'Ludo Singles',
    category: 'indoor',
    categoryLabel: 'Indoor & Table Games',
    headline: 'TACTICAL DIE ROLLS',
    tagline: 'High-stakes token hunting, dice strategy, and competitive home-runs.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 vs 1)',
    matchFormat: 'FIRST TO PARK 4',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 200,
    girlsFee: 200,
    isTeam: false,
    rulesOverview: 'Four tokens per player. Mandatory cut rule. First player to park 4 tokens wins.',
    venueNote: 'Club Room 1',
    accentColor: '#00C9FF',
    iconKey: 'dice',
    image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ludo-doubles',
    name: 'Ludo Doubles',
    category: 'indoor',
    categoryLabel: 'Indoor & Table Games',
    headline: 'DIAGONAL ALLIANCE',
    tagline: 'Partner collaboration, cross-board shield blocks, and dual victory conditions.',
    division: 'boys_and_girls',
    playerFormat: 'Doubles (2 Players)',
    matchFormat: 'TEAM OF 2 TOKENS',
    boysPlayers: 2,
    girlsPlayers: 2,
    boysFee: 300,
    girlsFee: 300,
    isTeam: true,
    rulesOverview: 'Diagonal partners. Both partners must land all tokens home to secure victory.',
    venueNote: 'Club Room 1',
    accentColor: '#92FE9D',
    iconKey: 'dice',
    image: 'https://images.unsplash.com/photo-1642056448416-b7dd0ed968cc?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'carrom-singles',
    name: 'Carrom Singles',
    category: 'indoor',
    categoryLabel: 'Indoor & Table Games',
    headline: 'THE QUEEN POCKET',
    tagline: 'Powdered surface striker mastery, scissor rebounds, and Queen pocketing.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 vs 1)',
    matchFormat: 'FIRST TO 21 POINTS',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 150,
    girlsFee: 150,
    isTeam: false,
    rulesOverview: 'First to 21 points or 8 boards. Queen cover rule strictly applied.',
    venueNote: 'Recreation Hall B',
    accentColor: '#F39C12',
    iconKey: 'disc',
    image: '/images/games/carrom-singles.avif',
  },
  {
    id: 'carrom-doubles',
    name: 'Carrom Doubles',
    category: 'indoor',
    categoryLabel: 'Indoor & Table Games',
    headline: 'CORNER TACTICS',
    tagline: 'Opposing corner tactics, defensive leaves, and synchronized board clearing.',
    division: 'boys_and_girls',
    playerFormat: 'Doubles (2 Players)',
    matchFormat: '8 BOARDS KNOCKOUT',
    boysPlayers: 2,
    girlsPlayers: 2,
    boysFee: 250,
    girlsFee: 250,
    isTeam: true,
    rulesOverview: 'Partners sit opposite. Clockwise turn order. Official smooth carrom boards used.',
    venueNote: 'Recreation Hall B',
    accentColor: '#E67E22',
    iconKey: 'disc',
    image: '/images/games/carrom-doubles.avif',
  },
  {
    id: 'jenga',
    name: 'Jenga Tower Challenge',
    category: 'fun',
    categoryLabel: 'Fun Games',
    headline: 'STEADY HAND PRESSURE',
    tagline: 'Steady hands, structural physics, and heart-stopping tension block pulls.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 vs 1)',
    matchFormat: 'ONE-HAND SUDDEN DEATH',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 200,
    girlsFee: 200,
    isTeam: false,
    rulesOverview: 'One-hand-only rule. Block must be placed on top level before next turn starts.',
    venueNote: 'Activity Lounge',
    accentColor: '#E74C3C',
    iconKey: 'layers',
    image: 'https://images.unsplash.com/photo-1619261529873-3c4cc299d23d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'uno',
    name: 'Uno Championship',
    category: 'fun',
    categoryLabel: 'Fun Games',
    headline: 'WILD CARD WARFARE',
    tagline: 'Wild cards, Draw-fours, color shifts, and card-shedding campus warfare.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 Player)',
    matchFormat: 'STACKING DRAW RULES',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 200,
    girlsFee: 200,
    isTeam: false,
    rulesOverview: 'Standard Mattel tournament deck rules. Stacking Draw-twos permitted.',
    venueNote: 'Activity Lounge',
    accentColor: '#FF0055',
    iconKey: 'cards',
    image: '/images/games/uno.avif',
  },
  {
    id: 'pucket',
    name: 'Pucket Fast-Track',
    category: 'fun',
    categoryLabel: 'Fun Games',
    headline: 'ELASTIC SLING SPEED',
    tagline: 'Fast-paced wooden puck slinging through the narrow center gate.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 vs 1)',
    matchFormat: 'BEST OF 5 ROUNDS',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 200,
    girlsFee: 200,
    isTeam: false,
    rulesOverview: 'Clear all pucks from your half of the board using the elastic band launcher.',
    venueNote: 'Activity Lounge',
    accentColor: '#00F5D4',
    iconKey: 'disc',
    image: '/images/games/pucket.avif',
  },

  // --- RACES & RELAY (4) ---
  {
    id: '100m-race',
    name: '100m Sprint Dash',
    category: 'track',
    categoryLabel: 'Track & Field',
    headline: 'FASTEST MAN ON CAMPUS',
    tagline: 'Laser-timed sprint showdown on the Olympic straight track for the championship title.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 Runner)',
    matchFormat: 'LASER TIMED HEATS',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 200,
    girlsFee: 200,
    isTeam: false,
    featured: true,
    featuredLayout: 'tall',
    rulesOverview: 'Laser-timed heats on standard running track. False start results in immediate disqualification.',
    venueNote: 'Olympic Track Straight',
    accentColor: '#12E2C4',
    iconKey: 'running',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: '3-leg-race',
    name: '3 Legged Race',
    category: 'track',
    categoryLabel: 'Track & Field',
    headline: 'BOUND SYNERGY',
    tagline: 'Synchronized running duos bound at the ankle. Coordination is everything.',
    division: 'boys_and_girls',
    playerFormat: 'Duo (2 Runners)',
    matchFormat: '50M TETHERED SPRINT',
    boysPlayers: 2,
    girlsPlayers: 2,
    boysFee: 200,
    girlsFee: 200,
    isTeam: true,
    rulesOverview: '50-meter sprint with center ankles securely tethered. Falling requires getting up without untethering.',
    venueNote: 'Main Grass Oval',
    accentColor: '#FFB800',
    iconKey: 'running',
    image: 'https://images.unsplash.com/photo-1758586326118-01c566d308ca?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'relay-race',
    name: '4x100m Baton Relay',
    category: 'track',
    categoryLabel: 'Track & Field',
    headline: 'THE ANCHOR LEG',
    tagline: 'Precision baton transfers, anchor leg heroics, and department bragging rights.',
    division: 'boys_and_girls',
    playerFormat: 'Team of 4 Runners',
    matchFormat: '4x100M OLYMPIC OVAL',
    boysPlayers: 4,
    girlsPlayers: 4,
    boysFee: 200,
    girlsFee: 200,
    isTeam: true,
    rulesOverview: '4x100m circuit. Baton must be passed strictly within the 20-meter changeover box.',
    venueNote: 'Olympic 400m Track',
    accentColor: '#FF3366',
    iconKey: 'running',
    image: '/images/games/relay-race.avif',
  },
  {
    id: 'egg-relay-race',
    name: 'Egg & Spoon Relay',
    category: 'track',
    categoryLabel: 'Track & Field',
    headline: 'CALM UNDER PACE',
    tagline: 'Speed balanced with extreme calm. Drop the egg and you restart the leg.',
    division: 'boys_and_girls',
    playerFormat: 'Duo (2 Runners)',
    matchFormat: 'NO-THUMB RESTRICTION',
    boysPlayers: 2,
    girlsPlayers: 2,
    boysFee: 150,
    girlsFee: 150,
    isTeam: true,
    rulesOverview: 'Runners must balance the egg on the wooden spoon held in hand (no thumb touching).',
    venueNote: 'Central Walkway',
    accentColor: '#F7B731',
    iconKey: 'egg',
    image: 'https://images.unsplash.com/photo-1529570634977-ec042420117b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'laser-run',
    name: 'Laser Run',
    category: 'track',
    categoryLabel: 'Track & Field',
    headline: 'RUN & PRECISION TARGET',
    tagline: 'Sprint bursts combined with laser-target accuracy in an Olympic modern pentathlon format.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 Athlete)',
    matchFormat: 'TIMED LASER HEATS',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 300,
    girlsFee: 300,
    isTeam: false,
    rulesOverview: 'Alternating sprint laps and rapid laser-target hits. Fastest total time wins.',
    venueNote: 'Track & Target Range',
    accentColor: '#12E2C4',
    iconKey: 'crosshair',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'scavenger-hunt',
    name: 'Scavenger Hunt',
    category: 'track',
    categoryLabel: 'Track & Field',
    headline: 'CAMPUS CLUE CHASE',
    tagline: 'High-speed campus clue decoding, checkpoint dashes, and race against the clock.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 Runner)',
    matchFormat: 'CHECKPOINT TIME TRIAL',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 400,
    girlsFee: 400,
    isTeam: false,
    rulesOverview: 'Solve sequential campus riddles and reach all marshaled checkpoints in the shortest time.',
    venueNote: 'PUCIT Old Campus Grounds',
    accentColor: '#F59E0B',
    iconKey: 'target',
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80',
  },

  // --- FUN & SKILL GAMES (17) ---
  {
    id: 'arm-wrestling',
    name: 'Arm Wrestling',
    category: 'fun',
    categoryLabel: 'Fun Games',
    headline: 'THE HOOK & TOP-ROLL',
    tagline: 'Top-roll, hook, and raw tendon strength on the official arm-wrestling table.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 vs 1)',
    matchFormat: 'WEIGHT DIVISION BRACKET',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 200,
    girlsFee: 200,
    isTeam: false,
    rulesOverview: 'Weight classes observed. Referees monitor elbow pad contact and shoulder alignment.',
    venueNote: 'Central Stage Arena',
    accentColor: '#FF5722',
    iconKey: 'bicep',
    image: 'https://images.unsplash.com/photo-1780295788839-cf987c493b4b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'foosball-singles',
    name: 'Foosball Singles',
    category: 'indoor',
    categoryLabel: 'Indoor & Table Games',
    headline: 'ROD SPIN BAN',
    tagline: 'Table soccer lightning shots, bank passes, and wall snipes.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 vs 1)',
    matchFormat: 'FIRST TO 7 GOALS',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 150,
    girlsFee: 150,
    isTeam: false,
    rulesOverview: 'First to 7 goals. No 360-degree rod spinning (spinning is foul).',
    venueNote: 'Game Room 2',
    accentColor: '#26C6DA',
    iconKey: 'football',
    image: '/images/games/foosball-singles.avif',
  },
  {
    id: 'foosball-doubles',
    name: 'Foosball Doubles',
    category: 'indoor',
    categoryLabel: 'Indoor & Table Games',
    headline: 'TANDEM TABLE SOCCER',
    tagline: 'Goalkeeper defense paired with midfield and forward rod passing coordination.',
    division: 'boys_and_girls',
    playerFormat: 'Doubles (2 Players)',
    matchFormat: 'FIRST TO 10 GOALS',
    boysPlayers: 2,
    girlsPlayers: 2,
    boysFee: 300,
    girlsFee: 300,
    isTeam: true,
    rulesOverview: 'First to 10 goals. Team coordination with defense/offense split.',
    venueNote: 'Game Room 2',
    accentColor: '#00ACC1',
    iconKey: 'football',
    image: 'https://images.unsplash.com/photo-1786025054505-abee8b30bb51?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'darts-singles',
    name: 'Darts Singles (501)',
    category: 'indoor',
    categoryLabel: 'Indoor & Table Games',
    headline: 'DOUBLE-OUT CLUTCH',
    tagline: 'Bullseye accuracy, triple-20 bed groupings, and clinical double checkouts.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 vs 1)',
    matchFormat: '501 DOUBLE-OUT',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 150,
    girlsFee: 150,
    isTeam: false,
    rulesOverview: 'Standard 501 game with double-out checkout rule. Steel tip darts provided.',
    venueNote: 'Indoor Lounge Zone C',
    accentColor: '#E91E63',
    iconKey: 'target',
    image: 'https://images.unsplash.com/photo-1517127766989-c19048cd61e1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'darts-doubles',
    name: 'Darts Doubles',
    category: 'indoor',
    categoryLabel: 'Indoor & Table Games',
    headline: 'DUAL BOARD ACCURACY',
    tagline: 'Alternate leg throwing with partner strategy on the tournament bristle board.',
    division: 'boys_and_girls',
    playerFormat: 'Doubles (2 Players)',
    matchFormat: 'ALTERNATE THROW 501',
    boysPlayers: 2,
    girlsPlayers: 2,
    boysFee: 300,
    girlsFee: 300,
    isTeam: true,
    rulesOverview: 'Alternate throw format. Highest cumulative checkout takes the frame.',
    venueNote: 'Indoor Lounge Zone C',
    accentColor: '#D81B60',
    iconKey: 'target',
    image: '/images/games/darts-doubles.avif',
  },
  {
    id: '1v1-penalty',
    name: '1v1 Penalty Shootout',
    category: 'track',
    categoryLabel: 'Track & Field',
    headline: 'FROM 12 YARDS',
    tagline: 'Striker versus Goalkeeper psychological duel from 12 yards out.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (Striker vs GK)',
    matchFormat: 'BEST OF 5 KICKS',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 200,
    girlsFee: 200,
    isTeam: false,
    rulesOverview: 'Best of 5 penalties. Sudden death kicks if tied after 5 rounds.',
    venueNote: 'Penalty Box Arena',
    accentColor: '#4CAF50',
    iconKey: 'football',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'archery',
    name: 'Archery Target Shoot',
    category: 'fun',
    categoryLabel: 'Fun Games',
    headline: 'THE GOLD BULLSEYE',
    tagline: 'Recurve bow precision, wind compensation, and concentric gold target rings.',
    division: 'boys_only',
    playerFormat: 'Solo (1 Archer)',
    matchFormat: '6 ARROWS @ 18M',
    boysPlayers: 1,
    boysFee: 200,
    isTeam: false,
    rulesOverview: '3 practice arrows followed by 6 scoring arrows from 18 meters distance.',
    venueNote: 'Archery Range South',
    accentColor: '#795548',
    iconKey: 'bow',
    image: 'https://images.unsplash.com/photo-1741790053537-c34a2e90ed40?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'rifle-shooting',
    name: 'Air Rifle Target Shooting',
    category: 'fun',
    categoryLabel: 'Fun Games',
    headline: '10-METER PRECISION',
    tagline: 'Breathing control, trigger squeeeze, and 10-meter precision paper targets.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 Shooter)',
    matchFormat: '5 SCORING SHOTS',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 150,
    girlsFee: 150,
    isTeam: false,
    rulesOverview: '.177 caliber air rifle. Bench rest position. 5 shots evaluated by electronic target scan.',
    venueNote: 'Firing Range Zone',
    accentColor: '#607D8B',
    iconKey: 'crosshair',
    image: 'https://images.unsplash.com/photo-1700774607140-37bd97c94d80?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'gol-gappay-eating',
    name: 'Gol Gappay Challenge',
    category: 'fun',
    categoryLabel: 'Fun Games',
    headline: '3-MINUTE FEAST',
    tagline: 'The ultimate culinary speed test. Down the most spicy gol gappay in 3 minutes.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 Competitor)',
    matchFormat: '3-MIN TIMER',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 300,
    girlsFee: 300,
    isTeam: false,
    featured: true,
    featuredLayout: 'standard',
    rulesOverview: '3-minute timer. Full consumption verification by judges before count increments.',
    venueNote: 'Student Cafeteria Stage',
    accentColor: '#FF6F00',
    iconKey: 'flame',
    image: 'https://images.unsplash.com/photo-1653850280260-aa3b9e00b230?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'plank',
    name: 'Plank Endurance Test',
    category: 'track',
    categoryLabel: 'Track & Field',
    headline: 'CORE STEEL',
    tagline: 'Core stamina, isometric strength, and mental fortitude against the clock.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 Athlete)',
    matchFormat: 'CONTINUOUS TIME',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 150,
    girlsFee: 150,
    isTeam: false,
    rulesOverview: 'Forearm plank posture. Judge issues one warning for hip drop before timer stoppage.',
    venueNote: 'Fitness Center Mat',
    accentColor: '#8D6E63',
    iconKey: 'stopwatch',
    image: 'https://images.unsplash.com/photo-1765302741884-e846c7a178df?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'rope-jump',
    name: 'Rope Jump Sprint',
    category: 'track',
    categoryLabel: 'Track & Field',
    headline: '60-SECOND CADENCE',
    tagline: 'Maximum speed rope revolutions in 60 seconds with double-under bonuses.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 Athlete)',
    matchFormat: '60S REVOLUTION COUNT',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 200,
    girlsFee: 200,
    isTeam: false,
    rulesOverview: '60 seconds continuous skipping. Digital counter sensor rope provided.',
    venueNote: 'Fitness Center Mat',
    accentColor: '#CDDC39',
    iconKey: 'activity',
    image: 'https://images.unsplash.com/photo-1758875568447-aa45a5d3b351?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'rubiks-cube',
    name: 'Rubik\'s Speedcubing',
    category: 'fun',
    categoryLabel: 'Fun Games',
    headline: 'SUB-15 ALGORITHMS',
    tagline: '3x3x3 algorithm execution, fingertricks, and sub-15 second solutions.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 Speedcuber)',
    matchFormat: 'WCA STACKMAT TIMER',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 200,
    girlsFee: 200,
    isTeam: false,
    rulesOverview: 'WCA regulation scrambles with 15-second inspection timer on Stackmat timers.',
    venueNote: 'Tech Lounge',
    accentColor: '#3F51B5',
    iconKey: 'cube',
    image: 'https://images.unsplash.com/photo-1591991731833-b4807cf7ef94?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'thula',
    name: 'Thula Traditional',
    category: 'fun',
    categoryLabel: 'Fun Games',
    headline: 'HERITAGE SKILL',
    tagline: 'Traditional campus skill contest tested across generations of PUCIT students.',
    division: 'boys_only',
    playerFormat: 'Solo (1 Competitor)',
    matchFormat: 'HERITAGE RULES',
    boysPlayers: 1,
    boysFee: 150,
    isTeam: false,
    rulesOverview: 'Traditional rules administered by society senior arbiters.',
    venueNote: 'Courtyard Zone A',
    accentColor: '#9E9E9E',
    iconKey: 'shield',
    image: 'https://images.unsplash.com/photo-1543956228-f38027e0c61f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'squid-game',
    name: 'Red Light Green Light',
    category: 'fun',
    categoryLabel: 'Fun Games',
    headline: 'ZERO MOTION SENSOR',
    tagline: 'Sensory reflex obstacle course inspired by viral competitive survival games.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 Competitor)',
    matchFormat: 'ELIMINATION COURSE',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 200,
    girlsFee: 200,
    isTeam: false,
    rulesOverview: 'Freeze on red light audio signal. Motion sensors trigger instantaneous elimination.',
    venueNote: 'Indoor Sports Arena',
    accentColor: '#E91E63',
    iconKey: 'target',
    image: 'https://images.unsplash.com/photo-1607468103349-00fafe69117c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'subway-surfers',
    name: 'Subway Surfers High Score',
    category: 'esports',
    categoryLabel: 'Esports Arena',
    headline: 'INFINITE RUN MULTIPLIER',
    tagline: 'Single run infinite runner arcade challenge for the highest multiplier score.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 Player)',
    matchFormat: 'SINGLE RUN SCORE',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 150,
    girlsFee: 150,
    isTeam: false,
    rulesOverview: 'Official tournament iPad. Default coin multiplier. Single life per entry.',
    venueNote: 'Gaming Zone Desk',
    accentColor: '#00BCD4',
    iconKey: 'gamepad',
    image: '/images/games/subway-surfers.avif',
  },
  {
    id: 'blur-racing',
    name: 'Blur PC Racing',
    category: 'esports',
    categoryLabel: 'Esports Arena',
    headline: 'POWER-UP DRIFTING',
    tagline: 'Power-up tactical racing, bolt shots, shields, and high-speed drifting.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 Racer)',
    matchFormat: '8-PLAYER LAN LOBBY',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 150,
    girlsFee: 150,
    isTeam: false,
    rulesOverview: '8-player LAN lobby. 3 races on preset tracks. Points totaled for podium positions.',
    venueNote: 'Computer Lab 3 LAN Arena',
    accentColor: '#FF1744',
    iconKey: 'racing',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'piano-tiles',
    name: 'Piano Tiles Reflex Test',
    category: 'esports',
    categoryLabel: 'Esports Arena',
    headline: 'MAX BPM TAPS',
    tagline: 'Insane BPM tile taps without hitting black or missing a beat.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 Player)',
    matchFormat: 'MASTER TEMPO RUN',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 150,
    girlsFee: 150,
    isTeam: false,
    rulesOverview: 'Song played at Master speed setting. Highest tile count logged on official tablet.',
    venueNote: 'Gaming Zone Desk',
    accentColor: '#212121',
    iconKey: 'music',
    image: '/images/games/piano-tiles.avif',
  },

  // --- ESPORTS (4) ---
  {
    id: 'fifa',
    name: 'EA Sports FC / FIFA 24',
    category: 'esports',
    categoryLabel: 'Esports Arena',
    headline: 'THE PS5 FOOTBALL DERBY',
    tagline: 'PlayStation 5 console soccer under stage floodlights. Tactical setups and clutch 90th minute winners.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 vs 1)',
    matchFormat: '6-MIN HALVES • TACTICAL',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 300,
    girlsFee: 300,
    isTeam: false,
    featured: true,
    featuredLayout: 'hero',
    rulesOverview: 'PS5 console. 6-minute halves, Tactical Defending, Club teams only (no Soccer Aid/Custom squads). Extra time + penalties in knockout.',
    venueNote: 'Esports Center Stage (PS5 Lounge)',
    accentColor: '#10B981',
    iconKey: 'gamepad',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'tekken',
    name: 'Tekken 8 Tournament',
    category: 'esports',
    categoryLabel: 'Esports Arena',
    headline: 'IRON FIST ARENA',
    tagline: 'Heat system combos, frame-data punishes, electric wind godfists, and stage breaks on the tournament fightsticks.',
    division: 'boys_and_girls',
    playerFormat: 'Solo (1 vs 1)',
    matchFormat: 'DOUBLE ELIMINATION BO3',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 300,
    girlsFee: 300,
    isTeam: false,
    featured: true,
    featuredLayout: 'tall',
    rulesOverview: 'Double Elimination bracket. Best of 3 games (3 rounds per game). Top 8 and Finals Best of 5. Default stage selection rules.',
    venueNote: 'Esports Center Stage (PS5 Lounge)',
    accentColor: '#EF4444',
    iconKey: 'combat',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'cod-mobile',
    name: 'Call of Duty: Mobile',
    category: 'esports',
    categoryLabel: 'Esports Arena',
    headline: 'SEARCH & DESTROY',
    tagline: 'Multiplayer Search & Destroy tactical gunplay on competitive tournament rule-sets.',
    division: 'boys_and_girls',
    playerFormat: 'Solo & Squad Formats',
    matchFormat: 'S&D FIRST TO 7',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 150,
    girlsFee: 150,
    isTeam: false,
    rulesOverview: 'S&D first to 7 rounds. Banned operator skills and scorestreaks per competitive COD rules.',
    venueNote: 'Esports Mobile Stage',
    accentColor: '#F59E0B',
    iconKey: 'crosshair',
    image: 'https://images.unsplash.com/photo-1564049489314-60d154ff107d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'pubg-mobile',
    name: 'PUBG Mobile Championship',
    category: 'esports',
    categoryLabel: 'Esports Arena',
    headline: 'SURVIVAL ERANGEL',
    tagline: 'Erangel survival, zone rotations, sniper duels, and the coveted Chicken Dinner.',
    division: 'boys_and_girls',
    playerFormat: 'Squad / Solo Battle Royale',
    matchFormat: 'CUSTOM ROOM POINT TABLE',
    boysPlayers: 1,
    girlsPlayers: 1,
    boysFee: 150,
    girlsFee: 150,
    isTeam: false,
    featured: true,
    featuredLayout: 'wide',
    rulesOverview: 'Custom room matches across Erangel and Miramar. Points calculated from Placement + Kills.',
    venueNote: 'Esports Mobile Stage',
    accentColor: '#EAB308',
    iconKey: 'crosshair',
    image: 'https://images.unsplash.com/photo-1685578437686-a3240b85aaee?auto=format&fit=crop&w=1000&q=80',
  },
];


export const CATEGORY_LABELS: Record<SportCategory, string> = {
  team: 'Team Sports',
  indoor: 'Indoor & Table Games',
  track: 'Track & Field',
  fun: 'Fun Games',
  esports: 'Esports Arena',
};

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeCategory(cat: string | undefined | null, fallbackName: string): SportCategory {
  const lowerName = fallbackName.toLowerCase();
  const catLower = (cat ?? '').trim().toLowerCase();

  // Direct match to the 5 official PDF category slugs or labels
  if (catLower === 'team' || catLower === 'team sports') return 'team';
  if (catLower === 'indoor' || catLower === 'indoor & table games' || catLower === 'racket' || catLower === 'racket sports') return 'indoor';
  if (catLower === 'track' || catLower === 'track & field' || catLower === 'race' || catLower === 'races & relays' || catLower === 'races & track') return 'track';
  if (catLower === 'fun' || catLower === 'fun games' || catLower === 'fun & strength') return 'fun';
  if (catLower === 'esports' || catLower === 'esports arena' || catLower === 'e-sports arena') return 'esports';

  // Game-name mapping (also handles legacy 'board' and 'skill' DB rows cleanly)
  if (/(fifa|tekken|cod|call of duty|pubg|blur|subway surfer|piano tiles|esport)/.test(lowerName)) return 'esports';
  if (/(badminton|table tennis|carrom|ludo|foosball|dart)/.test(lowerName)) return 'indoor';
  if (/(100m|relay|3 leg|sprint dash|rope jump|plank|laser run|scavenger|penalty)/.test(lowerName)) return 'track';
  if (/(cricket|football|kabaddi|kabbadi|handball|volley|frisbee|pitho|tug of war|double wicket|basketball)/.test(lowerName)) return 'team';
  if (/(chess|uno|jenga|pucket|rifle|arm wrestling|squid|red light|gol gappay|rubik|archery|thula)/.test(lowerName)) return 'fun';

  if (catLower === 'board' || catLower === 'board & card' || catLower === 'board & strategy') return 'fun';
  return 'fun';
}

function buildPlayerFormat(boysPlayers?: number, girlsPlayers?: number): string {
  const b = boysPlayers ?? 1;
  const g = girlsPlayers ?? 1;
  if (b <= 1 && g <= 1) return 'Solo (1 Player)';
  if (b === 2 && g === 2) return 'Doubles (2 Players)';
  if (boysPlayers && girlsPlayers && boysPlayers !== girlsPlayers) {
    return `♂ ${boysPlayers} Players | ♀ ${girlsPlayers} Players`;
  }
  if (boysPlayers && !girlsPlayers) return `${boysPlayers} Players per Team`;
  if (girlsPlayers && !boysPlayers) return `${girlsPlayers} Players per Team`;
  return `${Math.max(b, g)} Players per Team`;
}

function findCatalogMatch(dbName: string): GameInfo | undefined {
  const normalized = dbName.trim().toLowerCase();
  const slug = slugify(dbName);
  const direct = GAMES_DATA.find((g) => g.name.toLowerCase() === normalized || g.id === slug);
  if (direct) return direct;

  const reverseAliases: Record<string, string> = {
    'cricket': 'cricket',
    'football': 'football',
    'kabaddi': 'kabaddi',
    'kabbadi': 'kabaddi',
    'handball': 'handball',
    'volley ball': 'volleyball',
    'volleyball': 'volleyball',
    'frisbee': 'frisbee',
    'basketball team': 'basketball-team',
    'basketball': 'basketball-team',
    'double wicket': 'double-wicket',
    'darts singles': 'darts-singles',
    'dart singles': 'darts-singles',
    'dart doubles': 'darts-doubles',
    '100m race': '100m-race',
    'relay race': 'relay-race',
    '3 leg race': '3-leg-race',
    'egg relay race': 'egg-relay-race',
    'rope jump': 'rope-jump',
    'plank': 'plank',
    'laser run': 'laser-run',
    'scavenger hunt': 'scavenger-hunt',
    '1 vs 1 penalty': '1v1-penalty',
    'rifle shooting': 'rifle-shooting',
    'squid game': 'squid-game',
    'pucket': 'pucket',
    'gol gappay eating challenge': 'gol-gappay-eating',
    'uno': 'uno',
    'jenga': 'jenga',
    'chess': 'chess',
    "rubik's cube": 'rubiks-cube',
    'pubg': 'pubg-mobile',
    'pubg mobile': 'pubg-mobile',
    'call of duty mobile': 'cod-mobile',
    'blur (racing)': 'blur-racing',
    'subway surfer': 'subway-surfers',
    'piano tiles': 'piano-tiles',
    'tekken': 'tekken',
    'fifa': 'fifa',
  };
  const targetId = reverseAliases[normalized];
  if (targetId) return GAMES_DATA.find((g) => g.id === targetId);
  const substringMatches = GAMES_DATA.filter((g) => {
    const gn = g.name.toLowerCase();
    const isIncompatibleFormat =
      (normalized.includes('singles') && gn.includes('doubles')) ||
      (normalized.includes('doubles') && gn.includes('singles'));
    if (isIncompatibleFormat) return false;
    return gn.includes(normalized) || normalized.includes(gn);
  });
  return substringMatches.length === 1 ? substringMatches[0] : undefined;
}

/**
 * Merge live database games (`/api/games`) with the 49-game catalog metadata so any
 * game name, price, player count, addition, or deletion done in Admin Settings
 * immediately reflects across the entire public website.
 */
export function mergeLiveGamesWithCatalog(liveRows: GamePrice[]): GameInfo[] {
  if (!Array.isArray(liveRows) || liveRows.length === 0) {
    return GAMES_DATA;
  }

  const filteredLiveRows = liveRows.filter((row) => {
    const lower = row.name.trim().toLowerCase();
    return lower !== 'field hockey' && lower !== 'hockey' && lower !== 'swimming sprint' && lower !== 'swimming';
  });

  if (filteredLiveRows.length === 0) {
    return GAMES_DATA;
  }

  const hasSyncedCatalog = filteredLiveRows.some((r) => Boolean(r.category)) || filteredLiveRows.length >= 35;

  const convertRow = (row: GamePrice): GameInfo => {
    const exactMatch = findCatalogMatch(row.name);
    const hasBoys = row.boys !== null && row.boys !== undefined;
    const hasGirls = row.girls !== null && row.girls !== undefined;
    const division: GameInfo['division'] =
      hasBoys && hasGirls ? 'boys_and_girls' : hasBoys ? 'boys_only' : 'girls_only';

    const boysPlayers = hasBoys ? (row.boysPlayers ?? exactMatch?.boysPlayers ?? 1) : undefined;
    const girlsPlayers = hasGirls ? (row.girlsPlayers ?? exactMatch?.girlsPlayers ?? 1) : undefined;
    const maxPlayers = Math.max(boysPlayers ?? 1, girlsPlayers ?? 1);
    const category = normalizeCategory(row.category ?? exactMatch?.category, row.name);
    const categoryLabel = CATEGORY_LABELS[category];

    return {
      id: exactMatch?.id ?? slugify(row.name),
      name: row.name,
      category,
      categoryLabel,
      headline: exactMatch?.headline ?? row.name.toUpperCase(),
      tagline:
        exactMatch?.tagline ??
        `Official Mini Olympics 2026 ${categoryLabel.toLowerCase()} competition for ${row.name}.`,
      division,
      playerFormat:
        exactMatch &&
        exactMatch.boysPlayers === boysPlayers &&
        exactMatch.girlsPlayers === girlsPlayers
          ? exactMatch.playerFormat
          : buildPlayerFormat(boysPlayers, girlsPlayers),
      matchFormat: exactMatch?.matchFormat ?? 'TOURNAMENT BRACKET',
      boysPlayers,
      girlsPlayers,
      boysFee: hasBoys ? Number(row.boys) : undefined,
      girlsFee: hasGirls ? Number(row.girls) : undefined,
      isTeam: maxPlayers > 1,
      featured: exactMatch?.featured ?? false,
      featuredLayout: exactMatch?.featuredLayout,
      rulesOverview:
        exactMatch?.rulesOverview ??
        `Standard FCIT Sports Society tournament regulations apply for ${row.name}.`,
      venueNote: exactMatch?.venueNote ?? 'PUCIT Old Campus Arena',
      accentColor: exactMatch?.accentColor ?? '#12E2C4',
      iconKey: exactMatch?.iconKey ?? 'trophy',
      image: exactMatch?.image ?? DEFAULT_FALLBACK_IMAGE,
    };
  };

  if (hasSyncedCatalog) {
    return filteredLiveRows.map(convertRow);
  }

  // Legacy partial DB fallback: keep catalog games visible while overlaying live DB prices/names
  const matchedCatalogIds = new Set<string>();
  const convertedByCatalogId = new Map<string, GameInfo>();
  const extraDbGames: GameInfo[] = [];

  for (const row of filteredLiveRows) {
    const converted = convertRow(row);
    const catalogMatch = findCatalogMatch(row.name);
    if (catalogMatch) {
      matchedCatalogIds.add(catalogMatch.id);
      convertedByCatalogId.set(catalogMatch.id, converted);
    } else {
      extraDbGames.push(converted);
    }
  }

  const mergedCatalog = GAMES_DATA.map((g) => convertedByCatalogId.get(g.id) ?? g);
  return [...mergedCatalog, ...extraDbGames];
}

export function getGameById(id: string): GameInfo | undefined {
  return GAMES_DATA.find((g) => g.id === id || g.name.toLowerCase() === id.toLowerCase());
}

export function getGamesByCategory(category: SportCategory): GameInfo[] {
  return GAMES_DATA.filter((g) => g.category === category);
}

export function getFeaturedGames(): GameInfo[] {
  return GAMES_DATA.filter((g) => g.featured);
}

export type DivisionFilter =
  | 'all'
  | 'boys_and_girls'
  | 'boys_only'
  | 'girls_only';

export type TeamSizeFilter = 'all' | 'solo' | 'duo' | 'squad';

export type SortOption = 'default' | 'name_asc' | 'fee_asc' | 'fee_desc' | 'players_desc';

const CATEGORY_ORDER_INDEX = new Map(CATEGORIES.map((c, idx) => [c.id, idx]));

/** Sort games according to the curated CATEGORIES order, preserving relative order inside each category. */
export function sortByCategoryOrder(games: GameInfo[]): GameInfo[] {
  return [...games].sort(
    (a, b) =>
      (CATEGORY_ORDER_INDEX.get(a.category) ?? 99) -
      (CATEGORY_ORDER_INDEX.get(b.category) ?? 99)
  );
}

/** Check whether a game matches the selected division filter. */
export function matchesDivisionFilter(game: GameInfo, division: DivisionFilter): boolean {
  if (division === 'all') return true;
  return game.division === division;
}

/** Return the maximum player count per side for a game. */
export function getMaxPlayers(game: GameInfo): number {
  return Math.max(game.boysPlayers ?? 1, game.girlsPlayers ?? 1);
}

/** Check whether a game matches the selected team size filter. */
export function matchesTeamSizeFilter(game: GameInfo, size: TeamSizeFilter): boolean {
  if (size === 'all') return true;
  const maxPlayers = getMaxPlayers(game);
  if (size === 'solo') return maxPlayers <= 1;
  if (size === 'duo') return maxPlayers === 2;
  return maxPlayers >= 3;
}

/** Return the minimum non-null entry fee for sorting/display. */
export function getLowestFee(game: GameInfo): number {
  const fees = [game.boysFee, game.girlsFee].filter((f): f is number => typeof f === 'number');
  return fees.length > 0 ? Math.min(...fees) : 0;
}

/** Return formatted fee summary showing both divisions if their fees differ. */
export function getFeeSummary(game: GameInfo): string {
  const b = game.boysFee;
  const g = game.girlsFee;
  if (typeof b === 'number' && typeof g === 'number' && b !== g) {
    return `♂ Rs. ${b.toLocaleString()} · ♀ Rs. ${g.toLocaleString()}`;
  }
  const fee = typeof b === 'number' ? b : typeof g === 'number' ? g : 0;
  return fee > 0 ? `Rs. ${fee.toLocaleString()}` : 'Free';
}

/** Compact division badge label for cards and modals. */
export function getDivisionLabel(division: GameInfo['division']): string {
  if (division === 'boys_and_girls') return 'Boys & Girls';
  if (division === 'boys_only') return 'Boys Only';
  return 'Girls Only';
}

/** Compact player-count summary string (e.g. "♂ 11p · ♀ 5p" or "1p"). */
export function getCompactPlayerLabel(game: GameInfo): string {
  const b = game.boysPlayers;
  const g = game.girlsPlayers;
  if (b && g && b !== g) return `♂ ${b}p · ♀ ${g}p`;
  const count = b ?? g ?? 1;
  return `${count}p`;
}

const PRICING_ALIASES: Record<string, string> = {
  'cricket': 'Tape Ball Cricket',
  'tape ball cricket': 'Cricket',
  'football': 'Football Championship',
  'football championship': 'Football',
  'double wicket': 'Double Wicket Cricket',
  'double wicket cricket': 'Double Wicket',
  'kabaddi': 'Kabaddi Championship',
  'kabbadi': 'Kabaddi Championship',
  'handball': 'Handball Clash',
  'volley ball': 'Volleyball Spike',
  'volleyball': 'Volleyball Spike',
  'frisbee': 'Ultimate Frisbee',
  'basketball team': 'Basketball Team',
  'basketball': 'Basketball Team',
  'laser run': 'Laser Run',
  'scavenger hunt': 'Scavenger Hunt',
  'chess': 'Championship Chess',
  'championship chess': 'Chess',
  'jenga': 'Jenga Tower Challenge',
  'jenga tower challenge': 'Jenga',
  'uno': 'Uno Championship',
  'uno championship': 'Uno',
  'pucket': 'Pucket Fast-Track',
  'dart singles': 'Darts Singles (501)',
  'darts singles': 'Darts Singles (501)',
  'darts singles (501)': 'Darts Singles',
  'dart doubles': 'Darts Doubles',
  '100m race': '100m Sprint Dash',
  '3 leg race': '3 Legged Race',
  'relay race': '4x100m Baton Relay',
  'egg relay race': 'Egg & Spoon Relay',
  'foosball singles': 'Foosball Singles',
  'foosball doubles': 'Foosball Doubles',
  '1 vs 1 penalty': '1v1 Penalty Shootout',
  'rifle shooting': 'Air Rifle Target Shooting',
  'gol gappay eating challenge': 'Gol Gappay Challenge',
  'plank': 'Plank Endurance Test',
  'rope jump': 'Rope Jump Sprint',
  "rubik's cube": "Rubik's Speedcubing",
  'squid game': 'Red Light Green Light',
  'subway surfer': 'Subway Surfers High Score',
  'blur (racing)': 'Blur PC Racing',
  'piano tiles': 'Piano Tiles Reflex Test',
  'fifa': 'EA Sports FC / FIFA 24',
  'ea sports fc / fifa 24': 'Fifa',
  'tekken': 'Tekken 8 Tournament',
  'tekken 8 tournament': 'Tekken',
  'call of duty mobile': 'Call of Duty: Mobile',
  'pubg': 'PUBG Mobile Championship',
  'pubg mobile': 'PUBG Mobile Championship',
  'pubg mobile championship': 'PUBG Mobile',
};

/** Resolve a catalog game name or id to a matching pricing entry name. */
export function resolvePricingName(input: string, availableNames: string[]): string | null {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;

  const exact = availableNames.find((n) => n.toLowerCase() === normalized);
  if (exact) return exact;

  const aliasTarget = PRICING_ALIASES[normalized];
  if (aliasTarget) {
    const aliased = availableNames.find((n) => n.toLowerCase() === aliasTarget.toLowerCase());
    if (aliased) return aliased;
  }

  // Fallback substring match only when unambiguous and format-compatible (Singles vs Doubles)
  const contains = availableNames.filter((n) => {
    const nl = n.toLowerCase();
    const isIncompatibleFormat =
      (normalized.includes('singles') && nl.includes('doubles')) ||
      (normalized.includes('doubles') && nl.includes('singles'));
    if (isIncompatibleFormat) return false;
    return normalized.includes(nl) || nl.includes(normalized);
  });
  return contains.length === 1 ? contains[0] : null;
}

