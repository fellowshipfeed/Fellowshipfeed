-- ============================================================================
-- ANCHOR — Initial database migration
-- ============================================================================
-- Paste this into Supabase → SQL Editor → New Query → Run.
-- This creates the full schema, row-level security, helper functions, and
-- seed data for one parish (St. Luke, Garden Grove CA) with sample users.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ============================================================================
-- 1. SCHEMA
-- ============================================================================

-- Organizations (churches, mosques, synagogues, etc.)
create table orgs (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  city            text,
  head_user_id    uuid,  -- FK added after users table created
  plan            text not null default 'starter' check (plan in ('starter','growth','multi_site','trial','paused')),
  created_at      timestamptz not null default now()
);

-- Users (parishioners, admins, heads, platform owner)
create table users (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid references orgs(id) on delete cascade,  -- null = platform owner
  email           text not null unique,
  name            text not null,
  initials        text not null,
  auth_user_id    uuid unique,  -- maps to auth.users.id
  created_at      timestamptz not null default now()
);

alter table orgs
  add constraint orgs_head_user_id_fkey
  foreign key (head_user_id) references users(id) on delete set null;

-- Groups within an org (Young Adults, Men's Fellowship, etc.)
create table groups (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  name            text not null,
  slug            text not null,
  color           text not null default 'gray',
  description     text,
  created_at      timestamptz not null default now(),
  unique (org_id, slug)
);

-- Group memberships
create table group_memberships (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  group_id        uuid not null references groups(id) on delete cascade,
  joined_at       timestamptz not null default now(),
  unique (user_id, group_id)
);

-- Roles (the heart of the permission model)
-- role_type:
--   'member'      → just a regular org member (implicit; usually not stored)
--   'group_admin' → admins one specific group (group_id required)
--   'head'        → runs the entire org (group_id null)
--   'owner'       → platform-wide (org_id null, group_id null)
create table roles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  org_id          uuid references orgs(id) on delete cascade,
  group_id        uuid references groups(id) on delete cascade,
  role_type       text not null check (role_type in ('group_admin','head','owner')),
  granted_by      uuid references users(id) on delete set null,
  granted_at      timestamptz not null default now(),
  -- A user can only have one row per (org, group, role_type)
  unique (user_id, org_id, group_id, role_type)
);

-- Posts
create table posts (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references users(id) on delete cascade,
  group_id        uuid references groups(id) on delete cascade,  -- null = parish-wide
  org_id          uuid not null references orgs(id) on delete cascade,
  body            text not null,
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_parish_wide  boolean not null default false,
  pinned          boolean not null default false,
  created_at      timestamptz not null default now(),
  approved_at     timestamptz,
  approved_by     uuid references users(id) on delete set null,
  signup_config   jsonb
);

create index posts_group_status_idx on posts (group_id, status, created_at desc);
create index posts_org_status_idx on posts (org_id, status, created_at desc);

-- Attachments (images, video files, YouTube/Vimeo embeds, music links, articles)
create table attachments (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references posts(id) on delete cascade,
  type            text not null check (type in ('image','video','pdf','embed','music','link')),
  url             text not null,
  metadata        jsonb not null default '{}'::jsonb,  -- title, thumbUrl, source, domain, etc.
  created_at      timestamptz not null default now()
);

create index attachments_post_id_idx on attachments (post_id);

