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
 * membership, validate the skill, record peer help, attach optional endorsements,
 * and safely increment the helper's students_helped counter.
 */
export async function recordStudentHelped(helperId, skillId, tags = []) {
  const { data, error } = await supabase.rpc('record_student_helped', {
    p_helper_id: helperId,
    p_skill_id: skillId,
    p_tags: Array.isArray(tags) ? tags : [],
  })

  if (error) throw error
  return data
}

/**
 * Fetches aggregated peer endorsement counts for a student.
 */
export async function fetchStudentEndorsements(studentId) {
  if (!studentId) return []
  try {
    const { data, error } = await supabase.rpc('fetch_student_endorsements', {
      p_user_id: studentId,
    })
    if (error) {
      console.warn('fetch_student_endorsements RPC notice:', error)
      return []
    }
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('fetchStudentEndorsements exception:', err)
    return []
  }
}
