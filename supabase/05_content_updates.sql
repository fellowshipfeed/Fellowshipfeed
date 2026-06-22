-- Disable livestream, weekly bulletin, and contact us for St. Luke
update public.org_resources
set enabled = false
where org_id = '11111111-1111-1111-1111-111111111111'
  and resource_id in (
    select id from public.standard_resources
    where key in ('livestream', 'bulletin', 'contact')
  );

-- Isabel Moreno: member of Young Adults and Women's Fellowship
insert into public.group_memberships (user_id, group_id)
values
  ('33333333-3333-3333-3333-333333333010', '22222222-2222-2222-2222-222222222004')
on conflict do nothing;
