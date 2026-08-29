import { supabase } from './supabaseClient'

/**
 * Fetches top student helpers for the authenticated caller's college.
 * Uses the secure fetch_college_leaderboard RPC to ensure all classmates
 * appear without violating profile email privacy.
 */
export async function fetchCollegeLeaderboard(collegeId, limit = 20) {
  try {
    const { data, error } = await supabase.rpc('fetch_college_leaderboard', {
      p_limit: limit,
    })

    if (!error && Array.isArray(data)) {
      return data.map((p) => ({
        ...p,
        collegeName: p.college_name,
        skills: Array.isArray(p.skills) ? p.skills : [],
      }))
    }

    if (error) {
      console.warn('fetch_college_leaderboard RPC returned error, attempting fallback:', error)
    }
  } catch (err) {
    console.warn('fetch_college_leaderboard RPC exception, attempting fallback:', err)
  }

  // Fallback in case migration 0009 has not yet been executed in remote Supabase
  if (!collegeId) return []
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, department, year, students_helped, can_teach, colleges(name)')
    .eq('college_id', collegeId)
    .order('students_helped', { ascending: false })
    .order('name', { ascending: true })
    .limit(limit)

  if (profileError) throw profileError
  if (!profiles || profiles.length === 0) return []

  const userIds = profiles.map((p) => p.id)
  const { data: userSkills } = await supabase
    .from('user_skills')
    .select('user_id, skills(id, name, category)')
    .in('user_id', userIds)

  const skillsByUser = {}
  userSkills?.forEach((row) => {
    if (!skillsByUser[row.user_id]) skillsByUser[row.user_id] = []
    if (row.skills) skillsByUser[row.user_id].push(row.skills)
  })

  return profiles.map((p) => ({
    ...p,
    collegeName: p.colleges?.name,
    skills: skillsByUser[p.id] || [],
  }))
}
