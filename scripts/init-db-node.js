#!/usr/bin/env node
/**
 * Database initialization script using Node.js
 * This script can run without psql - it uses the Neon serverless driver
 * 
 * Usage:
 *   node scripts/init-db-node.js
 * 
 * Requires DATABASE_URL in env.local or environment
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnv() {
  const envFiles = ['env.local', '.env.local'];
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, '..', envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          if (key && value && !process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  }
}

loadEnv();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set.');
  console.error('   Please set it in env.local or export it in your shell.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function executeSQL(statement, description) {
  try {
    await sql(statement);
    console.log(`✅ ${description}`);
    return true;
  } catch (err) {
    // Some errors are expected (like "already exists")
    if (err.message && (
      err.message.includes('already exists') ||
      err.message.includes('duplicate key') ||
      err.message.includes('ON CONFLICT') ||
      err.message.includes('already defined')
    )) {
      console.log(`ℹ️  ${description} (already exists, skipping)`);
      return true;
    } else {
      console.error(`❌ Error: ${description}`);
      console.error(`   ${err.message}`);
      throw err;
    }
  }
}

async function initDatabase() {
  console.log('🚀 Initializing database...\n');

  try {
    // Use the comprehensive SQL from db.sh script
    const statements = [
      {
        sql: `CREATE SEQUENCE IF NOT EXISTS registration_number_seq START 1`,
        desc: 'Creating registration number sequence'
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS admin_users (
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
        )`,
        desc: 'Creating admin_users table'
      },
      {
        sql: `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS display_name TEXT`,
        desc: 'Adding admin_users.display_name column'
      },
      {
        sql: `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS assigned_games TEXT`,
        desc: 'Adding admin_users.assigned_games column'
      },
      {
        sql: `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS assigned_gender TEXT DEFAULT 'both'`,
        desc: 'Adding admin_users.assigned_gender column'
      },
      {
        sql: `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS created_by TEXT`,
        desc: 'Adding admin_users.created_by column'
      },
      {
        sql: `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL`,
        desc: 'Adding admin_users.is_active column'
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS permissions (
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
        )`,
        desc: 'Creating permissions table'
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS coordinator_matches (
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
        )`,
        desc: 'Creating coordinator_matches table'
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS sport_groups (
          id TEXT PRIMARY KEY,
          game_name TEXT NOT NULL UNIQUE,
          group_title TEXT,
          group_url TEXT,
          coordinator_name TEXT,
          coordinator_phone TEXT,
          message_template TEXT,
          is_active BOOLEAN DEFAULT true NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )`,
        desc: 'Creating sport_groups table'
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS registrations (
          id TEXT PRIMARY KEY,
          registration_number INTEGER UNIQUE DEFAULT nextval('registration_number_seq'),
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          roll_number VARCHAR(50) NOT NULL,
          contact_number VARCHAR(20) NOT NULL,
          alternative_contact_number VARCHAR(20),
          gender VARCHAR(10) NOT NULL CHECK (gender IN ('boys', 'girls')),
          team_name VARCHAR(100),
          selected_games TEXT NOT NULL,
          team_members TEXT,
          total_amount DECIMAL(10, 2) NOT NULL,
          discount DECIMAL(10, 2) DEFAULT 0,
          payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'online')),
          slip_id VARCHAR(50),
          transaction_id VARCHAR(255),
          screenshot_url TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'pending_cash' CHECK (status IN ('pending_cash', 'pending_online', 'paid', 'rejected')),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )`,
        desc: 'Creating registrations table'
      },
      {
        sql: `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS created_date DATE`,
        desc: 'Adding created_date column'
      },
      {
        sql: `UPDATE registrations SET created_date = DATE(created_at) WHERE created_date IS NULL`,
        desc: 'Setting created_date from created_at'
      },
      {
        sql: `ALTER TABLE registrations ALTER COLUMN created_date SET DEFAULT CURRENT_DATE`,
        desc: 'Setting created_date default'
      },
      {
        sql: `ALTER TABLE registrations ALTER COLUMN created_date SET NOT NULL`,
        desc: 'Making created_date NOT NULL'
      },
      {
        sql: `CREATE OR REPLACE FUNCTION set_created_date_from_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.created_date IS NULL AND NEW.created_at IS NOT NULL THEN
            NEW.created_date := DATE(NEW.created_at);
          ELSIF NEW.created_date IS NULL THEN
            NEW.created_date := CURRENT_DATE;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql`,
        desc: 'Creating trigger function'
      },
      {
        sql: `DROP TRIGGER IF EXISTS trigger_set_created_date ON registrations`,
        desc: 'Dropping old trigger'
      },
      {
        sql: `CREATE TRIGGER trigger_set_created_date
        BEFORE INSERT OR UPDATE ON registrations
        FOR EACH ROW
        EXECUTE FUNCTION set_created_date_from_timestamp()`,
        desc: 'Creating trigger'
      },
      {
        sql: `CREATE TABLE IF NOT EXISTS games_pricing (
          id SERIAL PRIMARY KEY,
          game_name VARCHAR(100) NOT NULL,
          gender VARCHAR(10) NOT NULL CHECK (gender IN ('boys', 'girls', 'both')),
          price DECIMAL(10, 2) NOT NULL,
          players INTEGER,
          category VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE(game_name, gender)
        )`,
        desc: 'Creating games_pricing table'
      },
      {
        sql: `ALTER TABLE games_pricing ADD COLUMN IF NOT EXISTS category VARCHAR(50)`,
        desc: 'Adding games_pricing.category column'
      }
    ];

    // Execute table creation statements
    for (const stmt of statements) {
      await executeSQL(stmt.sql, stmt.desc);
    }

    // Insert official PDF games pricing + kept disciplines
    const pricingData = [
  ["Tape Ball Cricket", "boys", 1600, 8, "team"],
  ["Tape Ball Cricket", "girls", 1200, 5, "team"],
  ["Football Championship", "boys", 2200, 11, "team"],
  ["Football Championship", "girls", 1200, 6, "team"],
  ["Basketball Team", "boys", 2200, 7, "team"],
  ["Basketball Team", "girls", 2200, 7, "team"],
  ["Handball Clash", "boys", 1200, 6, "team"],
  ["Handball Clash", "girls", 1200, 6, "team"],
  ["Volleyball Spike", "boys", 1200, 6, "team"],
  ["Volleyball Spike", "girls", 1200, 6, "team"],
  ["Kabaddi Championship", "boys", 500, 7, "team"],
  ["Kabaddi Championship", "girls", 500, 7, "team"],
  ["Tug of War", "boys", 600, 8, "team"],
  ["Tug of War", "girls", 600, 8, "team"],
  ["Ultimate Frisbee", "boys", 250, 1, "team"],
  ["Ultimate Frisbee", "girls", 250, 1, "team"],
  ["Pitho Gol Garam", "boys", 1000, 6, "team"],
  ["Double Wicket Cricket", "boys", 500, 2, "team"],
  ["Badminton Singles", "boys", 200, 1, "indoor"],
  ["Badminton Singles", "girls", 200, 1, "indoor"],
  ["Badminton Doubles", "boys", 400, 2, "indoor"],
  ["Badminton Doubles", "girls", 400, 2, "indoor"],
  ["Table Tennis Singles", "boys", 200, 1, "indoor"],
  ["Table Tennis Singles", "girls", 200, 1, "indoor"],
  ["Table Tennis Doubles", "boys", 400, 2, "indoor"],
  ["Table Tennis Doubles", "girls", 400, 2, "indoor"],
  ["Carrom Singles", "boys", 150, 1, "indoor"],
  ["Carrom Singles", "girls", 150, 1, "indoor"],
  ["Carrom Doubles", "boys", 250, 2, "indoor"],
  ["Carrom Doubles", "girls", 250, 2, "indoor"],
  ["Ludo Singles", "boys", 200, 1, "indoor"],
  ["Ludo Singles", "girls", 200, 1, "indoor"],
  ["Ludo Doubles", "boys", 300, 2, "indoor"],
  ["Ludo Doubles", "girls", 300, 2, "indoor"],
  ["Foosball Singles", "boys", 150, 1, "indoor"],
  ["Foosball Singles", "girls", 150, 1, "indoor"],
  ["Foosball Doubles", "boys", 300, 2, "indoor"],
  ["Foosball Doubles", "girls", 300, 2, "indoor"],
  ["Darts Singles (501)", "boys", 150, 1, "indoor"],
  ["Darts Singles (501)", "girls", 150, 1, "indoor"],
  ["Darts Doubles", "boys", 300, 2, "indoor"],
  ["Darts Doubles", "girls", 300, 2, "indoor"],
  ["100m Sprint Dash", "boys", 200, 1, "track"],
  ["100m Sprint Dash", "girls", 200, 1, "track"],
  ["4x100m Baton Relay", "boys", 200, 4, "track"],
  ["4x100m Baton Relay", "girls", 200, 4, "track"],
  ["3 Legged Race", "boys", 200, 2, "track"],
  ["3 Legged Race", "girls", 200, 2, "track"],
  ["Egg & Spoon Relay", "boys", 150, 2, "track"],
  ["Egg & Spoon Relay", "girls", 150, 2, "track"],
  ["Rope Jump Sprint", "boys", 200, 1, "track"],
  ["Rope Jump Sprint", "girls", 200, 1, "track"],
  ["Plank Endurance Test", "boys", 150, 1, "track"],
  ["Plank Endurance Test", "girls", 150, 1, "track"],
  ["Laser Run", "boys", 300, 1, "track"],
  ["Laser Run", "girls", 300, 1, "track"],
  ["Scavenger Hunt", "boys", 400, 1, "track"],
  ["Scavenger Hunt", "girls", 400, 1, "track"],
  ["1v1 Penalty Shootout", "boys", 200, 1, "track"],
  ["1v1 Penalty Shootout", "girls", 200, 1, "track"],
  ["Air Rifle Target Shooting", "boys", 150, 1, "fun"],
  ["Air Rifle Target Shooting", "girls", 150, 1, "fun"],
  ["Arm Wrestling", "boys", 200, 1, "fun"],
  ["Arm Wrestling", "girls", 200, 1, "fun"],
  ["Red Light Green Light", "boys", 200, 1, "fun"],
  ["Red Light Green Light", "girls", 200, 1, "fun"],
  ["Pucket Fast-Track", "boys", 200, 1, "fun"],
  ["Pucket Fast-Track", "girls", 200, 1, "fun"],
  ["Gol Gappay Challenge", "boys", 300, 1, "fun"],
  ["Gol Gappay Challenge", "girls", 300, 1, "fun"],
  ["Uno Championship", "boys", 200, 1, "fun"],
  ["Uno Championship", "girls", 200, 1, "fun"],
  ["Jenga Tower Challenge", "boys", 200, 1, "fun"],
  ["Jenga Tower Challenge", "girls", 200, 1, "fun"],
  ["Championship Chess", "boys", 200, 1, "fun"],
  ["Championship Chess", "girls", 200, 1, "fun"],
  ["Rubik's Speedcubing", "boys", 200, 1, "fun"],
  ["Rubik's Speedcubing", "girls", 200, 1, "fun"],
  ["Archery Target Shoot", "boys", 200, 1, "fun"],
  ["Thula Traditional", "boys", 150, 1, "fun"],
  ["PUBG Mobile Championship", "boys", 150, 1, "esports"],
  ["PUBG Mobile Championship", "girls", 150, 1, "esports"],
  ["Call of Duty: Mobile", "boys", 150, 1, "esports"],
  ["Call of Duty: Mobile", "girls", 150, 1, "esports"],
  ["Blur PC Racing", "boys", 150, 1, "esports"],
  ["Blur PC Racing", "girls", 150, 1, "esports"],
  ["Subway Surfers High Score", "boys", 150, 1, "esports"],
  ["Subway Surfers High Score", "girls", 150, 1, "esports"],
  ["Piano Tiles Reflex Test", "boys", 150, 1, "esports"],
  ["Piano Tiles Reflex Test", "girls", 150, 1, "esports"],
  ["Tekken 8 Tournament", "boys", 300, 1, "esports"],
  ["Tekken 8 Tournament", "girls", 300, 1, "esports"],
  ["EA Sports FC / FIFA 24", "boys", 300, 1, "esports"],
  ["EA Sports FC / FIFA 24", "girls", 300, 1, "esports"]
    ];

    for (const [game, gender, price, players, category] of pricingData) {
      try {
        await sql`INSERT INTO games_pricing (game_name, gender, price, players, category) VALUES (${game}, ${gender}, ${price}, ${players}, ${category}) ON CONFLICT (game_name, gender) DO NOTHING`;
        console.log(`✅ Inserting pricing: ${game} (${gender})`);
      } catch (err) {
        if (err.message && err.message.includes('ON CONFLICT')) {
          console.log(`ℹ️  Inserting pricing: ${game} (${gender}) (already exists, skipping)`);
        } else {
          throw err;
        }
      }
    }

    // Create remaining tables
    await executeSQL(
      `CREATE TABLE IF NOT EXISTS esports_settings (
        id TEXT PRIMARY KEY DEFAULT '1',
        is_open BOOLEAN DEFAULT true NOT NULL,
        open_date TIMESTAMP,
        close_date TIMESTAMP,
        announcement TEXT,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,
      'Creating esports_settings table'
    );

    await executeSQL(
      `INSERT INTO esports_settings (id, is_open, announcement)
      VALUES ('1', true, '')
      ON CONFLICT (id) DO NOTHING`,
      'Inserting default esports settings'
    );

    await executeSQL(
      `CREATE TABLE IF NOT EXISTS admin_sessions (
        id TEXT PRIMARY KEY,
        session_token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        admin_user_id TEXT,
        role TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,
      'Creating admin_sessions table'
    );

    // Create indexes
    const indexes = [
      ['idx_admin_users_username', 'admin_users', 'username'],
      ['idx_sport_groups_game_name', 'sport_groups', 'game_name'],
      ['idx_registrations_status', 'registrations', 'status'],
      ['idx_registrations_payment_method', 'registrations', 'payment_method'],
      ['idx_registrations_registration_number', 'registrations', 'registration_number'],
      ['idx_registrations_created_at', 'registrations', 'created_at'],
      ['idx_registrations_created_date', 'registrations', 'created_date'],
      ['idx_admin_sessions_token', 'admin_sessions', 'session_token'],
      ['idx_admin_sessions_expires', 'admin_sessions', 'expires_at'],
      ['idx_games_pricing_game_gender', 'games_pricing', 'game_name, gender']
    ];

    for (const [idxName, table, columns] of indexes) {
      await executeSQL(
        `CREATE INDEX IF NOT EXISTS ${idxName} ON ${table}(${columns})`,
        `Creating index: ${idxName}`
      );
    }

    // Create system_settings table (for SMTP settings)
    await executeSQL(
      `CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,
      'Creating system_settings table'
    );

    // Create inventory tables
    await executeSQL(
      `CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL DEFAULT 'general',
        quantity INTEGER NOT NULL DEFAULT 0,
        unit TEXT DEFAULT 'pcs',
        min_quantity INTEGER DEFAULT 0,
        location TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,
      'Creating inventory_items table'
    );

    await executeSQL(
      `CREATE TABLE IF NOT EXISTS inventory_movements (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        movement_type TEXT NOT NULL CHECK (movement_type IN ('add', 'remove', 'adjust', 'loan', 'return')),
        quantity INTEGER NOT NULL,
        previous_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        reason TEXT,
        performed_by TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,
      'Creating inventory_movements table'
    );

    await executeSQL(
      `CREATE TABLE IF NOT EXISTS inventory_loans (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        borrower_name TEXT NOT NULL,
        borrower_roll TEXT,
        borrower_phone TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        loan_date TIMESTAMP DEFAULT NOW() NOT NULL,
        expected_return_date TIMESTAMP,
        actual_return_date TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
        notes TEXT,
        loaned_by TEXT,
        returned_to TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,
      'Creating inventory_loans table'
    );

    // Create finance tables
    await executeSQL(
      `CREATE TABLE IF NOT EXISTS finance_records (
        id TEXT PRIMARY KEY,
        record_type TEXT NOT NULL CHECK (record_type IN ('income', 'expense', 'transfer')),
        category TEXT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        description TEXT,
        reference_id TEXT,
        reference_type TEXT,
        payment_method TEXT,
        recorded_by TEXT,
        record_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,
      'Creating finance_records table'
    );

    await executeSQL(
      `CREATE TABLE IF NOT EXISTS finance_attachments (
        id TEXT PRIMARY KEY,
        record_id TEXT NOT NULL REFERENCES finance_records(id) ON DELETE CASCADE,
        file_url TEXT NOT NULL,
        file_name TEXT,
        file_type TEXT,
        uploaded_by TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,
      'Creating finance_attachments table'
    );

    // Create additional indexes
    await executeSQL(
      `CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category)`,
      'Creating index: idx_inventory_items_category'
    );

    await executeSQL(
      `CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON inventory_movements(item_id)`,
      'Creating index: idx_inventory_movements_item_id'
    );

    await executeSQL(
      `CREATE INDEX IF NOT EXISTS idx_inventory_loans_status ON inventory_loans(status)`,
      'Creating index: idx_inventory_loans_status'
    );

    await executeSQL(
      `CREATE INDEX IF NOT EXISTS idx_inventory_loans_item_id ON inventory_loans(item_id)`,
      'Creating index: idx_inventory_loans_item_id'
    );

    await executeSQL(
      `CREATE INDEX IF NOT EXISTS idx_finance_records_type ON finance_records(record_type)`,
      'Creating index: idx_finance_records_type'
    );

    await executeSQL(
      `CREATE INDEX IF NOT EXISTS idx_finance_records_date ON finance_records(record_date)`,
      'Creating index: idx_finance_records_date'
    );

    await executeSQL(
      `CREATE INDEX IF NOT EXISTS idx_finance_attachments_record_id ON finance_attachments(record_id)`,
      'Creating index: idx_finance_attachments_record_id'
    );

    console.log('\n✅ Database initialized successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Create an admin user:');
    console.log('      node scripts/create-admin-node.js admin your-password');
    console.log('   2. Start the dev server:');
    console.log('      npm run dev');
  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error(error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

initDatabase();
