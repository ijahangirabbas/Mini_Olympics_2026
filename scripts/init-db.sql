-- Create sequence for auto-incrementing registration numbers
CREATE SEQUENCE IF NOT EXISTS registration_number_seq START 1;

-- Create admin users table (for admin login)
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  assigned_games TEXT,
  assigned_gender TEXT DEFAULT 'both',
  created_by TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create permissions table (per-page access control)
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL,
  can_view BOOLEAN DEFAULT true NOT NULL,
  can_edit BOOLEAN DEFAULT false NOT NULL,
  can_delegate BOOLEAN DEFAULT false NOT NULL,
  granted_by TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, page_key)
);

-- Create coordinator matches table
CREATE TABLE IF NOT EXISTS coordinator_matches (
  id TEXT PRIMARY KEY,
  game_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('boys', 'girls')),
  round_name VARCHAR(100) NOT NULL DEFAULT 'Round 1',
  match_number INTEGER NOT NULL DEFAULT 1,
  player1_name VARCHAR(255) NOT NULL,
  player1_reg_id TEXT,
  player1_roll VARCHAR(50),
  player1_contact VARCHAR(30),
  player2_name VARCHAR(255) NOT NULL,
  player2_reg_id TEXT,
  player2_roll VARCHAR(50),
  player2_contact VARCHAR(30),
  scheduled_date VARCHAR(50),
  scheduled_time VARCHAR(120),
  venue VARCHAR(150),
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'walkover')),
  winner_name VARCHAR(255),
  score_summary VARCHAR(255),
  notes TEXT,
  coordinator_id TEXT,
  coordinator_username TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  registration_number INTEGER UNIQUE DEFAULT nextval('registration_number_seq'),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  roll_number VARCHAR(50) NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  alternative_contact_number VARCHAR(20),
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('boys', 'girls')),
  selected_games TEXT NOT NULL, -- JSON array of selected games
  team_members TEXT, -- JSON object: { gameName: [{ name, rollNumber, contactNumber }] }
  total_amount DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0, -- Discount amount (e.g., 200)
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'online')),
  slip_id VARCHAR(50),
  transaction_id VARCHAR(255),
  screenshot_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_cash' CHECK (status IN ('pending_cash', 'pending_online', 'paid', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create games_pricing table for reference
CREATE TABLE IF NOT EXISTS games_pricing (
  id SERIAL PRIMARY KEY,
  game_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('boys', 'girls', 'both')),
  price DECIMAL(10, 2) NOT NULL,
  players INTEGER,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(game_name, gender)
);

