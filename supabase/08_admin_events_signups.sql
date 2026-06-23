-- Admin-managed calendar, events, and post sign-ups
-- Run on existing databases after anchor_schema.sql

alter table orgs
  add column if not exists google_calendar_url text,
  add column if not exists calendar_ics_url text;

alter table posts
  add column if not exists signup_config jsonb;

create table if not exists post_signups (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references posts(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  responses       jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists post_signups_post_idx on post_signups (post_id);

alter table post_signups enable row level security;

drop policy if exists post_signups_select on post_signups;
create policy post_signups_select on post_signups for select using (
  user_id = current_user_id()
  or is_owner()
  or exists (
    select 1 from posts p
    where p.id = post_signups.post_id
      and (can_moderate_group(p.group_id) or is_head_of(p.org_id))
  )
);

drop policy if exists post_signups_self on post_signups;
create policy post_signups_self on post_signups for all using (user_id = current_user_id());

drop policy if exists orgs_head_update on orgs;
create policy orgs_head_update on orgs for update using (
  is_head_of(id) or is_owner()
) with check (
  is_head_of(id) or is_owner()
);
