import { supabase } from './supabaseClient'

/**
 * Safely fetches public student profile fields using get_public_profile RPC (0007).
 * Strictly guarantees that private fields such as email and internal tokens are never retrieved.
 */
export async function fetchStudentProfile(studentId) {
  const { data: profileRows, error: profileError } = await supabase.rpc('get_public_profile', {
    p_user_id: studentId,
  })

  if (profileError) throw profileError
  const profile = profileRows?.[0]
  if (!profile) throw new Error('Student profile not found.')

  const { data: skillRows, error: skillsError } = await supabase
    .from('user_skills')
    .select('skills(id, name, category)')
    .eq('user_id', studentId)

  if (skillsError) throw skillsError

  return {
    ...profile,
    collegeName: profile.college_name,
    skills: (skillRows || []).map((row) => row.skills).filter(Boolean),
  }
}

/**
 * Calls the secure database RPC `record_student_helped` to verify same-college
 * membership, validate the skill, record peer help, and safely increment
 * the helper's students_helped counter without allowing client-side manipulation.
 */
export async function recordStudentHelped(helperId, skillId) {
  const { data, error } = await supabase.rpc('record_student_helped', {
    p_helper_id: helperId,
    p_skill_id: skillId,
  })

  if (error) throw error
  return data
}
