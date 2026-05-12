// Blinkora AI Integration
// Supports Groq (default), OpenAI, Anthropic, Google, and OpenRouter

class AIAgent {
  constructor() {
    this.providers = {
      groq: {
        name: 'Groq',
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
        baseUrl: 'https://api.groq.com/openai/v1',
        freeTier: true
      },
      openai: {
        name: 'OpenAI',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
        baseUrl: 'https://api.openai.com/v1',
        freeTier: false
      },
      anthropic: {
        name: 'Anthropic',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
        baseUrl: 'https://api.anthropic.com/v1',
        freeTier: false
      },
      google: {
        name: 'Google',
        models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        freeTier: false
      },
      openrouter: {
        name: 'OpenRouter',
        models: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash'],
        baseUrl: 'https://openrouter.ai/api/v1',
        freeTier: false
      }
    };

    this.currentProvider = 'groq';
    this.apiKey = '';
  }

  // Configure AI agent
  configure(provider, apiKey) {
    this.currentProvider = provider;
    this.apiKey = apiKey;
  }

  // Generate answer for interview question
  async generateAnswer(question, context) {
    const prompt = this.buildPrompt(question, context);

    const response = await this.sendRequest(prompt);

    // Clean and return response
    return this.cleanResponse(response);
  }

  // Build prompt with context
  buildPrompt(question, context) {
    const { resume, jobDetails, previousQuestions = [] } = context;

    // System prompt for interview assistant
    let systemPrompt = `You are a helpful interview assistant helping someone during a job interview.

RULES:
- Keep answers SHORT - 2 to 3 sentences maximum
- Sound natural, like you're thinking and speaking
- Use simple words, avoid complex jargon
- Don't sound like you're reading a script
- If you don't know, say you need a moment to think
- Give practical, real-world examples when possible

`;

    // Add job context
    if (jobDetails) {
      systemPrompt += `\nJOB DETAILS:\n`;
      if (jobDetails.position) systemPrompt += `Position: ${jobDetails.position}\n`;
      if (jobDetails.company) systemPrompt += `Company: ${jobDetails.company}\n`;
      if (jobDetails.description) {
        // Truncate long descriptions
        const desc = jobDetails.description.length > 500
          ? jobDetails.description.substring(0, 500) + '...'
          : jobDetails.description;
        systemPrompt += `Job Description: ${desc}\n`;
      }
    }

    // Add resume context
    if (resume && resume.content) {
      systemPrompt += `\nCANDIDATE BACKGROUND:\n`;
      const content = resume.content.length > 1500
        ? resume.content.substring(0, 1500) + '...'
        : resume.content;
      systemPrompt += content + `\n`;
    }

    // Add previous questions for context
    if (previousQuestions.length > 0) {
      systemPrompt += `\nPREVIOUS QUESTIONS IN THIS INTERVIEW:\n`;
      previousQuestions.slice(-3).forEach((q, i) => {
        systemPrompt += `${i + 1}. ${q}\n`;
      });
    }

    systemPrompt += `\nCURRENT QUESTION: "${question}"\n\n`;
    systemPrompt += `Give a natural, conversational answer (2-3 sentences max):`;

    return systemPrompt;
  }

  // Send request to AI provider
  async sendRequest(prompt) {
    const provider = this.providers[this.currentProvider];

    if (!provider) {
      throw new Error('Invalid AI provider');
    }

    // Check if using default Groq without API key
    if (this.currentProvider === 'groq' && !this.apiKey) {
      // Use demo key - in production this should be server-side
      throw new Error('Please configure an API key in settings');
    }

    switch (this.currentProvider) {
      case 'groq':
      case 'openai':
        return await this.sendOpenAICompatibleRequest(provider);
      case 'anthropic':
        return await this.sendAnthropicRequest(provider);
      case 'google':
        return await this.sendGoogleRequest(provider);
      case 'openrouter':
        return await this.sendOpenRouterRequest(provider);
      default:
        throw new Error('Unsupported provider');
    }
  }

  async sendOpenAICompatibleRequest(provider) {
    const model = provider.models[0]; // Use first model by default

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API Error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async sendAnthropicRequest(provider) {
    const response = await fetch(`${provider.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.models[0],
        max_tokens: 300,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API Error: ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async sendGoogleRequest(provider) {
    const url = `${provider.baseUrl}/${provider.models[0]}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API Error: ${error}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async sendOpenRouterRequest(provider) {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://Blinkora.com',
        'X-Title': 'Blinkora'
      },
      body: JSON.stringify({
        model: provider.models[0],
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API Error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Clean response
  cleanResponse(text) {
    if (!text) return "I'm not sure about that, could you give me a moment?";

    // Remove any quotation marks at start/end
    let cleaned = text.replace(/^[""]|[""]$/g, '').trim();

    // Remove any "Answer:" prefixes
    cleaned = cleaned.replace(/^Answer:\s*/i, '');
    cleaned = cleaned.replace(/^Response:\s*/i, '');

    // Ensure it doesn't end with incomplete sentences
    if (cleaned.endsWith(',') || cleaned.endsWith('...')) {
      // Add a natural ending
      if (cleaned.endsWith(',')) {
        cleaned = cleaned.slice(0, -1) + '.';
      } else {
        cleaned = cleaned.slice(0, -3);
      }
    }

    return cleaned;
  }

  // Get available providers
  getAvailableProviders() {
    return Object.entries(this.providers).map(([key, value]) => ({
      id: key,
      name: value.name,
      models: value.models,
      freeTier: value.freeTier
    }));
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAgent;
}

// Make available globally for extension
window.AIAgent = AIAgent;
