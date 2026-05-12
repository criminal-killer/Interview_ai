// Admin routes
const { usersStore } = require('../store');

// Use shared store
const users = usersStore;

module.exports = {
  // Get admin stats
  stats: async (req, res) => {
    try {
      let totalUsers = 0;
      let subscribers = 0;
      let pendingPayouts = 0;
      let pendingPayoutCount = 0;
      let monthlyRevenue = 0;

      for (const [email, user] of users) {
        totalUsers++;
        if (user.plan && user.plan !== 'free') {
          subscribers++;
        }
        if (user.pendingPayouts) {
          for (const payout of user.pendingPayouts) {
            if (payout.status === 'pending') {
              pendingPayoutCount++;
              pendingPayouts += payout.amount;
            }
          }
        }
      }

      res.json({
        totalUsers,
        subscribers,
        pendingPayouts,
        pendingPayoutCount,
        monthlyRevenue,
        newUsersThisWeek: Math.floor(totalUsers * 0.1),
        newSubsThisWeek: Math.floor(subscribers * 0.15),
        revenueGrowth: 12
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  },

  // Get all users
  users: async (req, res) => {
    try {
      const userList = [];

      for (const [email, user] of users) {
        userList.push({
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan || 'free',
          referralCode: user.referralCode,
          referralEarnings: user.referralEarnings || 0,
          createdAt: user.createdAt
        });
      }

      res.json({ users: userList });
    } catch (error) {
      console.error('Users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  },

  // Get all payouts
  payouts: async (req, res) => {
    try {
      const payouts = [];

      for (const [email, user] of users) {
        if (user.pendingPayouts) {
          for (const payout of user.pendingPayouts) {
            payouts.push({
              id: payout.id,
              referrerId: user.id,
              referrerName: user.name,
              refereeId: payout.refereeId,
              refereeName: payout.refereeName || 'N/A',
              amount: payout.amount,
              status: payout.status,
              createdAt: payout.createdAt
            });
          }
        }
      }

      res.json({ payouts });
    } catch (error) {
      console.error('Payouts error:', error);
      res.status(500).json({ error: 'Failed to get payouts' });
    }
  },

  // Get all sessions
  sessions: async (req, res) => {
    try {
      const sessions = [];

      for (const [email, user] of users) {
        if (user.sessions) {
          for (const session of user.sessions) {
            sessions.push({
              id: session.id,
              userId: user.id,
              userName: user.name,
              platform: session.platform,
              duration: session.duration,
              questionsAnswered: session.questionsAnswered,
              createdAt: session.createdAt
            });
          }
        }
      }

      sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({ sessions: sessions.slice(0, 100) });
    } catch (error) {
      console.error('Sessions error:', error);
      res.status(500).json({ error: 'Failed to get sessions' });
    }
  },

  // Process payout
  payout: async (req, res) => {
    try {
      const { payoutId, action } = req.body;

      for (const [email, user] of users) {
        if (user.pendingPayouts) {
          const payoutIndex = user.pendingPayouts.findIndex(p => p.id === payoutId);
          if (payoutIndex !== -1) {
            const payout = user.pendingPayouts[payoutIndex];

            if (action === 'approve') {
              payout.status = 'paid';
              user.referralEarnings = (user.referralEarnings || 0) + payout.amount;
              res.json({ success: true, message: 'Payout approved', payout });
            } else if (action === 'reject') {
              payout.status = 'rejected';
              res.json({ success: true, message: 'Payout rejected', payout });
            } else {
              res.status(400).json({ error: 'Invalid action' });
            }
            return;
          }
        }
      }

      res.status(404).json({ error: 'Payout not found' });
    } catch (error) {
      console.error('Payout action error:', error);
      res.status(500).json({ error: 'Failed to process payout' });
    }
  },

  // Update user plan
  updateUserPlan: async (req, res) => {
    try {
      const { userId, plan } = req.body;

      for (const [email, user] of users) {
        if (user.id === userId) {
          user.plan = plan;
          res.json({ success: true, user: { id: user.id, plan: user.plan } });
          return;
        }
      }

      res.status(404).json({ error: 'User not found' });
    } catch (error) {
      console.error('Update plan error:', error);
      res.status(500).json({ error: 'Failed to update user plan' });
    }
  }
};