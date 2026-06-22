-- FellowshipFeed: wipe existing public schema tables before a fresh install
-- Run this FIRST if you get "relation already exists" errors.
--
-- WARNING: This deletes all app data in public.* (orgs, users, posts, etc.)
-- Auth users in Authentication are NOT deleted — re-run provision scripts after.

-- View + auth trigger (from anchor_auth_trigger.sql)
drop view if exists public.my_session cascade;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_auth_user() cascade;

-- Tables (CASCADE drops any triggers on these tables automatically)
drop table if exists public.moderation_log cascade;
drop table if exists public.attachments cascade;
drop table if exists public.reactions cascade;
drop table if exists public.saves cascade;
drop table if exists public.mentions cascade;
drop table if exists public.signups cascade;
drop table if exists public.notifications cascade;
drop table if exists public.messages cascade;
drop table if exists public.posts cascade;
drop table if exists public.events cascade;
drop table if exists public.org_resources cascade;
drop table if exists public.group_memberships cascade;
drop table if exists public.group_members cascade;  -- from old simplified schema
drop table if exists public.roles cascade;
drop table if exists public.groups cascade;
drop table if exists public.users cascade;
drop table if exists public.standard_resources cascade;
drop table if exists public.orgs cascade;

-- Helper functions
drop function if exists public.current_user_id() cascade;
drop function if exists public.is_owner() cascade;
drop function if exists public.is_head_of(uuid) cascade;
drop function if exists public.is_admin_of(uuid) cascade;
drop function if exists public.can_moderate_group(uuid) cascade;
drop function if exists public.is_member_of_org(uuid) cascade;
drop function if exists public.is_in_group(uuid) cascade;
drop function if exists public.notify_on_post_approved() cascade;
drop function if exists public.cleanup_on_group_leave() cascade;

-- Done — now run anchor_schema.sql, then anchor_auth_trigger.sql
