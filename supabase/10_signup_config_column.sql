-- Quick fix if post approval fails with "signup_config column not found"
-- Safe to run multiple times. For full sign-up features, run 08_admin_events_signups.sql instead.

alter table posts
  add column if not exists signup_config jsonb;
