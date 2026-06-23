-- Fix post approval failing with notifications RLS error.
-- The approve trigger inserts rows for group members, not just the current user.

create or replace function notify_on_post_approved() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and (old.status is null or old.status <> 'approved') then
    insert into notifications (user_id, type, source_post_id, source_user_id, preview)
    select m.mentioned_user_id, 'mention', new.id, new.author_id, substring(new.body for 200)
    from mentions m
    where m.post_id = new.id
      and m.mentioned_user_id <> new.author_id;

    if new.is_parish_wide then
      insert into notifications (user_id, type, source_post_id, source_user_id, preview)
      select u.id, 'parish_post', new.id, new.author_id, substring(new.body for 200)
      from users u
      where u.org_id = new.org_id
        and u.id <> new.author_id
        and not exists (select 1 from mentions m where m.post_id = new.id and m.mentioned_user_id = u.id);
    elsif new.group_id is not null then
      insert into notifications (user_id, type, source_post_id, source_user_id, preview)
      select gm.user_id, 'group_post', new.id, new.author_id, substring(new.body for 200)
      from group_memberships gm
      where gm.group_id = new.group_id
        and gm.user_id <> new.author_id
        and not exists (select 1 from mentions m where m.post_id = new.id and m.mentioned_user_id = gm.user_id);
    end if;
  end if;
  return new;
end;
$$;
