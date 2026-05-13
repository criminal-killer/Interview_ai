// Clerk webhook handler and user routes - with Turso database
const crypto = require('crypto');
const { createClient } = require('@libsql/client');

const turso = process.env.TURSO_URL ? createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
}) : null;

// Plan limits
const RESUME_LIMITS = {
  free: 2,
  starter: 5,
  pro: 12,
  enterprise: Infinity
};

const TIME_LIMITS = {
  free: 600000,
  starter: 1800000,
  pro: Infinity,
  enterprise: Infinity
};

// DB Helper functions
async function getUserByClerkId(clerkId) {
  if (!turso) return null;
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [clerkId]
    });
    return result.rows[0] || null;
  } catch (e) {
    console.error('getUserByClerkId error:', e);
    return null;
  }
}

async function getUserByEmail(email) {
  if (!turso) return null;
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });
    return result.rows[0] || null;
  } catch (e) {
    console.error('getUserByEmail error:', e);
    return null;
  }
}

async function createUser(userData) {
  if (!turso) return null;
  try {
    const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    await turso.execute({
      sql: `INSERT INTO users (id, email, name, plan, weekly_time_used, weekly_limit, resume_limit, referral_code, referral_earnings, created_at)
            VALUES (?, ?, ?, 'free', 0, 600000, 2, ?, 0, ?)`,
      args: [userData.id, userData.email, userData.name, referralCode, new Date().toISOString()]
    });
    return { ...userData, plan: 'free', referral_code: referralCode };
  } catch (e) {
    console.error('createUser error:', e);
    return null;
  }
}

async function getResumes(userId) {
  if (!turso) return [];
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC',
      args: [userId]
    });
    return result.rows.map(r => ({
      id: r.id,
      name: r.name,
      content: r.content,
      createdAt: r.created_at
    }));
  } catch (e) {
    console.error('getResumes error:', e);
    return [];
  }
}

async function addResume(userId, name, content) {
  if (!turso) return null;
  try {
    const id = crypto.randomUUID();
    await turso.execute({
      sql: 'INSERT INTO resumes (id, user_id, name, content, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [id, userId, name, content, new Date().toISOString()]
    });
    return { id, name, content, createdAt: new Date().toISOString() };
  } catch (e) {
    console.error('addResume error:', e);
    return null;
  }
}

async function deleteResume(userId, resumeId) {
  if (!turso) return false;
  try {
    await turso.execute({
      sql: 'DELETE FROM resumes WHERE id = ? AND user_id = ?',
      args: [resumeId, userId]
    });
    return true;
  } catch (e) {
    console.error('deleteResume error:', e);
    return false;
  }
}

async function getJobDetails(userId) {
  if (!turso) return null;
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM job_details WHERE user_id = ?',
      args: [userId]
    });
    return result.rows[0] || null;
  } catch (e) {
    console.error('getJobDetails error:', e);
    return null;
  }
}

async function saveJobDetails(userId, company, position, description) {
  if (!turso) return null;
  try {
    const existing = await getJobDetails(userId);
    if (existing) {
      await turso.execute({
        sql: 'UPDATE job_details SET company = ?, position = ?, description = ?, updated_at = ? WHERE user_id = ?',
        args: [company, position, description, new Date().toISOString(), userId]
      });
      return { company, position, description };
    } else {
      const id = crypto.randomUUID();
      await turso.execute({
        sql: 'INSERT INTO job_details (id, user_id, company, position, description, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [id, userId, company, position, description, new Date().toISOString()]
      });
      return { company, position, description };
    }
  } catch (e) {
    console.error('saveJobDetails error:', e);
    return null;
  }
}

