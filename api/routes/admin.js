// Admin routes - with Turso DB and Clerk auth verification
const { createClient } = require('@libsql/client');

const turso = process.env.TURSO_URL ? createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
}) : null;

// Verify admin access - checks against ADMIN_EMAILS from env
async function verifyAdmin(clerkUserId, userEmail) {
  if (!clerkUserId) return { isAdmin: false, error: 'No user ID' };

  // Check if user's email is in ADMIN_EMAILS
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const emailToCheck = (userEmail || '').toLowerCase();

  // Allow if email is in ADMIN_EMAILS
  if (adminEmails.includes(emailToCheck)) {
    return { isAdmin: true, email: userEmail };
  }

  // Also check in database if user exists and has enterprise plan
  if (turso) {
    try {
      const result = await turso.execute({
        sql: 'SELECT * FROM users WHERE id = ?',
        args: [clerkUserId]
      });
      if (result.rows[0] && result.rows[0].plan === 'enterprise') {
        return { isAdmin: true, user: result.rows[0] };
      }
    } catch (e) {
      console.error('Admin verify error:', e);
    }
  }

  return { isAdmin: false, error: 'Access denied' };
}

// Get all users
async function getUsers() {
  if (!turso) return [];
  try {
    const result = await turso.execute({ sql: 'SELECT * FROM users ORDER BY created_at DESC', args: [] });
    return result.rows;
  } catch (e) {
    console.error('getUsers error:', e);
    return [];
  }
}

// Get stats
async function getStats() {
  if (!turso) return { totalUsers: 0, subscribers: 0, pendingPayouts: 0 };
  try {
    const users = await getUsers();
    const subscribers = users.filter(u => ['starter', 'pro', 'enterprise'].includes(u.plan)).length;

    return {
      totalUsers: users.length,
      subscribers,
      pendingPayouts: 0,
      monthlyRevenue: 0
    };
  } catch (e) {
    console.error('getStats error:', e);
    return { totalUsers: 0, subscribers: 0, pendingPayouts: 0 };
  }
}

module.exports = {
  // Get admin stats
  stats: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      const userEmail = req.headers['x-user-email'];

      const { isAdmin, error } = await verifyAdmin(clerkUserId, userEmail);

      if (!isAdmin) {
        return res.status(403).json({ error: error || 'Admin access required' });
      }

      const stats = await getStats();

      res.json({
        totalUsers: stats.totalUsers,
        subscribers: stats.subscribers,
        pendingPayouts: stats.pendingPayouts,
        monthlyRevenue: stats.monthlyRevenue,
        newUsersThisWeek: 0,
        newSubsThisWeek: 0,
        pendingPayoutCount: 0,
        revenueGrowth: 0
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  },

  // Get all users
  users: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      const userEmail = req.headers['x-user-email'];

      const { isAdmin, error } = await verifyAdmin(clerkUserId, userEmail);

      if (!isAdmin) {
        return res.status(403).json({ error: error || 'Admin access required' });
      }

      const users = await getUsers();

      res.json({
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          plan: u.plan,
          referralCode: u.referral_code,
          referralEarnings: u.referral_earnings,
          createdAt: u.created_at
        }))
      });
    } catch (error) {
      console.error('Users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  },

  // Get payouts (placeholder)
  payouts: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      const userEmail = req.headers['x-user-email'];

      const { isAdmin, error } = await verifyAdmin(clerkUserId, userEmail);

      if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      res.json({ payouts: [] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get payouts' });
    }
  },

  // Get sessions (placeholder)
  sessions: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      const userEmail = req.headers['x-user-email'];

      const { isAdmin, error } = await verifyAdmin(clerkUserId, userEmail);

      if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      res.json({ sessions: [] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get sessions' });
    }
  },

  // Process payout (placeholder)
  payout: async (req, res) => {
    res.status(500).json({ error: 'Payouts not yet implemented' });
  },

  // Update user plan (placeholder)
  updateUserPlan: async (req, res) => {
    res.status(500).json({ error: 'Plan updates not yet implemented' });
  }
};