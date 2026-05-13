// AI routes - Groq integration with session context
const { usersStore } = require('../store');

// Find user by Clerk ID
function findUserByClerkId(clerkUserId) {
  if (!clerkUserId) return null;
  for (const [email, user] of usersStore) {
    if (user.id === clerkUserId) {
      return user;
    }
  }
  return null;
}

// Find active session for user
function getActiveSession(user) {
  if (!user.sessions) return null;
  return user.sessions.find(s => s.status === 'active' || s.status === 'waiting');
}

module.exports = {
  // Generate answer with session context
  answer: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      const user = findUserByClerkId(clerkUserId);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized - user not found' });
      }

      const { question, sessionId } = req.body;

      if (!question) {
        return res.status(400).json({ error: 'Question required' });
      }

      // Get session context if provided
      let resumeContent = '';
      let jobDetails = null;

      if (sessionId) {
        const session = (user.sessions || []).find(s => s.id === sessionId);
        if (session) {
          resumeContent = session.resumeContent || '';
          jobDetails = session.jobDetails || null;
        }
      }

      // Fallback to user's default resume/job if no session
      if (!resumeContent && user.resumes?.[0]) {
        resumeContent = user.resumes[0].content;
      }
      if (!jobDetails && user.jobDetails) {
        jobDetails = user.jobDetails;
      }

      // Check time limit
      const limits = { free: 600000, starter: 1800000, pro: Infinity, enterprise: Infinity };
      const limit = limits[user.plan] || limits.free;

      if (limit !== Infinity && (user.weeklyTimeUsed || 0) >= limit) {
        return res.status(403).json({
          error: 'Weekly time limit reached',
          upgrade: true,
          currentPlan: user.plan
        });
      }

      // Build prompt
      const prompt = buildPrompt(question, {
        resume: resumeContent,
        jobDetails: jobDetails
      });

      // Call Groq API
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        return res.status(500).json({ error: 'AI not configured on server' });
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful interview assistant. Keep responses SHORT (1-2 sentences), conversational, and natural. Like you are thinking and speaking aloud, NOT reading from a script.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('Groq API error:', err);
        throw new Error('AI service error');
      }

      const data = await response.json();
      let answer = data.choices[0].message.content.trim();

      // Clean answer - remove quotes and make it conversational
      answer = answer.replace(/^[""]|[""]$/g, '');

      // Add to session messages if session provided
      if (sessionId) {
        const session = (user.sessions || []).find(s => s.id === sessionId);
        if (session) {
          session.messages = session.messages || [];
          session.messages.push({
            id: crypto.randomUUID(),
            question,
            answer,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Update time used (estimate 5 seconds per answer)
      user.weeklyTimeUsed = (user.weeklyTimeUsed || 0) + 5000;

      res.json({
        answer,
        timeRemaining: limit === Infinity ? Infinity : limit - user.weeklyTimeUsed
      });
    } catch (error) {
      console.error('AI error:', error);
      res.status(500).json({ error: 'Failed to generate answer: ' + error.message });
    }
  },

  // Generate code solution
  codeSolution: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      const user = findUserByClerkId(clerkUserId);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { code, language, problem } = req.body;

      const prompt = `You are a coding interview assistant.

Problem: ${problem || 'Not specified'}
Language: ${language || 'Not specified'}
Code shown: ${code || 'No code shown yet'}

Provide:
1. Brief approach (1 sentence)
2. Simple solution
3. Time complexity

Keep it concise and conversational.`;

      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        return res.status(500).json({ error: 'AI not configured' });
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 400
        })
      });

      if (!response.ok) {
        throw new Error('AI service error');
      }

      const data = await response.json();
      const solution = data.choices[0].message.content;

      res.json({ solution });
    } catch (error) {
      console.error('Code solution error:', error);
      res.status(500).json({ error: 'Failed to generate solution' });
    }
  }
};

// Build prompt function
function buildPrompt(question, context) {
  let prompt = `Interview question: "${question}"\n\n`;

  if (context?.jobDetails) {
    prompt += `Position: ${context.jobDetails.position || 'Not specified'}\n`;
    prompt += `Company: ${context.jobDetails.company || 'Not specified'}\n`;
    if (context.jobDetails.description) {
      prompt += `Job context: ${context.jobDetails.description.substring(0, 300)}\n`;
    }
  }

  if (context?.resume) {
    prompt += `\nMy background: ${context.resume.substring(0, 500)}\n`;
  }

  prompt += `\nGive me a brief conversational answer (1-2 sentences, like I am thinking and speaking, not reading):`;

  return prompt;
}

// Need crypto for message ID
const crypto = require('crypto');