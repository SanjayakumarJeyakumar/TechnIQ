import { supabase } from './supabaseClient'

export async function fetchAllSkills() {
  const { data, error } = await supabase
    .from('skills')
    .select('id, name, category')
    .order('category')
    .order('name')

  if (error) throw error
  return data
}

export async function fetchUserSkillIds(userId) {
  const { data, error } = await supabase
    .from('user_skills')
    .select('skill_id')
    .eq('user_id', userId)

  if (error) throw error
  return data.map((row) => row.skill_id)
}

/**
 * Replaces a user's entire skill set with `skillIds`. Simpler and safer for
 * the onboarding wizard (and the future Settings page) than diffing —
 * deletes anything not in the new set, then inserts anything missing.
 * Two round trips, but this only runs on explicit save, not on every click.
 */
export async function setUserSkills(userId, skillIds) {
  const { error: deleteError } = await supabase
    .from('user_skills')
    .delete()
    .eq('user_id', userId)

  if (deleteError) throw deleteError

  if (skillIds.length === 0) return

  const rows = skillIds.map((skillId) => ({ user_id: userId, skill_id: skillId }))
  const { error: insertError } = await supabase.from('user_skills').insert(rows)

  if (insertError) throw insertError
}
