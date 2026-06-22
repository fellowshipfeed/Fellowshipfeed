# Anchor — Next.js app

A working Next.js 15 app for Anchor, with four routes (member feed, group admin, head admin, owner console), Supabase auth, and the full role-based routing logic wired up.

## What you have to do (15 minutes)

### Step 1. Run the SQL files in Supabase (if you haven't)

In Supabase → SQL Editor → New query, run:
1. `anchor_schema.sql` (the 16-table schema, RLS, triggers, seed data)
2. `anchor_auth_trigger.sql` (auth wiring + `my_session` view)

### Step 2. Get your Supabase credentials

Supabase → Project Settings → API. Copy:
- **Project URL** → looks like `https://abcdefghij.supabase.co`
- **anon public key** → starts with `eyJ...`

### Step 3. Push this folder to your GitHub repo

```bash
cd anchor-app
git init
git add .
git commit -m "Initial Anchor app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 4. Deploy on Vercel

1. Vercel dashboard → Add New → Project → Import the GitHub repo
2. **Before clicking Deploy**, expand "Environment Variables" and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
3. Click Deploy. Wait ~2 minutes.

### Step 5. Tell Supabase about your Vercel URL

Once Vercel gives you a URL (something like `anchor-app.vercel.app`):

Supabase → Authentication → URL Configuration:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs** (add this): `https://your-app.vercel.app/auth/callback`

### Step 6. Test by signing in

1. Go to your Vercel URL
2. You'll see the login page
3. Enter `fr.michael@stlukegg.org` (one of the seeded users)
4. **Important**: Before this works, you need to create the matching auth user. Supabase → Authentication → Users → Add user → Email: `fr.michael@stlukegg.org`. The trigger will link this auth user to the existing public.users row.
5. Now sign in. Magic link arrives, click it, and you land on `/head` because Fr. Michael is the Head.

Other seeded users to try:
- `marco.silva@stlukegg.org` → lands on `/admin` (group admin)
- `imoreno@example.com` → lands on `/feed` (regular member)
- `elias@anchor.app` → lands on `/console` (owner — that's you)

Add each one in Supabase Auth → Users to enable login.

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

## What works right now

| Route | Who lands here | Functionality |
|---|---|---|
| `/login` | Anyone signed out | Magic-link sign-in |
| `/feed` | Members | See approved posts, write new post (goes to pending), filter by group |
| `/admin` | Group admins | See pending posts in your groups, approve/reject with reason |
| `/head` | Head of org | See all groups and current admins per group |
| `/console` | Platform owner (you) | See all orgs on the platform + resource config |

When you approve a post in `/admin`, it appears in `/feed` immediately because they're reading the same database. The cycle is now real.

## What's stubbed (next iterations)

- Reactions/saves/mentions buttons (UI hooks ready, just need wire-up)
- Admin "Add admin" modal (needs the picker UI)
- Owner "Add organization" + "Edit standard resources" flows
- Notification bell with the unread dot
- Attachments rendering (the SQL stores them; the UI needs to display image/video/embed cards)
- "Ask admin" message thread
- Events composer with the sign-up form builder

The architecture is ready for all of these — they're just additional components reading from tables that already exist.

---

## Troubleshooting

**"Cannot find module" errors during `npm install`**
Make sure you're on Node 20+: `node --version`. If older, install Node 20 from nodejs.org or via nvm.

**Vercel build fails**
Check the build logs. Most common: missing env vars (Step 4) or TypeScript errors. The `next.config.js` is minimal — if you see TS issues, you can add `typescript: { ignoreBuildErrors: true }` to the config temporarily.

**Login redirects in a loop**
Probably the Supabase redirect URL isn't set (Step 5). The magic-link callback needs to be allowed.

**"No profile" error after login**
The auth user exists but no matching `public.users` row. Either:
- The seeded users haven't been linked to auth users yet (re-run Step 6)
- OR the auth trigger didn't fire — check Supabase Logs

**RLS blocking your queries**
Confirm the auth trigger ran: `select id, email, auth_user_id from users where email = 'fr.michael@stlukegg.org';` — auth_user_id must not be null.
