-- ============================================================================
-- TechnIQ — Migration 0004: Storage (avatars bucket)
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,                              -- public read (profile images are public within the app)
  2097152,                           -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Anyone can view avatars (they're rendered on public-ish profile/search pages).
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- A user may only upload/update/delete inside their own folder: avatars/{user_id}/...
-- The frontend must upload to a path prefixed with the user's own uid.
create policy "avatars_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own_folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

comment on policy "avatars_insert_own_folder" on storage.objects is
  'Client uploads to `avatars/{auth.uid()}/filename.ext`. File type/size are also enforced by the bucket config above, not just client-side validation.';
