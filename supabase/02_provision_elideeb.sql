-- FellowshipFeed: link elideeb@gmail.com as platform owner
--
-- PREREQUISITES:
-- 1. Run anchor_schema.sql
-- 2. Run anchor_auth_trigger.sql
-- 3. Create Auth user: elideeb@gmail.com / 123456 (Auto Confirm: ON)
-- 4. Run this script

update public.users
set
  email = 'elideeb@gmail.com',
  name = 'Eli Deeb',
  initials = 'ED'
where id = '00000000-0000-0000-0000-000000000001';

update public.users u
set auth_user_id = au.id
from auth.users au
where u.id = '00000000-0000-0000-0000-000000000001'
  and au.email = 'elideeb@gmail.com';

select email, name, auth_user_id is not null as linked, primary_role
from public.my_session;
