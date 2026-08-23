import { supabase } from './supabaseClient'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2MB — matches the storage bucket config
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function updateProfile(userId, fields) {
  const { data, error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Validates and uploads an avatar file to the `avatars` bucket under the
 * user's own folder (required by the storage RLS policy — see
 * supabase/migrations/0004_storage.sql), then returns its public URL.
 * Does NOT write profiles.avatar_url itself — call updateProfile after.
 */
export async function uploadAvatar(userId, file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please upload a JPEG, PNG, or WEBP image.')
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error('Image must be smaller than 2MB.')
  }

  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600' })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