-- Insert official PDF games pricing data + kept disciplines
INSERT INTO games_pricing (game_name, gender, price, players, category) VALUES
('Tape Ball Cricket', 'boys', 1600.00, 8, 'team'),
('Tape Ball Cricket', 'girls', 1200.00, 5, 'team'),
('Football Championship', 'boys', 2200.00, 11, 'team'),
('Football Championship', 'girls', 1200.00, 6, 'team'),
('Basketball Team', 'boys', 2200.00, 7, 'team'),
('Basketball Team', 'girls', 2200.00, 7, 'team'),
('Handball Clash', 'boys', 1200.00, 6, 'team'),
('Handball Clash', 'girls', 1200.00, 6, 'team'),
('Volleyball Spike', 'boys', 1200.00, 6, 'team'),
('Volleyball Spike', 'girls', 1200.00, 6, 'team'),
('Kabaddi Championship', 'boys', 500.00, 7, 'team'),
('Kabaddi Championship', 'girls', 500.00, 7, 'team'),
('Tug of War', 'boys', 600.00, 8, 'team'),
('Tug of War', 'girls', 600.00, 8, 'team'),
('Ultimate Frisbee', 'boys', 250.00, 1, 'team'),
('Ultimate Frisbee', 'girls', 250.00, 1, 'team'),
('Pitho Gol Garam', 'boys', 1000.00, 6, 'team'),
('Double Wicket Cricket', 'boys', 500.00, 2, 'team'),
('Badminton Singles', 'boys', 200.00, 1, 'indoor'),
('Badminton Singles', 'girls', 200.00, 1, 'indoor'),
('Badminton Doubles', 'boys', 400.00, 2, 'indoor'),
('Badminton Doubles', 'girls', 400.00, 2, 'indoor'),
('Table Tennis Singles', 'boys', 200.00, 1, 'indoor'),
('Table Tennis Singles', 'girls', 200.00, 1, 'indoor'),
('Table Tennis Doubles', 'boys', 400.00, 2, 'indoor'),
('Table Tennis Doubles', 'girls', 400.00, 2, 'indoor'),
('Carrom Singles', 'boys', 150.00, 1, 'indoor'),
('Carrom Singles', 'girls', 150.00, 1, 'indoor'),
('Carrom Doubles', 'boys', 250.00, 2, 'indoor'),
('Carrom Doubles', 'girls', 250.00, 2, 'indoor'),
('Ludo Singles', 'boys', 200.00, 1, 'indoor'),
('Ludo Singles', 'girls', 200.00, 1, 'indoor'),
('Ludo Doubles', 'boys', 300.00, 2, 'indoor'),
('Ludo Doubles', 'girls', 300.00, 2, 'indoor'),
('Foosball Singles', 'boys', 150.00, 1, 'indoor'),
('Foosball Singles', 'girls', 150.00, 1, 'indoor'),
('Foosball Doubles', 'boys', 300.00, 2, 'indoor'),
('Foosball Doubles', 'girls', 300.00, 2, 'indoor'),
('Darts Singles (501)', 'boys', 150.00, 1, 'indoor'),
('Darts Singles (501)', 'girls', 150.00, 1, 'indoor'),
('Darts Doubles', 'boys', 300.00, 2, 'indoor'),
('Darts Doubles', 'girls', 300.00, 2, 'indoor'),
('100m Sprint Dash', 'boys', 200.00, 1, 'track'),
('100m Sprint Dash', 'girls', 200.00, 1, 'track'),
('4x100m Baton Relay', 'boys', 200.00, 4, 'track'),
('4x100m Baton Relay', 'girls', 200.00, 4, 'track'),
('3 Legged Race', 'boys', 200.00, 2, 'track'),
('3 Legged Race', 'girls', 200.00, 2, 'track'),
('Egg & Spoon Relay', 'boys', 150.00, 2, 'track'),
('Egg & Spoon Relay', 'girls', 150.00, 2, 'track'),
('Rope Jump Sprint', 'boys', 200.00, 1, 'track'),
('Rope Jump Sprint', 'girls', 200.00, 1, 'track'),
('Plank Endurance Test', 'boys', 150.00, 1, 'track'),
('Plank Endurance Test', 'girls', 150.00, 1, 'track'),
('Laser Run', 'boys', 300.00, 1, 'track'),
('Laser Run', 'girls', 300.00, 1, 'track'),
('Scavenger Hunt', 'boys', 400.00, 1, 'track'),
('Scavenger Hunt', 'girls', 400.00, 1, 'track'),
('1v1 Penalty Shootout', 'boys', 200.00, 1, 'track'),
('1v1 Penalty Shootout', 'girls', 200.00, 1, 'track'),
('Air Rifle Target Shooting', 'boys', 150.00, 1, 'fun'),
('Air Rifle Target Shooting', 'girls', 150.00, 1, 'fun'),
('Arm Wrestling', 'boys', 200.00, 1, 'fun'),
('Arm Wrestling', 'girls', 200.00, 1, 'fun'),
('Red Light Green Light', 'boys', 200.00, 1, 'fun'),
('Red Light Green Light', 'girls', 200.00, 1, 'fun'),
('Pucket Fast-Track', 'boys', 200.00, 1, 'fun'),
('Pucket Fast-Track', 'girls', 200.00, 1, 'fun'),
('Gol Gappay Challenge', 'boys', 300.00, 1, 'fun'),
('Gol Gappay Challenge', 'girls', 300.00, 1, 'fun'),
('Uno Championship', 'boys', 200.00, 1, 'fun'),
('Uno Championship', 'girls', 200.00, 1, 'fun'),
('Jenga Tower Challenge', 'boys', 200.00, 1, 'fun'),
('Jenga Tower Challenge', 'girls', 200.00, 1, 'fun'),
('Championship Chess', 'boys', 200.00, 1, 'fun'),
('Championship Chess', 'girls', 200.00, 1, 'fun'),
('Rubik''s Speedcubing', 'boys', 200.00, 1, 'fun'),
('Rubik''s Speedcubing', 'girls', 200.00, 1, 'fun'),
('Archery Target Shoot', 'boys', 200.00, 1, 'fun'),
('Thula Traditional', 'boys', 150.00, 1, 'fun'),
('PUBG Mobile Championship', 'boys', 150.00, 1, 'esports'),
('PUBG Mobile Championship', 'girls', 150.00, 1, 'esports'),
('Call of Duty: Mobile', 'boys', 150.00, 1, 'esports'),
('Call of Duty: Mobile', 'girls', 150.00, 1, 'esports'),
('Blur PC Racing', 'boys', 150.00, 1, 'esports'),
('Blur PC Racing', 'girls', 150.00, 1, 'esports'),
('Subway Surfers High Score', 'boys', 150.00, 1, 'esports'),
('Subway Surfers High Score', 'girls', 150.00, 1, 'esports'),
('Piano Tiles Reflex Test', 'boys', 150.00, 1, 'esports'),
('Piano Tiles Reflex Test', 'girls', 150.00, 1, 'esports'),
('Tekken 8 Tournament', 'boys', 300.00, 1, 'esports'),
('Tekken 8 Tournament', 'girls', 300.00, 1, 'esports'),
('EA Sports FC / FIFA 24', 'boys', 300.00, 1, 'esports'),
('EA Sports FC / FIFA 24', 'girls', 300.00, 1, 'esports')
ON CONFLICT DO NOTHING;

-- Create esports_settings table
CREATE TABLE IF NOT EXISTS esports_settings (
  id TEXT PRIMARY KEY DEFAULT '1',
  is_open BOOLEAN DEFAULT true NOT NULL,
  open_date TIMESTAMP,
  close_date TIMESTAMP,
  announcement TEXT,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert default esports settings
INSERT INTO esports_settings (id, is_open, announcement)
VALUES ('1', true, '')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_method ON registrations(payment_method);
CREATE INDEX IF NOT EXISTS idx_registrations_registration_number ON registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_games_pricing_game_gender ON games_pricing(game_name, gender);
