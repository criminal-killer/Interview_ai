# Clerk Setup Guide

## Step 1: Get Clerk API Keys

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) and sign in
2. Select your **Application**
3. Go to **API Keys** (left sidebar)
4. Copy these keys:

```
Publishable Key (starts with pk_):     pk_test_xxxxxxxxxxxx
Secret Key (starts with sk_):          sk_test_xxxxxxxxxxxx
```

---

## Step 2: Add Keys to Vercel

### Dashboard Project (Environment Variables)
1. Go to Vercel → Dashboard project → **Settings** → **Environment Variables**
2. Add:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
   ```

### API Project (Environment Variables)
1. Go to Vercel → API project → **Settings** → **Environment Variables**
2. Add:
   ```
   CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxx
   CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
   ```

---

## Step 3: Configure Clerk Dashboard

### 3.1 Enable Providers
1. Go to Clerk Dashboard → **Authentication** → **Social**
2. Enable:
   - **Google** (recommended)
   - **GitHub** (optional)
3. Configure OAuth credentials for each

### 3.2 Set Redirect URLs
1. Go to **Redirects** or **Allowed origins**
2. Add your Vercel domains:
   ```
   https://blinkora-plum.vercel.app
   http://localhost:5173 (for local dev)
   ```

### 3.3 Configure Webhooks
1. Go to **Webhooks**
2. Add webhook:
   - URL: `https://api-beta-three-38.vercel.app/api/clerk/webhook`
   - Events: `user.created`, `user.deleted`
3. Copy the **Webhook Secret** (starts with `whsec_`)

---

## Step 4: Update Vercel Environment Variables

### API Project
Add to API project environment variables:
```
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

---

## Step 5: Local Development

Create `dashboard/.env.local`:
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
VITE_API_URL=http://localhost:3000
```

Create `api/.env.local` (for local testing):
```bash
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

---

## What Was Updated

The code has been updated to use Clerk authentication:

### Dashboard (`dashboard/`)
- **main.jsx**: Wrapped app with `<ClerkProvider>`
- **App.jsx**: Uses Clerk's `useAuth()` hook
- **Auth.jsx**: Uses Clerk's `<SignIn>` and `<SignUp>` components
- **Dashboard.jsx**: Fetches user data from API using Clerk user ID

### API (`api/`)
- **routes/clerk.js**: New file handling Clerk webhooks and user profile routes
- **index.js**: Added Clerk webhook endpoint and updated routes

---

## Verification

After adding keys:
1. Deploy API and Dashboard
2. Go to your dashboard URL
3. Should see Clerk's sign-in page with Google/GitHub options
4. Sign up/in with Google
5. Should redirect to dashboard
6. Check API logs - webhook should have created user in store

---

## Need Help?

If you can't find the keys:
1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application
3. Look in **API Keys** section (gear icon → API Keys)

For webhooks:
1. Go to **Webhooks** section
2. Click **Add Endpoint**
3. Configure as described above
