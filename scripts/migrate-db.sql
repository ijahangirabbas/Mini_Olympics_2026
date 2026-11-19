-- Migration script to update existing database to new schema
-- Run this if you have an existing database

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add registration_number sequence if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'registration_number_seq') THEN
        CREATE SEQUENCE registration_number_seq START 1;
    END IF;

    -- Add new columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registrations' AND column_name = 'registration_number') THEN
        ALTER TABLE registrations ADD COLUMN registration_number INTEGER UNIQUE DEFAULT nextval('registration_number_seq');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registrations' AND column_name = 'alternative_contact_number') THEN
        ALTER TABLE registrations ADD COLUMN alternative_contact_number VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registrations' AND column_name = 'gender') THEN
        ALTER TABLE registrations ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('boys', 'girls'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registrations' AND column_name = 'selected_games') THEN
        ALTER TABLE registrations ADD COLUMN selected_games TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registrations' AND column_name = 'total_amount') THEN
        ALTER TABLE registrations ADD COLUMN total_amount DECIMAL(10, 2);
    END IF;

    -- Remove old columns if they exist (optional - comment out if you want to keep them)
    -- ALTER TABLE registrations DROP COLUMN IF EXISTS department;
    -- ALTER TABLE registrations DROP COLUMN IF EXISTS semester;
    -- ALTER TABLE registrations DROP COLUMN IF EXISTS sport;
    -- ALTER TABLE registrations DROP COLUMN IF EXISTS esports_subcategory;
END $$;

-- Create games_pricing table if it doesn't exist
CREATE TABLE IF NOT EXISTS games_pricing (
  id SERIAL PRIMARY KEY,
  game_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('boys', 'girls', 'both')),
  price DECIMAL(10, 2) NOT NULL,
  players INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create admin_users table if it doesn't exist (for admin login)
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Games pricing is seeded canonically via: node scripts/sync-pdf-games.js (49 official games)
ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS game_id VARCHAR(120);
ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS coupon_eligible BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'PKR';

-- Create index for registration_number if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_registrations_registration_number ON registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_games_pricing_game_gender ON games_pricing(game_name, gender);

