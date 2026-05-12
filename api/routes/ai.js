// AI routes - Groq integration with Clerk auth
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

module.exports = {
  // Generate answer
  answer: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      const user = findUserByClerkId(clerkUserId);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized - user not found. Please sign in again.' });
      }

      const { question, context } = req.body;

      if (!question) {
        return res.status(400).json({ error: 'Question required' });
      }

      // Check time limit
      const limits = { free: 600000, starter: 1800000, pro: Infinity };
      const limit = limits[user.plan] || limits.free;

      if (limit !== Infinity && (user.weeklyTimeUsed || 0) >= limit) {
        return res.status(403).json({
          error: 'Weekly time limit reached',
          upgrade: true,
          currentPlan: user.plan
        });
      }

      // Build prompt
      const prompt = buildPrompt(question, context || {
        resume: user.resumes?.[0],
        jobDetails: user.jobDetails
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
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('Groq API error:', err);
        throw new Error('AI service error');
      }

      const data = await response.json();
      let answer = data.choices[0].message.content.trim();

      // Clean answer
      answer = answer.replace(/^[""]|[""]$/g, '');

      // Update time used
      user.weeklyTimeUsed = (user.weeklyTimeUsed || 0) + 5000; // ~5 sec per answer

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

      const prompt = `You are a coding interview assistant. The candidate is being asked to solve a coding problem.

Problem: ${problem || 'Not specified'}
Language: ${language || 'Not specified'}
Code shown: ${code || 'No code shown yet'}

Provide a helpful response with:
1. Approach explanation (1-2 sentences)
2. Code solution if needed
3. Complexity analysis

Keep responses concise and focused on helping the candidate understand the solution.
`;

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
          max_tokens: 500
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
  let prompt = `You are a helpful interview assistant helping someone during a job interview.

RULES:
- Keep answers SHORT - 2 to 3 sentences maximum
- Sound natural, like you're thinking and speaking
- Use simple words, avoid complex jargon
- Don't sound like you're reading a script

`;

  if (context?.jobDetails) {
    prompt += `\nPOSITION: ${context.jobDetails.position || 'N/A'}\n`;
    prompt += `COMPANY: ${context.jobDetails.company || 'N/A'}\n`;
    if (context.jobDetails.description) {
      prompt += `JOB DESCRIPTION: ${context.jobDetails.description.substring(0, 500)}...\n`;
    }
  }

  if (context?.resume?.content) {
    prompt += `\nCANDIDATE BACKGROUND:\n${context.resume.content.substring(0, 1000)}...\n`;
  }

  prompt += `\nINTERVIEW QUESTION: "${question}"\n\n`;
  prompt += `Give a natural, conversational answer (2-3 sentences max):`;

  return prompt;
}
