# InterviewAce Vercel Deployment Guide

## Overview
You will create **3 separate projects** in Vercel, all from the same GitHub repository:

| Project | Directory | URL Pattern | Purpose |
|---------|-----------|-------------|---------|
| **Dashboard** | `dashboard` | `*.vercel.app` | User sign-in, resumes, settings |
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
Root Directory:           api
Build Command:            (leave empty)
Output Directory:        (leave empty)
Install Command:         npm install
```

### 2.3 Environment Variables
Click **"Environment Variables"** and add:

| Name | Value | Notes |
|------|-------|-------|
| `GROQ_API_KEY` | `gsk_your_key` | Get from console.groq.com |
| `PAYSTACK_SECRET_KEY` | `sk_test_your_key` | Get from paystack.com |
| `PAYSTACK_PUBLIC_KEY` | `pk_test_your_key` | Get from paystack.com |
| `FRONTEND_URL` | `https://your-dashboard.vercel.app` | Add after Dashboard deploys |

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
Root Directory:           dashboard
Build Command:           npm run build
Output Directory:        dist
Install Command:         npm install
```

### 3.3 Environment Variables
Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://api-xxxxx.vercel.app` (use your API URL from Step 2.4) |

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
Root Directory:           admin
Build Command:            (leave empty)
Output Directory:         .
Install Command:         (leave empty)
```

### 4.3 Deploy
1. Click **"Deploy"**
2. Wait ~30 seconds
3. Done - no environment variables needed

---

## Step 5: Connect Custom Domain (Optional)

### Dashboard (Main Site)
1. Go to Dashboard project → **Settings** → **Domains**
2. Add `interviewace.com`
3. Configure DNS:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### API
1. Go to API project → **Settings** → **Domains**
2. Add `api.interviewace.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com
   ```

### Admin
1. Go to Admin project → **Settings** → **Domains**
2. Add `admin.interviewace.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: admin
   Value: cname.vercel-dns.com
   ```

---

## Step 6: Update Extension Popup

After deployment, update the extension popup to point to your dashboard URL:

Edit `popup/popup.html`:
```javascript
// Line ~28
chrome.tabs.create({ url: 'https://your-dashboard.vercel.app' });
```

Then reload the extension in Chrome.

---

## Summary of URLs

| Component | URL After Deploy |
|-----------|------------------|
| Dashboard | `https://dashboard-xxxx.vercel.app` |
| API | `https://api-xxxx.vercel.app` |
| Admin | `https://admin-xxxx.vercel.app` |

---

## Troubleshooting

### API not responding?
1. Check Environment Variables are set
2. Check `FRONTEND_URL` points to correct Dashboard URL
3. Redeploy API after updating variables

### Dashboard shows "API Error"?
1. Check `VITE_API_URL` is correct
2. Ensure API is deployed and accessible
3. Check browser console for CORS errors

### Extension won't sync?
1. Update popup URL to your dashboard
2. Make sure user is logged in on dashboard
3. Click "Sync" button in extension popup

---

## Free Services Required

| Service | Sign Up | Purpose |
|---------|---------|---------|
| **Groq** | [console.groq.com](https://console.groq.com) | AI answers (free tier) |
| **Paystack** | [paystack.com](https://paystack.com) | Payments (3% fee) |

No credit card required for any of these!