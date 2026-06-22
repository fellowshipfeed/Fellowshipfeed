-- Member portal UI seed: events, pinned parish post, sample reactions
-- Run after anchor_schema.sql on existing databases.

-- Pin the parish picnic post
update posts
set pinned = true
where org_id = '11111111-1111-1111-1111-111111111111'
  and is_parish_wide = true
  and body ilike '%Parish Picnic%';

-- Upcoming events (group_id null = parish-wide)
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
   '2026-10-18 07:30:00-07', 'Parish hall', '33333333-3333-3333-3333-333333333003')
on conflict (id) do nothing;

-- Sample RSVP for married couples date night (any member who runs this gets one RSVP demo)
-- Skip if no users exist yet.

-- Sample reactions on parish picnic post (counts matching mockup)
do $$
declare
  picnic_id uuid;
begin
  select id into picnic_id
  from posts
  where org_id = '11111111-1111-1111-1111-111111111111'
    and is_parish_wide = true
    and body ilike '%Parish Picnic%'
  limit 1;

  if picnic_id is not null then
    insert into reactions (post_id, user_id, kind) values
      (picnic_id, '33333333-3333-3333-3333-333333333002', 'heart'),
      (picnic_id, '33333333-3333-3333-3333-333333333003', 'heart'),
      (picnic_id, '33333333-3333-3333-3333-333333333004', 'heart'),
      (picnic_id, '33333333-3333-3333-3333-333333333010', 'in'),
      (picnic_id, '33333333-3333-3333-3333-333333333011', 'pray'),
      (picnic_id, '33333333-3333-3333-3333-333333333012', 'amen')
    on conflict (post_id, user_id, kind) do nothing;
  end if;
end $$;
