// Clerk webhook handler and user routes
const crypto = require('crypto');
const { usersStore } = require('../store');

module.exports = {
  // Handle Clerk webhooks (user creation, deletion, etc.)
  webhook: async (req, res) => {
    try {
      const svix_id = req.headers['svix-id'];
      const svix_timestamp = req.headers['svix-timestamp'];
      const svix_signature = req.headers['svix-signature'];

      // Verify webhook signature
      const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
      if (webhookSecret) {
        const payload = JSON.stringify(req.body);
        const timestamp = svix_timestamp;
        const signedPayload = `${svix_id}.${timestamp}.${payload}`;
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(signedPayload)
          .digest('hex');

        const signature = svix_signature.split(' ').find(s => s.startsWith('v1='))?.slice(3);
        if (signature !== expectedSignature) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const { type, data } = req.body;

      switch (type) {
        case 'user.created': {
          const { id, email_addresses, first_name, last_name } = data;
          const primaryEmail = email_addresses.find(e => e.id === data.primary_email_address_id);

          if (!primaryEmail) {
            return res.status(400).json({ error: 'No email found' });
          }

          const email = primaryEmail.email_address;
          const name = first_name || last_name ? `${first_name || ''} ${last_name || ''}`.trim() : email.split('@')[0];

          // Check if user already exists
          if (usersStore.has(email)) {
            // Update existing user with Clerk ID
            const user = usersStore.get(email);
            user.id = id;
            return res.json({ success: true, message: 'User updated' });
          }

          // Create new user
          const userReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

          usersStore.set(email, {
            id,
            email,
            name,
            plan: 'free',
            weeklyTimeUsed: 0,
            referralCode: userReferralCode,
            referredBy: null,
            referralEarnings: 0,
            pendingPayouts: [],
            sessions: [],
            resumes: [],
            jobDetails: {},
            settings: {
              stealthMode: true,
              autoDetect: true,
              aiProvider: 'groq',
              customApiKey: ''
            },
            createdAt: new Date().toISOString()
          });

          res.json({ success: true, message: 'User created' });
          break;
        }

        case 'user.deleted': {
          const { id } = data;
          // Find and delete user by Clerk ID
          for (const [email, user] of usersStore) {
            if (user.id === id) {
              usersStore.delete(email);
              break;
            }
          }
          res.json({ success: true, message: 'User deleted' });
          break;
        }

        default:
          res.json({ received: true });
      }
    } catch (error) {
      console.error('Clerk webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },

  // Get user profile by Clerk ID (for frontend use)
  getProfile: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Find user by Clerk ID
      const user = findUserByClerkId(clerkUserId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan || 'free',
        weeklyTimeUsed: user.weeklyTimeUsed || 0,
        weeklyLimit: user.plan === 'starter' ? 1800000 : user.plan === 'pro' ? Infinity : 600000,
        referralCode: user.referralCode,
        referralEarnings: user.referralEarnings || 0,
        resumes: user.resumes || [],
        jobDetails: user.jobDetails || {},
        settings: user.settings || {}
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updates = req.body;

      // Apply updates
      if (updates.name) user.name = updates.name;
      if (updates.jobDetails) user.jobDetails = { ...user.jobDetails, ...updates.jobDetails };
      if (updates.settings) user.settings = { ...user.settings, ...updates.settings };
      if (updates.plan) user.plan = updates.plan;

      res.json({ success: true, user });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  // Get resumes
  getResumes: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ resumes: user.resumes || [] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get resumes' });
    }
  },

  // Add resume
  addResume: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

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
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

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
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ jobs: user.jobDetails ? [user.jobDetails] : [] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get jobs' });
    }
  },

  // Add job
  addJob: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

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
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        referralCode: user.referralCode,
        referralEarnings: user.referralEarnings || 0,
        referrals: []
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get referrals' });
    }
  },

  // Save session
  saveSession: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

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
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ sessions: user.sessions || [] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get sessions' });
    }
  }
};

// Helper function to find user by Clerk ID
function findUserByClerkId(clerkUserId) {
  for (const [email, user] of usersStore) {
    if (user.id === clerkUserId) {
      return user;
    }
  }
  return null;
}
