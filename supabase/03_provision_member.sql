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

select email, name, auth_user_id is not null as linked, primary_role
from public.users u
join auth.users au on au.id = u.auth_user_id
where u.email = 'imoreno@example.com';
