// Setup script to create Turso database tables
const { createClient } = require('@libsql/client');

async function setupDatabase() {
  const url = process.env.TURSO_URL || 'libsql://interview-criminal.aws-ap-northeast-1.turso.io';
  const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzg2NzczODAsImlkIjoiMDE5ZTFiNjAtMmYwMS03MzY3LTk1N2EtMGU5YjgzMjYyMTI0IiwicmlkIjoiZjJjMTY4MzEtNzJlNC00MDAzLWE1NjktM2Q1ZDFkNzIzNDcxIn0.IgqUenWZn_OXykbF5j9Zu5-BLhUYWuvXdICX2SrNcBcJ8jYH8fNYYcy3v7rRhnB_Sn1R5mtzotBTsdcsaPOPCw';

  console.log('Connecting to Turso:', url);

  const client = createClient({ url, authToken });

  // Create users table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      plan TEXT DEFAULT 'free',
      weekly_time_used INTEGER DEFAULT 0,
      weekly_limit INTEGER DEFAULT 600000,
      resume_limit INTEGER DEFAULT 2,
      referral_code TEXT,
      referral_earnings REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('Users table created');

  // Create resumes table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('Resumes table created');

  // Create job_details table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS job_details (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      company TEXT,
      position TEXT,
      description TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('Job details table created');

  // Create sessions table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      resume_id TEXT,
      resume_content TEXT,
      job_position TEXT,
      job_company TEXT,
      status TEXT DEFAULT 'waiting',
      interview_duration INTEGER,
      start_time TEXT,
      end_time TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('Sessions table created');

  // Create session_messages table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS session_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      question TEXT,
      answer TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('Session messages table created');

  // Create settings table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      stealth_mode INTEGER DEFAULT 1,
      auto_detect INTEGER DEFAULT 1,
      ai_provider TEXT DEFAULT 'groq',
      speech_rate REAL DEFAULT 0.9
    )
  `);
  console.log('Settings table created');

  // Create pending_payouts table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS pending_payouts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      referee_id TEXT,
      referee_name TEXT,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('Pending payouts table created');

  console.log('\n✅ Database setup complete!');
  process.exit(0);
}

setupDatabase().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
