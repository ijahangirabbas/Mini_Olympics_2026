-- Complete Database Reset and Re-initialization Script
-- WARNING: This will delete ALL data and recreate tables!
-- Use with caution in production

-- Step 1: Drop all tables in correct order
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS esports_settings CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS games_pricing CASCADE;

-- Step 2: Drop sequences
DROP SEQUENCE IF EXISTS registration_number_seq;

-- Step 3: Create sequence for registration numbers
CREATE SEQUENCE IF NOT EXISTS registration_number_seq START 1;

-- Step 3.5: Create admin users table (for admin login)
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Step 4: Create registrations table
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

-- Step 5: Create games_pricing table
CREATE TABLE IF NOT EXISTS games_pricing (
  id SERIAL PRIMARY KEY,
  game_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('boys', 'girls', 'both')),
  price DECIMAL(10, 2) NOT NULL,
  players INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(game_name, gender)
);

-- Step 6: Run `node scripts/sync-pdf-games.js --replace` after schema reset to seed all 49 canonical games.
ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS game_id VARCHAR(120);
ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS coupon_eligible BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'PKR';

-- Step 7: Create esports_settings table
CREATE TABLE IF NOT EXISTS esports_settings (
  id TEXT PRIMARY KEY DEFAULT '1',
  is_open BOOLEAN DEFAULT false,
  open_date TIMESTAMP,
  close_date TIMESTAMP,
  announcement TEXT,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Step 8: Initialize esports settings
INSERT INTO esports_settings (id, is_open, announcement) 
VALUES ('1', false, 'Esports registration will open soon.')
ON CONFLICT (id) DO UPDATE SET 
  is_open = false,
  announcement = 'Esports registration will open soon.',
  updated_at = NOW();

-- Step 9: Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Step 10: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_registration_number ON registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_registrations_slip_id ON registrations(slip_id);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Done! Database is reset and reinitialized
SELECT 'Database reset and reinitialized successfully!' AS message;

