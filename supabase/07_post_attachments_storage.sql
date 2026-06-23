-- Supabase Storage for post file attachments (images, video, audio, PDF)
-- Run in Supabase SQL Editor after anchor_schema.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-attachments',
  'post-attachments',
  true,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
    'video/mp4', 'video/quicktime', 'video/webm',
    'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/aac',
    'application/pdf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists post_attachments_public_read on storage.objects;
create policy post_attachments_public_read on storage.objects
  for select using (bucket_id = 'post-attachments');

drop policy if exists post_attachments_authenticated_upload on storage.objects;
create policy post_attachments_authenticated_upload on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-attachments');

drop policy if exists post_attachments_authenticated_update on storage.objects;
create policy post_attachments_authenticated_update on storage.objects
  for update to authenticated
  using (bucket_id = 'post-attachments');

drop policy if exists post_attachments_authenticated_delete on storage.objects;
create policy post_attachments_authenticated_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-attachments');

-- Allow authors to insert attachment rows on their pending posts
drop policy if exists attachments_author_insert on attachments;
create policy attachments_author_insert on attachments
  for insert with check (
    exists (
      select 1 from posts p
      where p.id = attachments.post_id
        and p.author_id = current_user_id()
        and p.status = 'pending'
    )
  );
