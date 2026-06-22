# FellowshipFeed — Next.js app

A Next.js 15 app for FellowshipFeed, with four routes (member feed, group admin, head admin, owner console), Supabase auth, and role-based routing.

## Deploy on Vercel

### 1. Supabase setup

In Supabase → SQL Editor, run your schema and auth trigger SQL if you have not already.

### 2. Environment variables

In Vercel → Project Settings → Environment Variables, add these for **Production**, **Preview**, and **Development**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key |

The build will fail with a clear error if either variable is missing.

### 3. Supabase auth URLs

After your first deploy, in Supabase → Authentication → URL Configuration:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

For local development, also add `http://localhost:3000/auth/callback`.

### 4. Import and deploy

Import the GitHub repo in Vercel. Node 20+ is required (`engines` in `package.json`).

---

## Running locally

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
npm install
npm run dev
```

Open http://localhost:3000

---

## Routes

| Route | Who lands here | Functionality |
|---|---|---|
| `/login` | Signed-out users | Magic-link sign-in |
| `/feed` | Members | Approved posts and new submissions |
| `/admin` | Group admins | Approve or reject pending posts |
| `/head` | Head of org | View groups and assigned admins |
| `/console` | Platform owner | Platform overview |

---

## Troubleshooting

**Vercel build fails with missing env vars**
Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel before deploying.

**Login redirect loop**
Confirm `https://your-app.vercel.app/auth/callback` is in Supabase redirect URLs.

**"No profile" after login**
The auth user exists but is not linked to a `public.users` row. Create the user in Supabase Auth and ensure your auth trigger links them.

**Node version errors**
Use Node 20 or newer (`node --version`).
