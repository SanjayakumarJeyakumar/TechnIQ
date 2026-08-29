import { supabase } from './supabaseClient'

/**
 * Fetches top student helpers for a given college ordered by students_helped.
 */
export async function fetchCollegeLeaderboard(collegeId, limit = 20) {
  if (!collegeId) return []

  // Fetch top profiles in college
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, department, year, students_helped, can_teach, colleges(name)')
    .eq('college_id', collegeId)
    .order('students_helped', { ascending: false })
    .order('name', { ascending: true })
    .limit(limit)

  if (profileError) throw profileError
  if (!profiles || profiles.length === 0) return []

  // Fetch skills for these students
  const userIds = profiles.map((p) => p.id)
  const { data: userSkills, error: skillsError } = await supabase
    .from('user_skills')
    .select('user_id, skills(id, name, category)')
    .in('user_id', userIds)

  if (skillsError) {
    console.error('Failed to load leaderboard skills:', skillsError)
  }

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
