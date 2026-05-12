// InterviewAce Content Script
// Injected into interview pages to detect questions and display answers

(function() {
  'use strict';

  // Configuration
  const config = {
    answerDisplayDuration: 30000, // 30 seconds
    autoDetectQuestions: true,
    stealthMode: true
  };

  let isActive = false;
  let currentAnswer = null;
  let answerOverlay = null;

  // Initialize
  init();

  function init() {
    console.log('InterviewAce content script loaded');

    // Listen for messages from background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'SESSION_STARTED':
          startSession(message.state);
          break;
        case 'SESSION_STOPPED':
          stopSession();
          break;
        case 'ANSWER_RECEIVED':
          displayAnswer(message.answer, message.question);
          break;
      }
    });

    // Detect if we're on a known interview platform
    detectPlatform();
  }

  function startSession(state) {
    isActive = true;
    console.log('InterviewAce session started');
    config.stealthMode = state.settings?.stealthMode ?? true;

    // Start detecting questions
    if (config.autoDetectQuestions) {
      startQuestionDetection();
    }
  }

  function stopSession() {
    isActive = false;
    console.log('InterviewAce session stopped');
    hideAnswer();
    stopQuestionDetection();
  }

  // Platform detection
  function detectPlatform() {
    const hostname = window.location.hostname;
    const url = window.location.href;

    let platform = null;

    if (hostname.includes('zoom.us')) platform = 'zoom';
    else if (hostname.includes('meet.google.com')) platform = 'meet';
    else if (hostname.includes('teams.microsoft.com')) platform = 'teams';
    else if (hostname.includes('leetcode.com')) platform = 'leetcode';
    else if (hostname.includes('hackerrank.com')) platform = 'hackerrank';
    else if (hostname.includes('webex.com')) platform = 'webex';

    if (platform) {
      console.log('Detected platform:', platform);
      chrome.runtime.sendMessage({
        type: 'PLATFORM_DETECTED',
        platform: platform
      });
    }
  }

  // Question detection using speech
  let speechRecognition = null;

  function startQuestionDetection() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log('Speech recognition not supported');
      return;
    }

    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'en-US';

    let lastTranscript = '';
    let lastTranscriptTime = 0;

    speechRecognition.onresult = (event) => {
      const now = Date.now();

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();

        // Debounce same transcripts
        if (transcript === lastTranscript && now - lastTranscriptTime < 3000) {
          continue;
        }

        lastTranscript = transcript;
        lastTranscriptTime = now;

        // Send to background for processing
        if (transcript.length > 10) {
          chrome.runtime.sendMessage({
            type: 'TRANSCRIPTION',
            text: transcript
          });
        }
      }
    };

    speechRecognition.onerror = (event) => {
      console.log('Speech recognition error:', event.error);
    };

    speechRecognition.onend = () => {
      // Restart if still active
      if (isActive && speechRecognition) {
        try {
          speechRecognition.start();
        } catch (e) {
          console.log('Could not restart speech recognition');
        }
      }
    };

    try {
      speechRecognition.start();
    } catch (e) {
      console.log('Could not start speech recognition');
    }
  }

  function stopQuestionDetection() {
    if (speechRecognition) {
      speechRecognition.stop();
      speechRecognition = null;
    }
  }

  // Display answer overlay
  function displayAnswer(answer, question) {
    if (!isActive) return;

    currentAnswer = { text: answer, question: question };

    // Create or update overlay
    if (!answerOverlay) {
      answerOverlay = createOverlay();
    }

    answerOverlay.querySelector('.ia-answer-text').textContent = answer;
    if (question) {
      answerOverlay.querySelector('.ia-question-text').textContent = question;
      answerOverlay.querySelector('.ia-question-section').style.display = 'block';
    }

    answerOverlay.style.display = 'flex';

    // Auto-hide after duration
    setTimeout(() => {
      if (currentAnswer?.text === answer) {
        hideAnswer();
      }
    }, config.answerDisplayDuration);
  }

  function hideAnswer() {
    if (answerOverlay) {
      answerOverlay.style.display = 'none';
    }
    currentAnswer = null;
  }

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'interviewace-overlay';
    overlay.innerHTML = `
      <style>
        #interviewace-overlay {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 320px;
          max-width: 90vw;
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.3);
          z-index: 999999;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: none;
          animation: ia-slide-in 0.3s ease;
        }

        @keyframes ia-slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .ia-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ia-logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ia-logo-icon {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          color: white;
        }

        .ia-brand {
          font-size: 14px;
          font-weight: 600;
          color: #f8fafc;
        }

        .ia-close {
          width: 28px;
          height: 28px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          border-radius: 6px;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ia-close:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .ia-question-section {
          display: none;
          margin-bottom: 12px;
          padding: 10px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 8px;
        }

        .ia-question-label {
          font-size: 10px;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 4px;
        }

        .ia-question-text {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.4;
        }

        .ia-answer-section {
          margin-bottom: 12px;
        }

        .ia-answer-label {
          font-size: 10px;
          text-transform: uppercase;
          color: #22c55e;
          margin-bottom: 8px;
        }

        .ia-answer-text {
          font-size: 15px;
          line-height: 1.6;
          color: #f8fafc;
        }

        .ia-actions {
          display: flex;
          gap: 8px;
        }

        .ia-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .ia-btn-copy {
          background: rgba(99, 102, 241, 0.2);
          color: #6366f1;
        }

        .ia-btn-copy:hover {
          background: rgba(99, 102, 241, 0.3);
        }

        .ia-btn-speak {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .ia-btn-speak:hover {
          background: rgba(34, 197, 94, 0.3);
        }

        .ia-timer {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 10px;
          font-weight: 600;
        }

        #interviewace-overlay.hidden {
          display: none !important;
        }
      </style>
      <div class="ia-header">
        <div class="ia-logo">
          <div class="ia-logo-icon">IA</div>
          <span class="ia-brand">InterviewAce</span>
        </div>
        <button class="ia-close" id="ia-close">×</button>
      </div>
      <div class="ia-question-section">
        <div class="ia-question-label">Question Detected</div>
        <div class="ia-question-text"></div>
      </div>
      <div class="ia-answer-section">
        <div class="ia-answer-label">Suggested Answer</div>
        <div class="ia-answer-text"></div>
      </div>
      <div class="ia-actions">
        <button class="ia-btn ia-btn-copy" id="ia-copy">
          📋 Copy
        </button>
        <button class="ia-btn ia-btn-speak" id="ia-speak">
          🔊 Read
        </button>
      </div>
      <div class="ia-timer" id="ia-timer" style="display: none;"></div>
    `;

    document.body.appendChild(overlay);

    // Event listeners
    overlay.querySelector('#ia-close').addEventListener('click', hideAnswer);
    overlay.querySelector('#ia-copy').addEventListener('click', copyAnswer);
    overlay.querySelector('#ia-speak').addEventListener('click', speakAnswer);

    return overlay;
  }

  function copyAnswer() {
    if (currentAnswer) {
      navigator.clipboard.writeText(currentAnswer.text);
      // Visual feedback
      const btn = answerOverlay?.querySelector('#ia-copy');
      if (btn) {
        btn.textContent = '✓ Copied';
        setTimeout(() => {
          btn.innerHTML = '📋 Copy';
        }, 2000);
      }
    }
  }

  function speakAnswer() {
    if (currentAnswer && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(currentAnswer.text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      // Highlight text while speaking
      const textEl = answerOverlay?.querySelector('.ia-answer-text');
      if (textEl) {
        utterance.onstart = () => textEl.style.color = '#22c55e';
        utterance.onend = () => textEl.style.color = '#f8fafc';
      }

      speechSynthesis.speak(utterance);
    }
  }

  // Screen share detection for stealth mode
  let isScreenSharing = false;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isActive && config.stealthMode) {
      enableStealthMode();
    } else {
      disableStealthMode();
    }
  });

  // Watch for screen share
  navigator.mediaDevices?.addEventListener('addtrack', (event) => {
    if (event.track?.kind === 'video') {
      isScreenSharing = true;
      if (config.stealthMode && isActive) {
        enableStealthMode();
      }
    }
  });

  function enableStealthMode() {
    if (answerOverlay) {
      // Hide completely during screen share
      answerOverlay.style.display = 'none';
      answerOverlay.classList.add('hidden');
    }
  }

  function disableStealthMode() {
    if (answerOverlay) {
      answerOverlay.classList.remove('hidden');
      if (currentAnswer) {
        answerOverlay.style.display = 'flex';
      }
    }
  }

})();