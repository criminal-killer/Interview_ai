// Clerk webhook handler and user routes
const crypto = require('crypto');
const { usersStore } = require('../store');

// Plan limits
const RESUME_LIMITS = {
  free: 2,
  starter: 5,
  pro: 12,
  enterprise: Infinity
};

const TIME_LIMITS = {
  free: 600000,      // 10 minutes
  starter: 1800000,  // 30 minutes
  pro: Infinity,     // Unlimited
  enterprise: Infinity
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
            weeklyLimit: 600000,
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
              speechRate: 0.9
            },
            createdAt: new Date().toISOString()
          });

          res.json({ success: true, message: 'User created' });
          break;
        }

        case 'user.deleted': {
          const { id } = data;
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

  // Verify admin access
  verifyAdmin: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized', isAdmin: false });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found', isAdmin: false });
      }

      const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
      const isAdmin = adminEmails.includes(user.email.toLowerCase()) || user.plan === 'enterprise';

      res.json({ isAdmin, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } });
    } catch (error) {
      console.error('Verify admin error:', error);
      res.status(500).json({ error: 'Failed to verify admin', isAdmin: false });
    }
  },

  // Get user profile
  getProfile: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const plan = user.plan || 'free';
      const resumeLimit = RESUME_LIMITS[plan] || 2;
      const timeLimit = TIME_LIMITS[plan] || 600000;

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        plan: plan,
        weeklyTimeUsed: user.weeklyTimeUsed || 0,
        weeklyLimit: timeLimit,
        resumeLimit: resumeLimit,
        resumes: user.resumes || [],
        jobDetails: user.jobDetails || {},
        settings: user.settings || {},
        referralCode: user.referralCode,
        referralEarnings: user.referralEarnings || 0
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

      const plan = user.plan || 'free';
      const resumeLimit = RESUME_LIMITS[plan] || 2;

      res.json({
        resumes: user.resumes || [],
        resumeLimit: resumeLimit,
        canAddMore: (user.resumes || []).length < resumeLimit || resumeLimit === Infinity
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get resumes' });
    }
  },

  // Add resume (with plan limit)
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

      const { name, content } = req.body;
      const plan = user.plan || 'free';
      const resumeLimit = RESUME_LIMITS[plan] || 2;
      const currentCount = (user.resumes || []).length;

      // Check limit
      if (currentCount >= resumeLimit && resumeLimit !== Infinity) {
        return res.status(403).json({
          error: 'Resume limit reached',
          limit: resumeLimit,
          current: currentCount,
          upgrade: true
        });
      }

      const resume = {
        id: crypto.randomUUID(),
        name: name || 'Resume',
        content: content || '',
        createdAt: new Date().toISOString()
      };

      user.resumes = user.resumes || [];
      user.resumes.push(resume);

      res.status(201).json({
        resume,
        resumeLimit,
        canAddMore: (user.resumes.length < resumeLimit) || resumeLimit === Infinity
      });
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

  // Create session
  createSession: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { resumeId, interviewDuration } = req.body;

      // Get selected resume
      const selectedResume = (user.resumes || []).find(r => r.id === resumeId);
      if (!selectedResume) {
        return res.status(400).json({ error: 'Please select a resume' });
      }

      // Check time limit
      const plan = user.plan || 'free';
      const timeLimit = TIME_LIMITS[plan] || 600000;
      const timeUsed = user.weeklyTimeUsed || 0;

      if (timeLimit !== Infinity && timeUsed >= timeLimit) {
        return res.status(403).json({
          error: 'Weekly time limit reached',
          upgrade: true,
          timeUsed,
          timeLimit
        });
      }

      // Create session
      const session = {
        id: crypto.randomUUID(),
        resumeId: selectedResume.id,
        resumeName: selectedResume.name,
        resumeContent: selectedResume.content,
        jobDetails: user.jobDetails || null,
        interviewDuration: interviewDuration || null,
        status: 'waiting', // waiting, active, completed
        messages: [],
        startTime: null,
        endTime: null,
        createdAt: new Date().toISOString()
      };

      user.sessions = user.sessions || [];
      user.sessions.push(session);

      res.status(201).json({ session });
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  },

  // Get active session
  getActiveSession: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get most recent session that's not completed
      const activeSession = (user.sessions || [])
        .filter(s => s.status !== 'completed')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      if (!activeSession) {
        return res.json({ session: null });
      }

      res.json({ session: activeSession });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get session' });
    }
  },

  // Start session (when interview begins)
  startSession: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { sessionId } = req.body;

      const session = (user.sessions || []).find(s => s.id === sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      session.status = 'active';
      session.startTime = new Date().toISOString();

      res.json({ session });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start session' });
    }
  },

  // Add message to session
  addMessage: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { sessionId, question, answer } = req.body;

      const session = (user.sessions || []).find(s => s.id === sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const message = {
        id: crypto.randomUUID(),
        question: question || '',
        answer: answer || '',
        timestamp: new Date().toISOString()
      };

      session.messages = session.messages || [];
      session.messages.push(message);

      // Update time used (estimate 5 seconds per question)
      user.weeklyTimeUsed = (user.weeklyTimeUsed || 0) + 5000;

      res.json({ message });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add message' });
    }
  },

  // End session
  endSession: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = findUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { sessionId } = req.body;

      const session = (user.sessions || []).find(s => s.id === sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      session.status = 'completed';
      session.endTime = new Date().toISOString();

      res.json({ session });
    } catch (error) {
      res.status(500).json({ error: 'Failed to end session' });
    }
  },

  // Get sessions history
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
  }
};
