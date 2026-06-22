-- FellowshipFeed: link member test account (lowest permission)
--
-- PREREQUISITES:
-- 1. Run anchor_schema.sql + anchor_auth_trigger.sql
-- 2. Create Auth user: imoreno@example.com / 123456 (Auto Confirm: ON)
-- 3. Run this script
--
-- After login → /feed

update public.users u
set auth_user_id = au.id
from auth.users au
where u.id = '33333333-3333-3333-3333-333333333010'
  and au.email = 'imoreno@example.com';

select
  u.email,
  u.name,
  u.auth_user_id is not null as linked,
  coalesce(r.role_type, 'member') as role_type
from public.users u
left join public.roles r on r.user_id = u.id
where u.email = 'imoreno@example.com';
