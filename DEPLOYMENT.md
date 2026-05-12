# Blinkora Vercel Deployment Guide

## Overview

Deploy **3 separate projects** in Vercel from the same GitHub repository:

| Project | Directory | URL Pattern | Purpose |
|---------|-----------|-------------|---------|
| **Dashboard** | `dashboard` | `*.vercel.app` | User sign-in, resumes, settings, billing |
| **API** | `api` | `api-*.vercel.app` | Backend - auth, AI, billing |
| **Admin** | `admin` | `admin-*.vercel.app` | User management, payouts |

---

## Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" → Use **GitHub** to sign in
3. Authorize Vercel to access your GitHub repos

---

## Step 2: Deploy API (Backend)

### 2.1 Create New Project
1. Click **"Add New..."** → **"Project"**
2. Find `criminal-killer/Interview_ai` in the list
3. Click **"Import"**

### 2.2 Configure Project
```
Framework Preset:        Other
Root Directory:          api
Build Command:           (leave empty)
Output Directory:        (leave empty)
Install Command:         npm install
```

### 2.3 Environment Variables
Click **"Environment Variables"** and add:

| Name | Value | Notes |
|------|-------|-------|
| `CLERK_SECRET_KEY` | `sk_test_xxx` | From dashboard.clerk.com |
| `CLERK_WEBHOOK_SECRET` | `whsec_xxx` | From Clerk webhooks |
| `GROQ_API_KEY` | `gsk_xxx` | Get from console.groq.com |
| `PAYSTACK_SECRET_KEY` | `sk_test_xxx` | Get from paystack.com |
| `PAYSTACK_PUBLIC_KEY` | `pk_test_xxx` | Get from paystack.com |
| `FRONTEND_URL` | `https://your-dashboard.vercel.app` | Add after Dashboard deploys |
| `ADMIN_EMAILS` | `admin@example.com` | Comma-separated list |

### 2.4 Deploy
1. Click **"Deploy"**
2. Wait ~1 minute for deployment
3. Copy your API URL: `https://api-xxxxx.vercel.app`

---

## Step 3: Deploy Dashboard (Frontend)

### 3.1 Create New Project
1. Click **"Add New..."** → **"Project"**
2. Find `criminal-killer/Interview_ai` in the list
3. Click **"Import"**

### 3.2 Configure Project
```
Framework Preset:        Vite
Root Directory:          dashboard
Build Command:           npm run build
Output Directory:        dist
Install Command:         npm install
```

### 3.3 Environment Variables
Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://api-xxxxx.vercel.app` (use your API URL from Step 2.4) |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_xxx` (from Clerk dashboard) |

### 3.4 Deploy
1. Click **"Deploy"**
2. Wait ~2 minutes for deployment
3. Copy your Dashboard URL

### 3.5 Update API
1. Go back to API project settings
2. Update `FRONTEND_URL` to your Dashboard URL
3. Redeploy API

---

## Step 4: Deploy Admin Panel

### 4.1 Create New Project
1. Click **"Add New..."** → **"Project"**
2. Find `criminal-killer/Interview_ai` in the list
3. Click **"Import"**

### 4.2 Configure Project
```
Framework Preset:        Other
Root Directory:          admin
Build Command:          (leave empty)
Output Directory:       .
Install Command:        (leave empty)
```

### 4.3 Deploy
1. Click **"Deploy"**
2. Wait ~30 seconds
3. Done - no environment variables needed

---

## Step 5: Configure Clerk

### 5.1 Add Redirect URLs
1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application
3. Go to **Redirects** or **Allowed origins**
4. Add:
   - `https://your-dashboard.vercel.app` (production)
   - `http://localhost:5173` (local dev)

### 5.2 Configure Webhooks
1. Go to **Webhooks** in Clerk
2. Add webhook:
   - URL: `https://api-yourapp.vercel.app/api/clerk/webhook`
   - Events: `user.created`, `user.deleted`
3. Copy the webhook secret to API env vars

### 5.3 Enable Social Login
1. Go to **Authentication** → **Social**
2. Enable **Google** (recommended)
3. Configure OAuth credentials

---

## Step 6: Update Extension Popup

After deployment, update the extension popup:

Edit `popup/popup.html`:
```javascript
// Update this line:
const DASHBOARD_URL = 'https://your-dashboard.vercel.app';
```

Then reload the extension in Chrome.

---

## Summary of URLs

| Component | URL After Deploy |
|-----------|------------------|
| Dashboard | `https://dashboard-xxxx.vercel.app` |
| API | `https://api-xxxxx.vercel.app` |
| Admin | `https://admin-xxxx.vercel.app` |

---

## Troubleshooting

### API not responding?
1. Check Environment Variables are set
2. Check `FRONTEND_URL` points to correct Dashboard URL
3. Redeploy API after updating variables

### Dashboard shows "Configuration Required"?
1. Check `VITE_CLERK_PUBLISHABLE_KEY` is correct
2. Ensure Clerk key starts with `pk_test_`

### Auth redirect loop?
1. Check Clerk redirect URLs in Clerk Dashboard
2. Ensure `FRONTEND_URL` in API matches exact dashboard URL

### Admin not loading?
1. Access with: `https://admin-xxxxx.vercel.app/?key=pk_test_your_key`
2. Make sure email is in `ADMIN_EMAILS` env var

---

## Free Services Required

| Service | Sign Up | Purpose |
|---------|---------|---------|
| **Clerk** | [dashboard.clerk.com](https://dashboard.clerk.com) | Authentication (free tier) |
| **Groq** | [console.groq.com](https://console.groq.com) | AI answers (free tier) |
| **Paystack** | [paystack.com](https://paystack.com) | Payments (3% fee) |

---

## Paystack Setup

### Create Payment Links
1. Go to [paystack.com](https://paystack.com) → **Payment Links**
2. Create links:
   - `https://paystack.shop/pay/blinkora-starter` ($19.99/mo)
   - `https://paystack.shop/pay/blinkora-pro` ($34.99/mo)
   - `https://paystack.shop/pay/blinkora-enterprise` ($49.99/mo)

### Configure Webhooks
1. Go to **Settings** → **API Keys & Webhooks**
2. Add webhook URL: `https://api-yourapp.vercel.app/api/billing/webhook`
3. Copy webhook signing secret to API env vars
