# Supabase setup (original schema)

Your full database schema lives here — it was built in Claude but never committed to GitHub until now.

## Files

| File | Purpose |
|---|---|
| `00_reset_database.sql` | Wipe old tables if you get "already exists" errors |
| `anchor_schema.sql` | 16 tables, RLS, triggers, seed data (St. Luke parish) |
| `anchor_auth_trigger.sql` | Auth linking + `my_session` view |
| `02_provision_elideeb.sql` | Link your owner login |
| `03_provision_member.sql` | Link member test login |
| `05_content_updates.sql` | Hide extra resources + add Isabel to Women group |
| `07_post_attachments_storage.sql` | Storage bucket + upload policies for post files |
| `08_admin_events_signups.sql` | Org calendar URLs, post sign-up config, `post_signups` table |
| `10_signup_config_column.sql` | Adds `signup_config` only (if approval fails with column not found) |

> **Note:** `01_schema.sql` was a temporary simplified schema created during deployment troubleshooting. Use the `anchor_*.sql` files instead.

## Setup order

### 1. Run the schema (Supabase → SQL Editor)

If you previously ran the old simplified schema and see **`relation "orgs" already exists`**, run `00_reset_database.sql` first.

Then run **entire file**, in order:

1. `00_reset_database.sql` — only if resetting (see above)
2. `anchor_schema.sql`
3. `anchor_auth_trigger.sql`

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

For existing databases, also run `08_admin_events_signups.sql` to enable admin calendar settings and post sign-ups. If approval fails with **signup_config column not found**, run `10_signup_config_column.sql` (or the full `08` file).

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

## Troubleshooting

**`relation "orgs" already exists`**  
You have leftover tables from an earlier setup. Run `00_reset_database.sql`, then `anchor_schema.sql` and `anchor_auth_trigger.sql` again.
