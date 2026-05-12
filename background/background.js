// InterviewAce Background Service Worker
// Handles: Speech recognition, AI responses, state management

// State
let isListening = false;
let recognition = null;
let currentSession = null;
let timeUsed = 0;
let sessionStartTime = null;

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log('InterviewAce extension installed');
  initializeStorage();
});

// Initialize storage
async function initializeStorage() {
  const result = await chrome.storage.local.get(['interviewAceState', 'weeklyReset']);
  if (!result.interviewAceState) {
    await chrome.storage.local.set({
      interviewAceState: {
        resumes: [],
        selectedResume: null,
        jobDetails: { company: '', position: '', description: '' },
        settings: { stealthMode: true, autoDetect: true, aiProvider: 'groq', customApiKey: '' },
        timeUsedThisWeek: 0,
        lastReset: new Date().toISOString()
      }
    });
  }
}

// Message handlers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received:', message.type);

  switch (message.type) {
    case 'START_LISTENING':
      startListening();
      sendResponse({ success: true });
      break;

    case 'STOP_LISTENING':
      stopListening();
      sendResponse({ success: true });
      break;

    case 'GET_STATE':
      sendResponse({ isListening, timeUsed });
      break;

    case 'TRANSCRIPTION':
      handleTranscription(message.text);
      sendResponse({ success: true });
      break;

    case 'GET_ANSWER':
      getAIAnswer(message.question, message.context)
        .then(answer => sendResponse({ answer }))
        .catch(err => sendResponse({ error: err.message }));
      return true; // Async response

    case 'UPDATE_TIME':
      timeUsed = message.time;
      broadcastTimeUpdate();
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }

  return true;
});

// Speech Recognition Setup
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error('Speech recognition not supported');
    return null;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    console.log('Speech recognition started');
    isListening = true;
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      handleTranscription(finalTranscript);
    }

    // Send interim results to popup
    if (interimTranscript) {
      chrome.runtime.sendMessage({
        type: 'INTERIM_TRANSCRIPTION',
        text: interimTranscript
      });
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      chrome.runtime.sendMessage({ type: 'MIC_ERROR', error: 'Microphone access denied' });
    }
  };

  recognition.onend = () => {
    console.log('Speech recognition ended');
    // Restart if still supposed to be listening
    if (isListening && recognition) {
      try {
        recognition.start();
      } catch (e) {
        console.log('Could not restart recognition');
      }
    }
  };

  return recognition;
}

// Start listening
function startListening() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }

  recognition = initSpeechRecognition();
  if (recognition) {
    try {
      recognition.start();
      sessionStartTime = Date.now();
      isListening = true;

      chrome.runtime.sendMessage({ type: 'LISTENING_STARTED' });

      // Start time tracking
      startTimeTracking();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }
}

// Stop listening
function stopListening() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  isListening = false;

  stopTimeTracking();
  chrome.runtime.sendMessage({ type: 'LISTENING_STOPPED' });
}

// Handle transcription
async function handleTranscription(text) {
  console.log('Transcription received:', text);

  // Check if this looks like a question
  if (isQuestion(text)) {
    // Send to popup
    chrome.runtime.sendMessage({
      type: 'QUESTION_DETECTED',
      text: text
    });

    // Get AI answer
    const state = await getState();
    const context = {
      resume: state.selectedResume !== null ? state.resumes[state.selectedResume] : null,
      jobDetails: state.jobDetails
    };

    const answer = await getAIAnswer(text, context);

    // Display answer
    chrome.runtime.sendMessage({
      type: 'ANSWER_RECEIVED',
      answer: answer,
      question: text
    });
  }
}

// Check if text is a question
function isQuestion(text) {
  const questionIndicators = [
    '?', 'how', 'what', 'why', 'when', 'where', 'who', 'which',
    'tell me', 'can you', 'describe', 'explain', 'what\'s your',
    'do you', 'are you', 'would you', 'could you'
  ];

  const lowerText = text.toLowerCase().trim();
  return questionIndicators.some(indicator => lowerText.includes(indicator));
}

// Get AI answer
async function getAIAnswer(question, context) {
  const state = await getState();

  // Build prompt
  let prompt = `You are helping someone during a job interview. Give short, conversational answers (2-3 sentences max). Sound like you're thinking and speaking naturally, not reading from a script.\n\n`;

  if (context.jobDetails) {
    prompt += `Position: ${context.jobDetails.position || 'N/A'}\n`;
    prompt += `Company: ${context.jobDetails.company || 'N/A'}\n`;
    if (context.jobDetails.description) {
      prompt += `Job Description: ${context.jobDetails.description.substring(0, 500)}...\n`;
    }
  }

  if (context.resume && context.resume.content) {
    prompt += `\nCandidate's background (use this to personalize):\n${context.resume.content.substring(0, 1000)}...\n`;
  }

  prompt += `\nInterview question: "${question}"\n`;
  prompt += `\nGive a natural, conversational answer:`;

  // Use Groq API (default, free tier)
  const apiKey = state.settings.customApiKey || getGroqApiKey();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
      throw new Error('AI API error');
    }

    const data = await response.json();
    let answer = data.choices[0].message.content.trim();

    // Clean up answer
    answer = answer.replace(/^[""]|[""]$/g, '');

    return answer;
  } catch (error) {
    console.error('AI Error:', error);
    return "I'm not sure about that one, could you give me a moment to think?";
  }
}

// Get Groq API key (for demo - in production this would be server-side)
function getGroqApiKey() {
  return 'gsk_'; // User must provide their own key
}

// Get current state
async function getState() {
  const result = await chrome.storage.local.get(['interviewAceState']);
  return result.interviewAceState || {};
}

// Time tracking
let timeInterval = null;

function startTimeTracking() {
  if (timeInterval) return;

  timeInterval = setInterval(() => {
    if (sessionStartTime) {
      const elapsed = Date.now() - sessionStartTime;
      timeUsed += 1000; // Add 1 second

      // Update storage
      updateWeeklyTime(elapsed);

      // Broadcast update
      chrome.runtime.sendMessage({
        type: 'TIME_UPDATE',
        time: timeUsed,
        elapsed: elapsed
      });
    }
  }, 1000);
}

function stopTimeTracking() {
  if (timeInterval) {
    clearInterval(timeInterval);
    timeInterval = null;
  }
}

async function updateWeeklyTime(sessionTime) {
  const result = await chrome.storage.local.get(['interviewAceState']);
  const state = result.interviewAceState || {};

  // Check weekly reset
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  if (!state.lastReset || new Date(state.lastReset) < weekStart) {
    state.timeUsedThisWeek = 0;
    state.lastReset = new Date().toISOString();
  }

  // Add time to weekly total
  state.timeUsedThisWeek += 1000; // 1 second in ms

  await chrome.storage.local.set({ interviewAceState: state });
}

function broadcastTimeUpdate() {
  chrome.runtime.sendMessage({
    type: 'TIME_UPDATE',
    time: timeUsed
  });
}