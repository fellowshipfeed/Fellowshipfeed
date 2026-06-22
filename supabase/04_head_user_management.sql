-- Allow parish heads to update member names in their org
create policy users_head_update on public.users
  for update
  using (
    org_id is not null
    and public.is_head_of(org_id)
  )
  with check (
    org_id is not null
    and public.is_head_of(org_id)
  );
