# Supabase setup (original schema)

Your full database schema lives here — it was built in Claude but never committed to GitHub until now.

## Files

| File | Purpose |
|---|---|
| `anchor_schema.sql` | 16 tables, RLS, triggers, seed data (St. Luke parish) |
| `anchor_auth_trigger.sql` | Auth linking + `my_session` view |
| `02_provision_elideeb.sql` | Link your owner login |
| `03_provision_member.sql` | Link member test login |

> **Note:** `01_schema.sql` was a temporary simplified schema created during deployment troubleshooting. Use the `anchor_*.sql` files instead.

## Setup order

### 1. Run the schema (Supabase → SQL Editor)

Run **entire file**, in order:

1. `anchor_schema.sql`
2. `anchor_auth_trigger.sql`

This creates all tables, seed users, sample posts, groups, and resources.

### 2. Create Auth users

Supabase → **Authentication** → **Users** → **Add user** → **Create new user**

| Account | Email | Password | Role |
|---|---|---|---|
| Owner (you) | `elideeb@gmail.com` | `123456` | `/console` |
| Member test | `imoreno@example.com` | `123456` | `/feed` |

Turn **Auto Confirm User** ON for each.

### 3. Link profiles

Run `02_provision_elideeb.sql` for your owner account.  
Run `03_provision_member.sql` for the member test account.

### 4. Sign in

Go to `/login` with email + password.

## Seeded accounts (from anchor_schema.sql)

| Email | Role | Page |
|---|---|---|
| `elias@anchor.app` → update to `elideeb@gmail.com` | Owner | `/console` |
| `fr.michael@stlukegg.org` | Head | `/head` |
| `marco.silva@stlukegg.org` | Group admin | `/admin` |
| `imoreno@example.com` | Member | `/feed` |

Each needs a matching Auth user + link SQL (or the auth trigger links on first create if email matches seed).

## What's in the app vs database

**In the Next.js app (still in repo):**
- `/feed`, `/admin`, `/head`, `/console`, `/login`, landing page
- Post composer, approval queue, TopBar, role routing

**In the database (anchor_schema.sql):**
- Reactions, saves, mentions, events, signups, notifications, messages
- Full RLS policies and notification triggers

**Stubbed in UI only** (tables exist, UI not wired yet):
- Reactions/saves/mentions buttons
- Notification bell
- Attachment cards
- Add admin modal
- Events composer

Those were listed as "next iterations" in the original README — the architecture is there, the UI components weren't built yet.
