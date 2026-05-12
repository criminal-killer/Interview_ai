// Auth routes
const crypto = require('crypto');

// Simple in-memory store (replace with Turso in production)
const users = new Map();

module.exports = {
  // Register new user
  register: async (req, res) => {
    try {
      const { email, name, password, referralCode } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      // Check if user exists
      if (users.has(email)) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Create user
      const userId = crypto.randomUUID();
      const userReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

      const user = {
        id: userId,
        email,
        name: name || email.split('@')[0],
        passwordHash: hashPassword(password),
        plan: 'free',
        weeklyTimeUsed: 0,
        referralCode: userReferralCode,
        referredBy: null,
        referralEarnings: 0,
        resumes: [],
        jobDetails: {},
        settings: {
          stealthMode: true,
          autoDetect: true,
          aiProvider: 'groq',
          customApiKey: ''
        },
        createdAt: new Date().toISOString()
      };

      // Handle referral
      if (referralCode) {
        // Find referrer (in production, search Turso DB)
        for (const [email, u] of users) {
          if (u.referralCode === referralCode) {
            user.referredBy = u.id;
            u.referralEarnings = (u.referralEarnings || 0) + 5;
            break;
          }
        }
      }

      users.set(email, user);

      // Generate token (in production, use Clerk JWT)
      const token = Buffer.from(userId).toString('base64');

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          referralCode: user.referralCode
        },
        token
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  },

  // Login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const user = users.get(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = Buffer.from(user.id).toString('base64');

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          referralCode: user.referralCode
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
};

// Password hashing
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'interviewace_salt').digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}