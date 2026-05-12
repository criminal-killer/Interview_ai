# InterviewAce Browser Extension

AI-powered interview assistant that helps candidates during job interviews.

## Features

- **Speech Recognition**: Automatically transcribes interview questions
- **AI-Powered Answers**: Provides conversational, natural-sounding answers
- **Resume Matching**: Uploads multiple resumes and matches answers to your background
- **Stealth Mode**: Invisible to interviewers during screen share
- **Platform Support**: Works with Zoom, Google Meet, Teams, LeetCode, HackerRank, and more
- **Screen Reading**: Can read and solve coding problems on screen

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 10 min/week |
| Starter | $19.99/mo | 30 min/week, all platforms |
| Pro | $34.99/mo | Unlimited |
| Enterprise | $49.99/mo | Team dashboard, API access |

## Tech Stack

- **Extension**: Chrome Extension Manifest V3
- **Frontend**: React, Tailwind CSS (popup), Vanilla JS (content scripts)
- **Backend**: Node.js + Express
- **Database**: Turso DB (SQLite distributed)
- **Auth**: Clerk
- **Billing**: Paystack
- **AI**: Groq (default), OpenAI, Anthropic, Google, OpenRouter support

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `EXTENSION` folder

## Project Structure

```
EXTENSION/
├── manifest.json          # Extension manifest (Manifest V3)
├── popup/                  # UI components
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── background/
│   └── background.js      # Service worker
├── content/
│   ├── content.js         # Injected into pages
│   └── content.css
├── lib/
│   ├── ai/                # AI integration
│   └── storage/           # Storage utilities
├── assets/
│   └── icons/             # Extension icons
└── backend/
    └── server.js          # Express backend
```

## Backend Setup

```bash
cd backend
npm install
# Set environment variables
export TURSO_URL=your_turso_url
export TURSO_AUTH_TOKEN=your_token
export PAYSTACK_SECRET_KEY=your_key
export GROQ_API_KEY=your_key
export CLERK_SECRET_KEY=your_key
npm start
```

## Referral System

- First 5 referrals: $5 cash credit each (paid manually by admin)
- After 5 referrals: 20% discount on next billing cycle
- Referee bonus: $5 credit on first paid subscription

## License

Proprietary - All rights reserved