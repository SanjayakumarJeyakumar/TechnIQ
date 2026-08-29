import { supabase } from './supabaseClient'

/**
 * Profiles and user_skills are both readable by any authenticated user (see
 * RLS policies in supabase/migrations/0003), so this is a direct table read
 * rather than an RPC — no special server-side filtering is needed to view
 * one specific profile the way there is for search.
 */
export async function fetchStudentProfile(studentId) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, department, year, bio, can_teach, students_helped, colleges(name)')
    .eq('id', studentId)
    .single()

  if (profileError) throw profileError

  const { data: skillRows, error: skillsError } = await supabase
    .from('user_skills')
    .select('skills(id, name, category)')
    .eq('user_id', studentId)

  if (skillsError) throw skillsError

  return {
    ...profile,
    collegeName: profile.colleges?.name,
    skills: skillRows.map((row) => row.skills),
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