module.exports = {
  // Handle Clerk webhooks
  webhook: async (req, res) => {
    try {
      if (!turso) {
        return res.status(503).json({ error: 'Database not configured' });
      }

      const { type, data } = req.body;

      switch (type) {
        case 'user.created': {
          const { id, email_addresses, first_name, last_name } = data;
          const primaryEmail = email_addresses?.find(e => e.id === data.primary_email_address_id);

          if (!primaryEmail) {
            return res.status(400).json({ error: 'No email found' });
          }

          const email = primaryEmail.email_address;
          const name = first_name || last_name ? `${first_name || ''} ${last_name || ''}`.trim() : email.split('@')[0];

          const existingUser = await getUserByEmail(email);
          if (existingUser) {
            await turso.execute({
              sql: 'UPDATE users SET id = ? WHERE email = ?',
              args: [id, email]
            });
            return res.json({ success: true, message: 'User updated' });
          }

          await createUser({ id, email, name });
          console.log(`User created via webhook: ${email}`);
          res.json({ success: true, message: 'User created' });
          break;
        }

        case 'user.deleted': {
          const { id } = data;
          await turso.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
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
      const userEmail = req.headers['x-user-email'];

      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized', isAdmin: false });
      }

      const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
      const emailToCheck = (userEmail || '').toLowerCase();
      let isAdmin = adminEmails.includes(emailToCheck);

      let user = null;
      if (!isAdmin && turso) {
        const result = await turso.execute({
          sql: 'SELECT * FROM users WHERE id = ?',
          args: [clerkUserId]
        });
        if (result.rows[0]) {
          user = result.rows[0];
          if (user.plan === 'enterprise') isAdmin = true;
        }
      }

      res.json({
        isAdmin,
        user: user ? { id: user.id, email: user.email, name: user.name, plan: user.plan } : null
      });
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

      const user = await getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found. Please sign out and sign back in.' });
      }

      const resumes = await getResumes(clerkUserId);
      const job = await getJobDetails(clerkUserId);

      const plan = user.plan || 'free';
      const resumeLimit = RESUME_LIMITS[plan] || 2;
      const timeLimit = TIME_LIMITS[plan] || 600000;

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        plan: plan,
        weeklyTimeUsed: user.weekly_time_used || 0,
        weeklyLimit: timeLimit,
        resumeLimit: resumeLimit,
        resumes: resumes,
        jobDetails: job ? { company: job.company, position: job.position, description: job.description } : {},
        settings: { stealthMode: true, autoDetect: true, aiProvider: 'groq', speechRate: 0.9 },
        referralCode: user.referral_code,
        referralEarnings: user.referral_earnings || 0
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

      const user = await getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updates = req.body;

      if (updates.name && turso) {
        await turso.execute({ sql: 'UPDATE users SET name = ? WHERE id = ?', args: [updates.name, clerkUserId] });
      }
      if (updates.plan && turso) {
        await turso.execute({ sql: 'UPDATE users SET plan = ? WHERE id = ?', args: [updates.plan, clerkUserId] });
      }
      if (updates.jobDetails) {
        await saveJobDetails(clerkUserId, updates.jobDetails.company || '', updates.jobDetails.position || '', updates.jobDetails.description || '');
      }

      res.json({ success: true });
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

      const user = await getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const resumes = await getResumes(clerkUserId);
      const plan = user.plan || 'free';
      const resumeLimit = RESUME_LIMITS[plan] || 2;

      res.json({
        resumes: resumes,
        resumeLimit: resumeLimit,
        canAddMore: resumes.length < resumeLimit || resumeLimit === Infinity
      });
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

      const user = await getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found. Please sign out and sign back in.' });
      }

      const { name, content } = req.body;
      if (!name || !content) {
        return res.status(400).json({ error: 'Name and content required' });
      }

      const resumes = await getResumes(clerkUserId);
      const plan = user.plan || 'free';
      const resumeLimit = RESUME_LIMITS[plan] || 2;

      if (resumes.length >= resumeLimit && resumeLimit !== Infinity) {
        return res.status(403).json({
          error: 'Resume limit reached',
          limit: resumeLimit,
          current: resumes.length,
          upgrade: true
        });
      }

      const resume = await addResume(clerkUserId, name.trim(), content);
      if (!resume) {
        return res.status(500).json({ error: 'Failed to add resume' });
      }

      console.log(`Resume added for ${user.email}: ${resume.name}`);

      res.status(201).json({
        resume,
        resumeLimit,
        canAddMore: (resumes.length + 1 < resumeLimit) || resumeLimit === Infinity
      });
    } catch (error) {
      console.error('Add resume error:', error);
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

      const user = await getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { id } = req.params;
      await deleteResume(clerkUserId, id);

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

      const job = await getJobDetails(clerkUserId);
      res.json({ jobs: job ? [job] : [] });
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

      const user = await getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { company, position, description } = req.body;
      const jobDetails = await saveJobDetails(
        clerkUserId,
        company?.trim() || '',
        position?.trim() || '',
        description?.trim() || ''
      );

      console.log(`Job details updated for ${user.email}`);

      res.status(201).json({ jobDetails });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add job' });
    }
  },

  // Session methods (placeholder)
  createSession: async (req, res) => {
    res.status(500).json({ error: 'Sessions not yet implemented' });
  },
  getActiveSession: async (req, res) => {
    res.json({ session: null });
  },
  startSession: async (req, res) => {
    res.status(500).json({ error: 'Sessions not yet implemented' });
  },
  addMessage: async (req, res) => {
    res.status(500).json({ error: 'Sessions not yet implemented' });
  },
  endSession: async (req, res) => {
    res.status(500).json({ error: 'Sessions not yet implemented' });
  },
  getSessions: async (req, res) => {
    res.json({ sessions: [] });
  },

  // Get referrals
  getReferrals: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await getUserByClerkId(clerkUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        referralCode: user.referral_code,
        referralEarnings: user.referral_earnings || 0,
        referrals: []
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get referrals' });
    }
  }
};