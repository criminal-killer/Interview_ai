// User routes
const crypto = require('crypto');
const { getUserFromToken } = require('./auth');

// In-memory store (same as auth.js - in production use Turso)
const users = new Map();

module.exports = {
  // Get user profile
  profile: async (req, res) => {
    try {
      const userId = req.headers.authorization?.split(' ')[1];
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Decode user ID
      const decodedId = Buffer.from(userId, 'base64').toString();

      // Find user by ID
      let foundUser = null;
      for (const [email, user] of users) {
        if (user.id === decodedId) {
          foundUser = user;
          break;
        }
      }

      if (!foundUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        plan: foundUser.plan,
        weeklyTimeUsed: foundUser.weeklyTimeUsed,
        referralCode: foundUser.referralCode,
        referralEarnings: foundUser.referralEarnings,
        resumes: foundUser.resumes,
        jobDetails: foundUser.jobDetails,
        settings: foundUser.settings
      });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  },

  // Update profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.headers.authorization?.split(' ')[1];
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const decodedId = Buffer.from(userId, 'base64').toString();
      const updates = req.body;

      let foundUser = null;
      for (const [email, user] of users) {
        if (user.id === decodedId) {
          foundUser = user;
          break;
        }
      }

      if (!foundUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Apply updates
      if (updates.name) foundUser.name = updates.name;
      if (updates.jobDetails) foundUser.jobDetails = { ...foundUser.jobDetails, ...updates.jobDetails };
      if (updates.settings) foundUser.settings = { ...foundUser.settings, ...updates.settings };
      if (updates.plan) foundUser.plan = updates.plan;

      res.json({ success: true, user: foundUser });
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  // Get resumes
  getResumes: async (req, res) => {
    try {
      const user = getUserFromRequest(req, users);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      res.json({ resumes: user.resumes || [] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get resumes' });
    }
  },

  // Add resume
  addResume: async (req, res) => {
    try {
      const user = getUserFromRequest(req, users);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { name, content, label } = req.body;

      const resume = {
        id: crypto.randomUUID(),
        name: name || 'Resume',
        content: content || '',
        label: label || 'Default',
        createdAt: new Date().toISOString()
      };

      user.resumes = user.resumes || [];
      user.resumes.push(resume);

      res.status(201).json({ resume });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add resume' });
    }
  },

  // Delete resume
  deleteResume: async (req, res) => {
    try {
      const user = getUserFromRequest(req, users);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      user.resumes = (user.resumes || []).filter(r => r.id !== id);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete resume' });
    }
  },

  // Get jobs
  getJobs: async (req, res) => {
    try {
      const user = getUserFromRequest(req, users);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      res.json({ jobs: user.jobDetails ? [user.jobDetails] : [] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get jobs' });
    }
  },

  // Add job
  addJob: async (req, res) => {
    try {
      const user = getUserFromRequest(req, users);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { company, position, description } = req.body;

      user.jobDetails = { company, position, description, updatedAt: new Date().toISOString() };

      res.status(201).json({ jobDetails: user.jobDetails });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add job' });
    }
  },

  // Get referrals
  getReferrals: async (req, res) => {
    try {
      const user = getUserFromRequest(req, users);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      res.json({
        referralCode: user.referralCode,
        referralEarnings: user.referralEarnings || 0,
        referrals: [] // In production, query DB for referrals
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get referrals' });
    }
  },

  // Save session
  saveSession: async (req, res) => {
    try {
      const user = getUserFromRequest(req, users);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { platform, duration, questionsAnswered } = req.body;

      const session = {
        id: crypto.randomUUID(),
        platform,
        duration,
        questionsAnswered,
        createdAt: new Date().toISOString()
      };

      // Update weekly time
      user.weeklyTimeUsed = (user.weeklyTimeUsed || 0) + (duration || 0);

      res.status(201).json({ sessionId: session.id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save session' });
    }
  },

  // Get sessions
  getSessions: async (req, res) => {
    try {
      const user = getUserFromRequest(req, users);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      res.json({ sessions: [] }); // In production, query DB
    } catch (error) {
      res.status(500).json({ error: 'Failed to get sessions' });
    }
  }
};

// Helper function
function getUserFromRequest(req, users) {
  const userId = req.headers.authorization?.split(' ')[1];
  if (!userId) return null;

  const decodedId = Buffer.from(userId, 'base64').toString();

  for (const [email, user] of users) {
    if (user.id === decodedId) return user;
  }
  return null;
}