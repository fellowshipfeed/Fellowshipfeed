-- ============================================================================
-- ANCHOR — Auth trigger
-- ============================================================================
-- Run AFTER anchor_schema.sql. This creates a trigger on auth.users so that
-- when someone signs up via Supabase Auth, a matching row is created in
-- public.users.
--
-- This trigger does NOT auto-assign an org. Instead:
--   - Existing seeded users have their auth_user_id updated when they
--     first sign in with their seeded email (the trigger checks for an
--     existing public.users row matching the auth email).
--   - New signups create a "floating" user with no org_id. Your app's
--     onboarding flow then either:
--     (a) routes them through "Join a parish" → matches by invite code,
--     (b) or routes them through "Start a parish" → creates a new org
--         and makes them the Head.
-- ============================================================================

create or replace function handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  existing_user_id uuid;
begin
  -- Check if there's already a seeded users row with this email
  select id into existing_user_id from public.users
  where email = new.email and auth_user_id is null
  limit 1;

  if existing_user_id is not null then
    -- Link the existing row to the new auth user
    update public.users
    set auth_user_id = new.id
    where id = existing_user_id;
  else
    -- Create a new user row — no org assigned yet
    insert into public.users (auth_user_id, email, name, initials)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      upper(substring(coalesce(new.raw_user_meta_data->>'name', new.email) for 2))
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ============================================================================
-- HELPER VIEW for role resolution at login
-- ============================================================================
-- The app calls this to determine where to route a user after login.
-- Returns their highest role: 'owner' > 'head' > 'group_admin' > 'member'.
-- ============================================================================

create or replace view my_session as
select
  u.id as user_id,
  u.org_id,
  u.name,
  u.email,
  u.initials,
  o.name as org_name,
  o.slug as org_slug,
  case
    when exists (select 1 from roles r where r.user_id = u.id and r.role_type = 'owner') then 'owner'
    when exists (select 1 from roles r where r.user_id = u.id and r.role_type = 'head' and r.org_id = u.org_id) then 'head'
    when exists (select 1 from roles r where r.user_id = u.id and r.role_type = 'group_admin' and r.org_id = u.org_id) then 'group_admin'
    when u.org_id is not null then 'member'
    else 'unassigned'
  end as primary_role,
  -- Groups the user admins (for group_admins to know which groups they can moderate)
  (select coalesce(array_agg(r.group_id), '{}')
   from roles r
   where r.user_id = u.id
     and r.role_type = 'group_admin'
     and r.org_id = u.org_id) as admin_group_ids,
  -- Groups the user is a member of
  (select coalesce(array_agg(gm.group_id), '{}')
   from group_memberships gm
   where gm.user_id = u.id) as member_group_ids
from users u
left join orgs o on o.id = u.org_id
where u.auth_user_id = auth.uid();

-- Anyone can query their own session
grant select on my_session to authenticated;
