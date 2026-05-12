// InterviewAce Backend Server
// Express server with Clerk auth, Paystack billing, and API endpoints

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { clerkMiddleware } = require('@clerk/express');
const rateLimit = require('express-rate-limit');
const Paystack = require('paystack-sdk').default;
const { createClient } = require('@libsql/client');
const crypto = require('crypto');

// Initialize Express
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['https://interviewace.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// ============ CLERK AUTH ============
// Note: In production, use @clerk/express
// For now, we'll use simple JWT verification
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || '';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';

// Simple auth middleware (replace with Clerk in production)
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  // In production, verify with Clerk
  // For now, decode base64 user ID
  try {
    req.userId = Buffer.from(token, 'base64').toString();
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ============ DATABASE (Turso) ============
const db = createClient({
  url: process.env.TURSO_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Initialize database tables
async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      name TEXT,
      subscription_tier TEXT DEFAULT 'free',
      weekly_time_used INTEGER DEFAULT 0,
      weekly_reset_at TEXT,
      referral_code TEXT UNIQUE,
      referred_by TEXT,
      referral_earnings REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      referrer_id TEXT,
      referee_id TEXT,
      status TEXT DEFAULT 'pending',
      reward_type TEXT,
      reward_amount REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referrer_id) REFERENCES users(id),
      FOREIGN KEY (referee_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      platform TEXT,
      duration INTEGER,
      questions_answered INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('Database initialized');
}

// ============ PAYSTACK ============
const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY || 'pk_test_xxx');

// ============ ROUTES ============

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name, referralCode } = req.body;

    // Generate unique ID and referral code
    const userId = crypto.randomUUID();
    const userReferralCode = crypto.randomBytes(4).toString('hex');

    // Check referral
    let referredBy = null;
    if (referralCode) {
      const refResult = await db.execute({
        sql: 'SELECT id FROM users WHERE referral_code = ?',
        args: [referralCode]
      });
      if (refResult.rows.length > 0) {
        referredBy = refResult.rows[0].id;
      }
    }

    // Create user
    await db.execute({
      sql: `INSERT INTO users (id, email, name, referral_code, referred_by)
            VALUES (?, ?, ?, ?, ?)`,
      args: [userId, email, name, userReferralCode, referredBy]
    });

    // If referred, create referral record
    if (referredBy) {
      const referralId = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO referrals (id, referrer_id, referee_id, reward_type, reward_amount)
              VALUES (?, ?, ?, 'credit', 5.00)`,
        args: [referralId, referredBy, userId]
      });
    }

    res.json({
      userId,
      referralCode: userReferralCode,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;

    const result = await db.execute({
      sql: 'SELECT id, email, name, subscription_tier FROM users WHERE email = ?',
      args: [email]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    // In production, create proper JWT with Clerk
    const token = Buffer.from(user.id).toString('base64');

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscription_tier
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- User Routes ---
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [req.userId]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscription_tier,
      weeklyTimeUsed: user.weekly_time_used,
      referralCode: user.referral_code,
      referralEarnings: user.referral_earnings
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// --- Billing Routes ---
app.post('/api/billing/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { plan, interval } = req.body;

    const prices = {
      starter: { monthly: 19.99, yearly: 149.99 },
      pro: { monthly: 34.99, yearly: 299.99 }
    };

    if (!prices[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const amount = prices[plan][interval] * 100; // Convert to kobo/khapes

    const response = await paystack.transaction.initialize({
      email: req.body.email,
      amount: amount,
      currency: 'USD',
      metadata: {
        userId: req.userId,
        plan,
        interval
      }
    });

    res.json({
      authorizationUrl: response.data.authorization_url,
      reference: response.data.reference
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

app.post('/api/billing/webhook', async (req, res) => {
  try {
    const event = req.body;

    if (event.event === 'charge.success') {
      const { metadata, reference } = event.data;

      // Update user subscription
      await db.execute({
        sql: `UPDATE users SET subscription_tier = ? WHERE id = ?`,
        args: [metadata.plan, metadata.userId]
      });

      console.log(`Subscription activated: ${metadata.plan} for user ${metadata.userId}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// --- Referral Routes ---
app.get('/api/referrals', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT r.*, u.name as referee_name, u.email as referee_email
            FROM referrals r
            JOIN users u ON r.referee_id = u.id
            WHERE r.referrer_id = ?`,
      args: [req.userId]
    });

    res.json({
      referrals: result.rows,
      totalEarnings: result.rows.reduce((sum, r) => sum + (r.reward_amount || 0), 0)
    });
  } catch (error) {
    console.error('Referral fetch error:', error);
    res.status(500).json({ error: 'Failed to get referrals' });
  }
});

// --- Session Routes ---
app.post('/api/sessions', authMiddleware, async (req, res) => {
  try {
    const { platform, duration, questionsAnswered } = req.body;

    const sessionId = crypto.randomUUID();

    await db.execute({
      sql: `INSERT INTO sessions (id, user_id, platform, duration, questions_answered)
            VALUES (?, ?, ?, ?, ?)`,
      args: [sessionId, req.userId, platform, duration, questionsAnswered]
    });

    // Update weekly time
    await db.execute({
      sql: `UPDATE users SET weekly_time_used = weekly_time_used + ?
            WHERE id = ?`,
      args: [duration, req.userId]
    });

    res.json({ sessionId, success: true });
  } catch (error) {
    console.error('Session save error:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

app.get('/api/sessions', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      args: [req.userId]
    });

    res.json({ sessions: result.rows });
  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// --- AI Route (proxy to Groq) ---
app.post('/api/ai/answer', authMiddleware, async (req, res) => {
  try {
    const { question, context } = req.body;

    // Check user time limit
    const userResult = await db.execute({
      sql: 'SELECT subscription_tier, weekly_time_used FROM users WHERE id = ?',
      args: [req.userId]
    });

    const user = userResult.rows[0];

    // Check if over limit (assuming 10 min for free, 30 for starter, unlimited for pro)
    const limits = { free: 600000, starter: 1800000, pro: Infinity };
    const limit = limits[user.subscription_tier] || limits.free;

    if (user.weekly_time_used >= limit) {
      return res.status(403).json({
        error: 'Weekly time limit reached',
        upgrade: true
      });
    }

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: buildPrompt(question, context)
        }],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!groqResponse.ok) {
      throw new Error('AI service error');
    }

    const data = await groqResponse.json();
    const answer = data.choices[0].message.content.trim();

    res.json({ answer });
  } catch (error) {
    console.error('AI error:', error);
    res.status(500).json({ error: 'Failed to generate answer' });
  }
});

// Helper function to build prompt
function buildPrompt(question, context) {
  let prompt = `You are a helpful interview assistant. Give SHORT answers (2-3 sentences). Sound natural, like you're thinking and speaking. Use simple words.\n\n`;

  if (context?.jobDetails) {
    prompt += `Position: ${context.jobDetails.position || 'N/A'}\n`;
    prompt += `Company: ${context.jobDetails.company || 'N/A'}\n`;
    if (context.jobDetails.description) {
      prompt += `Job Description: ${context.jobDetails.description.substring(0, 500)}...\n`;
    }
  }

  if (context?.resume?.content) {
    prompt += `\nCandidate background:\n${context.resume.content.substring(0, 1000)}...\n`;
  }

  prompt += `\nInterview question: "${question}"\n\nGive a natural answer:`;

  return prompt;
}

// --- Admin Routes ---
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin (simplified - add proper admin check in production)
    const result = await db.execute({
      sql: `SELECT id, email, name, subscription_tier, created_at FROM users ORDER BY created_at DESC LIMIT 100`
    });

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Admin error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

app.post('/api/admin/payout', authMiddleware, async (req, res) => {
  try {
    const { referralId, action } = req.body; // action: 'approve' or 'reject'

    const referral = await db.execute({
      sql: 'SELECT * FROM referrals WHERE id = ?',
      args: [referralId]
    });

    if (referral.rows.length === 0) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    if (action === 'approve') {
      // Update referral status
      await db.execute({
        sql: `UPDATE referrals SET status = 'paid' WHERE id = ?`,
        args: [referralId]
      });

      // Update referrer earnings (could trigger Paystack payout here)
      await db.execute({
        sql: `UPDATE users SET referral_earnings = referral_earnings + ? WHERE id = ?`,
        args: [referral.rows[0].reward_amount, referral.rows[0].referrer_id]
      });

      res.json({ success: true, message: 'Payout approved' });
    } else {
      await db.execute({
        sql: `UPDATE referrals SET status = 'rejected' WHERE id = ?`,
        args: [referralId]
      });
      res.json({ success: true, message: 'Payout rejected' });
    }
  } catch (error) {
    console.error('Payout error:', error);
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`InterviewAce server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();