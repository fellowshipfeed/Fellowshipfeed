-- Allow group admins/heads to post directly in groups they moderate (even if not a member).
-- Allow attachments on their own approved moderator posts.

drop policy if exists posts_insert on posts;
create policy posts_insert on posts for insert with check (
  author_id = current_user_id()
  and (
    (group_id is not null and (is_in_group(group_id) or can_moderate_group(group_id)))
    or (is_parish_wide and (is_head_of(org_id) or is_owner()))
  )
);

drop policy if exists attachments_author_insert on attachments;
create policy attachments_author_insert on attachments
  for insert with check (
    exists (
      select 1 from posts p
      where p.id = attachments.post_id
        and p.author_id = current_user_id()
        and (
          p.status = 'pending'
          or (p.status = 'approved' and p.group_id is not null and can_moderate_group(p.group_id))
        )
    )
  );