-- Reactions (heart, pray, in, amen — one per user per post per kind)
create table reactions (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references posts(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  kind            text not null check (kind in ('heart','pray','in','amen')),
  created_at      timestamptz not null default now(),
  unique (post_id, user_id, kind)
);

create index reactions_post_idx on reactions (post_id);

-- Saves (bookmark a post for later)
create table saves (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  post_id         uuid not null references posts(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (user_id, post_id)
);

-- Mentions (@-tags in posts)
create table mentions (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references posts(id) on delete cascade,
  mentioned_user_id uuid not null references users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (post_id, mentioned_user_id)
);

-- Moderation log (audit trail for approvals, rejections, deletions)
create table moderation_log (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references posts(id) on delete cascade,
  admin_id        uuid not null references users(id) on delete cascade,
  action          text not null check (action in ('approved','rejected','edited','deleted','pinned','unpinned')),
  reason          text,
  at              timestamptz not null default now()
);

create index moderation_log_post_idx on moderation_log (post_id);
create index moderation_log_admin_idx on moderation_log (admin_id, at desc);

-- Events
create table events (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid references groups(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  title           text not null,
  description     text,
  starts_at       timestamptz not null,
  location        text,
  capacity        integer,  -- null = unlimited
  form_fields     jsonb not null default '[]'::jsonb,  -- field definitions for sign-up
  created_by      uuid not null references users(id) on delete cascade,
  created_at      timestamptz not null default now()
);

create index events_org_starts_idx on events (org_id, starts_at);

-- Signups
create table signups (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  responses       jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (event_id, user_id)
);

-- Notifications (bell icon feed)
create table notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  type            text not null check (type in ('mention','group_post','parish_post','post_approved','post_rejected','admin_message','signup_change')),
  source_post_id  uuid references posts(id) on delete cascade,
  source_user_id  uuid references users(id) on delete set null,
  preview         text,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index notifications_user_unread_idx on notifications (user_id, read_at, created_at desc);

-- Messages (member-to-admin private messages from "Ask admin")
create table messages (
  id              uuid primary key default gen_random_uuid(),
  from_user_id    uuid not null references users(id) on delete cascade,
  to_user_id      uuid not null references users(id) on delete cascade,
  group_id        uuid references groups(id) on delete set null,
  body            text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index messages_to_user_idx on messages (to_user_id, read_at, created_at desc);

-- Standard resources (defined by platform owner — Parish website, Online giving, etc.)
create table standard_resources (
  id              uuid primary key default gen_random_uuid(),
  key             text not null unique,
  label           text not null,
  icon            text not null,
  description     text,
  required        boolean not null default false,
  default_on      boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

-- Org-level resource configuration (each church fills in the URL)
create table org_resources (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  resource_id     uuid not null references standard_resources(id) on delete cascade,
  url             text,
  enabled         boolean not null default true,
  updated_at      timestamptz not null default now(),
  unique (org_id, resource_id)
);


-- ============================================================================
-- 2. HELPER FUNCTIONS (security definer, used in RLS policies)
-- ============================================================================

-- Returns the users.id of the currently logged-in user
create or replace function current_user_id() returns uuid
language sql stable security definer
as $$
  select id from users where auth_user_id = auth.uid() limit 1;
$$;

-- Is the current user the platform owner?
create or replace function is_owner() returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from roles
    where user_id = current_user_id()
      and role_type = 'owner'
  );
$$;

-- Is the current user the Head of a specific org?
create or replace function is_head_of(target_org_id uuid) returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from roles
    where user_id = current_user_id()
      and role_type = 'head'
      and org_id = target_org_id
  );
$$;

-- Is the current user a Group Admin for a specific group?
create or replace function is_admin_of(target_group_id uuid) returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from roles
    where user_id = current_user_id()
      and role_type = 'group_admin'
      and group_id = target_group_id
  );
$$;

-- Can the current user moderate this group?
-- (Owner OR Head of the group's org OR Admin of this group)
create or replace function can_moderate_group(target_group_id uuid) returns boolean
language sql stable security definer
as $$
  select
    is_owner()
    or is_admin_of(target_group_id)
    or exists (
      select 1 from groups g
      where g.id = target_group_id
        and is_head_of(g.org_id)
    );
$$;

-- Is the current user a member of this org?
create or replace function is_member_of_org(target_org_id uuid) returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from users
    where id = current_user_id()
      and org_id = target_org_id
  );
$$;

-- Is the current user a member of this group?
create or replace function is_in_group(target_group_id uuid) returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from group_memberships
    where user_id = current_user_id()
      and group_id = target_group_id
  );
$$;


-- ============================================================================
-- 3. ROW-LEVEL SECURITY (RLS)
-- ============================================================================
-- Strategy: every table has RLS enabled. Policies enforce the role hierarchy.
-- Owners see everything. Heads see their org. Admins see their groups.
-- Members see public/approved content from groups they're in.
-- ============================================================================

alter table orgs enable row level security;
alter table users enable row level security;
alter table groups enable row level security;
alter table group_memberships enable row level security;
alter table roles enable row level security;
alter table posts enable row level security;
alter table attachments enable row level security;
alter table reactions enable row level security;
alter table saves enable row level security;
alter table mentions enable row level security;
alter table moderation_log enable row level security;
alter table events enable row level security;
alter table signups enable row level security;
alter table notifications enable row level security;
alter table messages enable row level security;
alter table standard_resources enable row level security;
alter table org_resources enable row level security;

-- ----------------------------------------------------------------------------
-- ORGS
-- ----------------------------------------------------------------------------
create policy orgs_select on orgs for select using (
  is_owner() or is_member_of_org(id)
);
create policy orgs_owner_modify on orgs for all using (is_owner());

-- ----------------------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------------------
create policy users_select on users for select using (
  is_owner()
  or id = current_user_id()
  or (org_id is not null and is_member_of_org(org_id))
);
create policy users_self_update on users for update using (id = current_user_id());
create policy users_owner_modify on users for all using (is_owner());

-- ----------------------------------------------------------------------------
-- GROUPS
-- ----------------------------------------------------------------------------
create policy groups_select on groups for select using (
  is_owner() or is_member_of_org(org_id)
);
create policy groups_head_or_owner_modify on groups for all using (
  is_owner() or is_head_of(org_id)
);

-- ----------------------------------------------------------------------------
-- GROUP_MEMBERSHIPS
-- ----------------------------------------------------------------------------
create policy memberships_select on group_memberships for select using (
  is_owner()
  or user_id = current_user_id()
  or exists (
    select 1 from groups g
    where g.id = group_memberships.group_id
      and (is_head_of(g.org_id) or is_admin_of(g.id) or is_member_of_org(g.org_id))
  )
);
create policy memberships_self_join_leave on group_memberships for all using (
  user_id = current_user_id()
);
create policy memberships_admin_manage on group_memberships for all using (
  exists (
    select 1 from groups g
    where g.id = group_memberships.group_id
      and (is_head_of(g.org_id) or is_admin_of(g.id))
  )
);

-- ----------------------------------------------------------------------------
-- ROLES
-- ----------------------------------------------------------------------------
-- Heads can grant/revoke group_admin roles in their org.
-- Owners can grant/revoke head and owner roles.
create policy roles_select on roles for select using (
  is_owner()
  or user_id = current_user_id()
  or (org_id is not null and is_head_of(org_id))
);
create policy roles_owner_modify on roles for all using (is_owner());
create policy roles_head_modify on roles for all using (
  role_type = 'group_admin'
  and org_id is not null
  and is_head_of(org_id)
);

-- ----------------------------------------------------------------------------
-- POSTS
-- ----------------------------------------------------------------------------
-- SELECT: approved posts visible to members of the group/org. Pending visible
-- to the author and admins/heads who can moderate.
create policy posts_select on posts for select using (
  is_owner()
  or author_id = current_user_id()
  or (
    status = 'approved'
    and (
      (is_parish_wide and is_member_of_org(org_id))
      or (group_id is not null and is_in_group(group_id))
    )
  )
  or (group_id is not null and can_moderate_group(group_id))
  or (is_parish_wide and is_head_of(org_id))
);

-- INSERT: any org member can create a pending post in groups they're in.
-- Admins/heads can create approved posts directly.
create policy posts_insert on posts for insert with check (
  author_id = current_user_id()
  and (
    (group_id is not null and is_in_group(group_id))
    or (is_parish_wide and (is_head_of(org_id) or is_owner()))
  )
);

-- UPDATE: author can edit their pending posts; admins/heads can moderate.
create policy posts_update on posts for update using (
  (author_id = current_user_id() and status = 'pending')
  or (group_id is not null and can_moderate_group(group_id))
  or (is_parish_wide and is_head_of(org_id))
  or is_owner()
);

-- DELETE: author can withdraw their pending post; admins/heads can remove.
create policy posts_delete on posts for delete using (
  (author_id = current_user_id() and status = 'pending')
  or (group_id is not null and can_moderate_group(group_id))
  or (is_parish_wide and is_head_of(org_id))
  or is_owner()
);

-- ----------------------------------------------------------------------------
-- ATTACHMENTS — follow post visibility
-- ----------------------------------------------------------------------------
create policy attachments_select on attachments for select using (
  exists (select 1 from posts p where p.id = attachments.post_id)
);
create policy attachments_modify on attachments for all using (
  exists (
    select 1 from posts p
    where p.id = attachments.post_id
      and (p.author_id = current_user_id() or can_moderate_group(p.group_id) or is_owner())
  )
);

-- ----------------------------------------------------------------------------
-- REACTIONS — visible if you can see the post; only your own
-- ----------------------------------------------------------------------------
create policy reactions_select on reactions for select using (
  exists (select 1 from posts p where p.id = reactions.post_id)
);
create policy reactions_self on reactions for all using (
  user_id = current_user_id()
);

-- ----------------------------------------------------------------------------
-- SAVES — entirely personal
-- ----------------------------------------------------------------------------
create policy saves_self on saves for all using (user_id = current_user_id());

-- ----------------------------------------------------------------------------
-- MENTIONS
-- ----------------------------------------------------------------------------
create policy mentions_select on mentions for select using (
  mentioned_user_id = current_user_id()
  or exists (select 1 from posts p where p.id = mentions.post_id and p.author_id = current_user_id())
  or exists (
    select 1 from posts p
    where p.id = mentions.post_id and can_moderate_group(p.group_id)
  )
);
create policy mentions_modify on mentions for all using (
  exists (
    select 1 from posts p
    where p.id = mentions.post_id and p.author_id = current_user_id()
  )
);

-- ----------------------------------------------------------------------------
-- MODERATION_LOG — admins/heads/owner can view; system writes
-- ----------------------------------------------------------------------------
create policy moderation_select on moderation_log for select using (
  is_owner()
  or exists (
    select 1 from posts p
    where p.id = moderation_log.post_id
      and (can_moderate_group(p.group_id) or is_head_of(p.org_id))
  )
);
create policy moderation_insert on moderation_log for insert with check (
  admin_id = current_user_id()
);

-- ----------------------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------------------
create policy events_select on events for select using (
  is_owner()
  or is_member_of_org(org_id)
);
create policy events_modify on events for all using (
  is_owner()
  or (group_id is not null and can_moderate_group(group_id))
  or is_head_of(org_id)
);

-- ----------------------------------------------------------------------------
-- SIGNUPS
-- ----------------------------------------------------------------------------
create policy signups_select on signups for select using (
  user_id = current_user_id()
  or is_owner()
  or exists (
    select 1 from events e
    where e.id = signups.event_id
      and (can_moderate_group(e.group_id) or is_head_of(e.org_id))
  )
);
create policy signups_self on signups for all using (user_id = current_user_id());

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS — entirely personal
-- ----------------------------------------------------------------------------
create policy notifications_self on notifications for all using (user_id = current_user_id());

-- ----------------------------------------------------------------------------
-- MESSAGES
-- ----------------------------------------------------------------------------
create policy messages_select on messages for select using (
  from_user_id = current_user_id() or to_user_id = current_user_id() or is_owner()
);
create policy messages_send on messages for insert with check (
  from_user_id = current_user_id()
);
create policy messages_update on messages for update using (
  to_user_id = current_user_id()  -- mark-as-read
);

-- ----------------------------------------------------------------------------
-- STANDARD_RESOURCES
-- ----------------------------------------------------------------------------
-- Everyone can read (so each org's admin UI knows what resources exist).
-- Only owner can modify.
create policy standard_resources_select on standard_resources for select using (true);
create policy standard_resources_owner_modify on standard_resources for all using (is_owner());

-- ----------------------------------------------------------------------------
-- ORG_RESOURCES
-- ----------------------------------------------------------------------------
create policy org_resources_select on org_resources for select using (
  is_owner() or is_member_of_org(org_id)
);
create policy org_resources_modify on org_resources for all using (
  is_owner() or is_head_of(org_id)
);


-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- When a post is approved, fire notifications to mentioned users + group members
-- (Simplified — in practice you'd batch & throttle this. Keep it here as a
-- starting point.)
create or replace function notify_on_post_approved() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and (old.status is null or old.status <> 'approved') then
    -- Notify mentioned users
    insert into notifications (user_id, type, source_post_id, source_user_id, preview)
    select m.mentioned_user_id, 'mention', new.id, new.author_id, substring(new.body for 200)
    from mentions m
    where m.post_id = new.id
      and m.mentioned_user_id <> new.author_id;

    -- Notify group members (or org members for parish-wide)
    if new.is_parish_wide then
      insert into notifications (user_id, type, source_post_id, source_user_id, preview)
      select u.id, 'parish_post', new.id, new.author_id, substring(new.body for 200)
      from users u
      where u.org_id = new.org_id
        and u.id <> new.author_id
        and not exists (select 1 from mentions m where m.post_id = new.id and m.mentioned_user_id = u.id);
    elsif new.group_id is not null then
      insert into notifications (user_id, type, source_post_id, source_user_id, preview)
      select gm.user_id, 'group_post', new.id, new.author_id, substring(new.body for 200)
      from group_memberships gm
      where gm.group_id = new.group_id
        and gm.user_id <> new.author_id
        and not exists (select 1 from mentions m where m.post_id = new.id and m.mentioned_user_id = gm.user_id);
    end if;
  end if;
  return new;
end;
$$;

create trigger posts_notify_on_approve
  after insert or update of status on posts
  for each row execute function notify_on_post_approved();

-- When a user leaves a group, drop their pending posts for that group.
create or replace function cleanup_on_group_leave() returns trigger
language plpgsql as $$
begin
  delete from posts
  where author_id = old.user_id
    and group_id = old.group_id
    and status = 'pending';
  return old;
end;
$$;

create trigger memberships_cleanup_pending
  after delete on group_memberships
  for each row execute function cleanup_on_group_leave();


-- ============================================================================
-- 5. SEED DATA — St. Luke Parish, Garden Grove CA
-- ============================================================================

-- Org
insert into orgs (id, name, slug, city, plan)
values ('11111111-1111-1111-1111-111111111111', 'St. Luke Parish', 'st-luke', 'Garden Grove, CA', 'growth');

-- Standard resources (the platform-wide canonical list — you configure these)
insert into standard_resources (key, label, icon, description, required, default_on, sort_order) values
  ('parish_website',  'Parish website',  'globe',    'Your main public website',                              true,  true,  1),
  ('online_giving',   'Online giving',   'heart',    'URL of your giving page (Tithe.ly, Pushpay, etc.)',     true,  true,  2),
  ('livestream',      'Livestream',      'video',    'YouTube, Vimeo, or church streaming page',              false, true,  3),
  ('bulletin',        'Weekly bulletin', 'document', 'PDF or web link to the current bulletin',               false, true,  4),
  ('prayer_requests', 'Prayer requests', 'pray',     'Where members submit prayer requests',                  false, false, 5),
  ('contact',         'Contact us',      'contact',  'Email or contact form for the office',                  true,  true,  6);

-- Configure resources for St. Luke
insert into org_resources (org_id, resource_id, url, enabled)
select '11111111-1111-1111-1111-111111111111', id,
  case key
    when 'parish_website'  then 'https://stlukegg.org'
    when 'online_giving'   then 'https://stlukegg.org/give'
    when 'livestream'      then 'https://youtube.com/@stlukegg'
    when 'bulletin'        then 'https://stlukegg.org/bulletin'
    when 'contact'         then 'mailto:office@stlukegg.org'
    else null
  end,
  case key when 'prayer_requests' then false when 'livestream' then false when 'bulletin' then false when 'contact' then false else true end
from standard_resources;

-- Groups
insert into groups (id, org_id, name, slug, color, description) values
  ('22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111111', 'Young Adults',       'young-adult', 'young-adult', 'For parishioners in their 20s and 30s'),
  ('22222222-2222-2222-2222-222222222002', '11111111-1111-1111-1111-111111111111', 'Men''s Fellowship',  'men',         'men',         'Brotherhood, accountability, and faith'),
  ('22222222-2222-2222-2222-222222222003', '11111111-1111-1111-1111-111111111111', 'Married Couples',    'married',     'married',     'Marriage enrichment and shared faith'),
  ('22222222-2222-2222-2222-222222222004', '11111111-1111-1111-1111-111111111111', 'Women''s Fellowship','women',       'women',       'Women growing in faith together'),
  ('22222222-2222-2222-2222-222222222005', '11111111-1111-1111-1111-111111111111', 'Teens',              'teen',        'teen',        'High-schoolers'),
  ('22222222-2222-2222-2222-222222222006', '11111111-1111-1111-1111-111111111111', 'Seniors',            'seniors',     'seniors',     '60+ fellowship and service');

-- Users
-- NOTE: auth_user_id is null here. When real users sign up via Supabase Auth,
-- you'll either UPDATE these rows to link their auth.users.id, or create new
-- rows via a trigger on auth.users.
insert into users (id, org_id, email, name, initials) values
  -- Platform owner (you) — no org_id since you're platform-wide
  ('00000000-0000-0000-0000-000000000001', null,                                     'elias@anchor.app',           'Elias Deeb',         'ED'),
  -- Head of parish
  ('33333333-3333-3333-3333-333333333001', '11111111-1111-1111-1111-111111111111', 'fr.michael@stlukegg.org',    'Fr. Michael Bautista','MB'),
  -- Group admins
  ('33333333-3333-3333-3333-333333333002', '11111111-1111-1111-1111-111111111111', 'marco.silva@stlukegg.org',   'Deacon Marco Silva',  'MS'),
  ('33333333-3333-3333-3333-333333333003', '11111111-1111-1111-1111-111111111111', 'rkim@stlukegg.org',          'Robert Kim',          'RK'),
  ('33333333-3333-3333-3333-333333333004', '11111111-1111-1111-1111-111111111111', 'twalsh@stlukegg.org',        'Tom Walsh',           'TW'),
  ('33333333-3333-3333-3333-333333333005', '11111111-1111-1111-1111-111111111111', 'cwalsh@stlukegg.org',        'Cecilia Walsh',       'CW'),
  -- Members
  ('33333333-3333-3333-3333-333333333010', '11111111-1111-1111-1111-111111111111', 'imoreno@example.com',        'Isabel Moreno',       'IM'),
  ('33333333-3333-3333-3333-333333333011', '11111111-1111-1111-1111-111111111111', 'arusso@example.com',         'Anthony Russo',       'AR'),
  ('33333333-3333-3333-3333-333333333012', '11111111-1111-1111-1111-111111111111', 'dchen@example.com',          'David Chen',          'DC'),
  ('33333333-3333-3333-3333-333333333013', '11111111-1111-1111-1111-111111111111', 'pdesai@example.com',         'Priya Desai',         'PD'),
  ('33333333-3333-3333-3333-333333333014', '11111111-1111-1111-1111-111111111111', 'sokafor@example.com',        'Sarah Okafor',         'SO'),
  ('33333333-3333-3333-3333-333333333015', '11111111-1111-1111-1111-111111111111', 'tvega@example.com',          'Tomas Vega',          'TV');

-- Set the Head pointer
update orgs
set head_user_id = '33333333-3333-3333-3333-333333333001'
where id = '11111111-1111-1111-1111-111111111111';

-- Roles
insert into roles (user_id, org_id, group_id, role_type) values
  -- Platform owner
  ('00000000-0000-0000-0000-000000000001', null, null, 'owner'),
  -- Head of St. Luke
  ('33333333-3333-3333-3333-333333333001', '11111111-1111-1111-1111-111111111111', null, 'head'),
  -- Group admins
  ('33333333-3333-3333-3333-333333333002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222001', 'group_admin'),
  ('33333333-3333-3333-3333-333333333002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222002', 'group_admin'),
  ('33333333-3333-3333-3333-333333333003', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222002', 'group_admin'),
  ('33333333-3333-3333-3333-333333333004', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222003', 'group_admin'),
  ('33333333-3333-3333-3333-333333333005', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222003', 'group_admin');

-- Group memberships
insert into group_memberships (user_id, group_id) values
  -- Fr. Michael is in everything (Head)
  ('33333333-3333-3333-3333-333333333001', '22222222-2222-2222-2222-222222222001'),
  ('33333333-3333-3333-3333-333333333001', '22222222-2222-2222-2222-222222222002'),
  ('33333333-3333-3333-3333-333333333001', '22222222-2222-2222-2222-222222222003'),
  -- Marco (admin of YA + Men)
  ('33333333-3333-3333-3333-333333333002', '22222222-2222-2222-2222-222222222001'),
  ('33333333-3333-3333-3333-333333333002', '22222222-2222-2222-2222-222222222002'),
  -- Robert (Men)
  ('33333333-3333-3333-3333-333333333003', '22222222-2222-2222-2222-222222222002'),
  -- Tom & Cecilia (Married)
  ('33333333-3333-3333-3333-333333333004', '22222222-2222-2222-2222-222222222003'),
  ('33333333-3333-3333-3333-333333333005', '22222222-2222-2222-2222-222222222003'),
  -- Members in various groups
  ('33333333-3333-3333-3333-333333333010', '22222222-2222-2222-2222-222222222001'),  -- Isabel → YA
  ('33333333-3333-3333-3333-333333333010', '22222222-2222-2222-2222-222222222004'),  -- Isabel → Women
  ('33333333-3333-3333-3333-333333333011', '22222222-2222-2222-2222-222222222001'),  -- Anthony → YA
  ('33333333-3333-3333-3333-333333333011', '22222222-2222-2222-2222-222222222002'),  -- Anthony → Men
  ('33333333-3333-3333-3333-333333333012', '22222222-2222-2222-2222-222222222001'),  -- David → YA
  ('33333333-3333-3333-3333-333333333012', '22222222-2222-2222-2222-222222222002'),  -- David → Men
  ('33333333-3333-3333-3333-333333333013', '22222222-2222-2222-2222-222222222003'),  -- Priya → Married
  ('33333333-3333-3333-3333-333333333013', '22222222-2222-2222-2222-222222222004'),  -- Priya → Women
  ('33333333-3333-3333-3333-333333333014', '22222222-2222-2222-2222-222222222001'),  -- Sarah → YA
  ('33333333-3333-3333-3333-333333333014', '22222222-2222-2222-2222-222222222004'),  -- Sarah → Women
  ('33333333-3333-3333-3333-333333333015', '22222222-2222-2222-2222-222222222001');  -- Tomas → YA

-- A few sample posts so feeds aren't empty
insert into posts (author_id, group_id, org_id, body, status, is_parish_wide, pinned, approved_at, approved_by) values
  ('33333333-3333-3333-3333-333333333001', null, '11111111-1111-1111-1111-111111111111',
   'Reminder: this Sunday is our annual Parish Picnic at Garden Grove Park, 12:30pm right after the 11am Mass. Food, games, and live music from the youth band.',
   'approved', true, true, now(), '33333333-3333-3333-3333-333333333001'),
  ('33333333-3333-3333-3333-333333333002', '22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111111',
   'Reminder: this Friday is our monthly social at El Farolito (7pm). Bring a friend — we''ll cover the first round for first-time visitors.',
   'approved', false, true, now(), '33333333-3333-3333-3333-333333333002'),
  ('33333333-3333-3333-3333-333333333002', '22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111111',
   'Service night at Second Harvest Food Bank — Saturday Nov 8, 9am to noon. Sign up by Wednesday.',
   'approved', false, false, now(), '33333333-3333-3333-3333-333333333002'),
  ('33333333-3333-3333-3333-333333333010', '22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111111',
   'Anyone interested in starting a Tuesday morning prayer group before work? Thinking 6:30am at the chapel.',
   'pending', false, false, null, null);

insert into events (id, group_id, org_id, title, description, starts_at, location, created_by) values
  ('44444444-4444-4444-4444-444444444001', null, '11111111-1111-1111-1111-111111111111',
   'Parish picnic at Yorba Regional', 'Annual parish picnic after 11am Mass',
   '2026-10-19 12:30:00-07', 'Garden Grove Park', '33333333-3333-3333-3333-333333333001'),
  ('44444444-4444-4444-4444-444444444002', '22222222-2222-2222-2222-222222222004', '11111111-1111-1111-1111-111111111111',
   'Date night with childcare', 'Childcare provided at the parish hall',
   '2026-10-11 18:00:00-07', 'Parish hall', '33333333-3333-3333-3333-333333333005'),
  ('44444444-4444-4444-4444-444444444003', '22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111111',
   'Monthly social at El Farolito', 'First round covered for first-time visitors',
   '2026-10-17 19:00:00-07', 'El Farolito, Anaheim', '33333333-3333-3333-3333-333333333002'),
  ('44444444-4444-4444-4444-444444444004', '22222222-2222-2222-2222-222222222002', '11111111-1111-1111-1111-111111111111',
   'Saturday morning breakfast', 'Men''s fellowship breakfast in the parish hall',
   '2026-10-18 07:30:00-07', 'Parish hall', '33333333-3333-3333-3333-333333333003');

-- ============================================================================
-- DONE
-- ============================================================================
-- After running this:
-- 1. Go to Authentication → Settings and enable email + magic links
-- 2. Create a trigger on auth.users that inserts a row in public.users
--    (see auth_trigger.sql in the next step)
-- 3. Test queries with the helpers:
--    select * from posts where current_user_id() is not null;
-- ============================================================================
