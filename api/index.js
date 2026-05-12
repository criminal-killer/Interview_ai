// InterviewAce API - Vercel Serverless
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/register', require('./routes/auth').register);
app.post('/api/auth/login', require('./routes/auth').login);

// User routes
app.get('/api/user/profile', require('./routes/user').profile);
app.put('/api/user/profile', require('./routes/user').updateProfile);

// Resume routes
app.get('/api/resumes', require('./routes/user').getResumes);
app.post('/api/resumes', require('./routes/user').addResume);
app.delete('/api/resumes/:id', require('./routes/user').deleteResume);

// Job routes
app.get('/api/jobs', require('./routes/user').getJobs);
app.post('/api/jobs', require('./routes/user').addJob);

// AI routes
app.post('/api/ai/answer', require('./routes/ai').answer);
app.post('/api/ai/code-solution', require('./routes/ai').codeSolution);

// Billing routes
app.post('/api/billing/create-checkout', require('./routes/billing').createCheckout);
app.post('/api/billing/webhook', require('./routes/billing').webhook);

// Referral routes
app.get('/api/referrals', require('./routes/user').getReferrals);

// Sessions routes
app.post('/api/sessions', require('./routes/user').saveSession);
app.get('/api/sessions', require('./routes/user').getSessions);

// Admin routes
app.get('/api/admin/stats', require('./routes/admin').stats);
app.get('/api/admin/users', require('./routes/admin').users);
app.get('/api/admin/payouts', require('./routes/admin').payouts);
app.get('/api/admin/sessions', require('./routes/admin').sessions);
app.post('/api/admin/payout', require('./routes/admin').payout);
app.put('/api/admin/users/:id/plan', require('./routes/admin').updateUserPlan);

// Error handling
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export for Vercel
module.exports = app;
module.exports.handler = serverless(app);