# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blinkora is a Chrome browser extension that provides AI-powered interview assistance. The extension listens to interview questions via speech recognition and provides natural, conversational answers based on the user's resume and job description.

## Chrome Extension Structure (Manifest V3)

The extension has three main execution contexts:

1. **Popup** (`popup/`) - User interface shown when clicking the extension icon
2. **Service Worker** (`background/background.js`) - Handles speech recognition, AI responses, and state management
3. **Content Scripts** (`content/content.js`) - Injected into interview pages to display answer overlays

Communication between contexts uses `chrome.runtime.sendMessage` and `chrome.runtime.onMessage`.

## Extension Loading

To test changes:
1. Open `chrome://extensions/`
2. Click "Reload" on the Blinkora card
3. For major changes, click "Remove" then "Load unpacked" to reset

## Backend Server

The Express backend (`backend/server.js`) provides:
- User authentication (Clerk)
- Subscription management
- Paystack billing integration
- Referral tracking
- AI answer proxy (calls Groq API server-side)

Start backend: `cd backend && npm install && npm start`

Required environment variables:
- `TURSO_URL`, `TURSO_AUTH_TOKEN` - Database
- `PAYSTACK_SECRET_KEY` - Payment processing
- `GROQ_API_KEY` - AI inference
- `CLERK_SECRET_KEY` - Authentication

## Web Dashboard

React app for account management and setup (`dashboard/`).

Run development: `cd dashboard && npm run dev`
Build for production: `npm run build`

Key pages:
- `/` - Auth + Dashboard (sign in/up, manage resumes, job details, settings, billing)

## Repository Structure
```
/
├── extension/              # Chrome extension (loaded manually)
├── dashboard/              # React web app → deploy to Vercel
├── admin/                   # Static HTML admin → deploy to Vercel
├── api/                     # Serverless API → deploy to Vercel
├── backend/                 # Original Express (reference only)
└── README.md
```

## Vercel Deployment (All on Vercel)

### Dashboard Project
- Root Directory: `dashboard`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_URL` = URL of API project
  - `VITE_CLERK_PUBLISHABLE_KEY` = `pk_test_xxxx`

### API Project
- Root Directory: `api`
- Build Command: (auto)
- Environment Variables:
  - `GROQ_API_KEY` = `gsk_xxxx`
  - `PAYSTACK_SECRET_KEY` = `sk_test_xxxx`
  - `PAYSTACK_PUBLIC_KEY` = `pk_test_xxxx`
  - `CLERK_SECRET_KEY` = `sk_test_xxxx`
  - `CLERK_WEBHOOK_SECRET` = `whsec_xxxx`
  - `ADMIN_EMAILS` = comma-separated admin emails
  - `FRONTEND_URL` = `https://blinkora-plum.vercel.app`

### Admin Project
- Root Directory: `admin`
- Framework: `Other`

## Key Files

- `manifest.json` - Extension configuration and permissions
- `background/background.js` - Service worker with speech recognition and AI integration
- `content/content.js` - Answer overlay UI on interview pages
- `lib/ai/openrouter.js` - Multi-provider AI integration (Groq, OpenAI, Anthropic, Google, OpenRouter)
- `lib/storage/chrome-storage.js` - IndexedDB for offline caching

## AI Answer Style

Answers should be:
- 2-3 sentences maximum
- Conversational, natural-sounding
- Simple vocabulary (avoid complex jargon)
- Generated from context: resume content + job description + current question

## Supported Platforms

Auto-detected: Zoom, Google Meet, Microsoft Teams, LeetCode, HackerRank, Codility, Webex, Amazon Chime

## Pricing Tiers

- Free: 10 min/week (non-rolling, resets weekly)
- Starter: $19.99/mo - 30 min/week
- Pro: $34.99/mo - Unlimited
- Enterprise: $49.99/mo - Team features

## Referral System

- First 5 referrals: $5 cash credit each (admin manual payout via Paystack)
- After 5 referrals: 20% discount on next billing
- Referee gets $5 credit on first paid subscription
