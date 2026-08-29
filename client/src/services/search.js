import { supabase } from './supabaseClient'

/**
 * Searches students by skill (via search_students RPC) or by student name.
 * Supports scope: 'same_college' | 'any_college'
 * type: 'skill' | 'name'
 */
export async function searchStudents(
  query,
  { limit = 40, scope = 'same_college', type = 'skill', collegeId = null } = {}
) {
  const trimmed = query.trim()
  if (!trimmed) return []

  if (type === 'name') {
    return searchStudentsByName(trimmed, { limit, scope, collegeId })
  }

  // Default: Search by Skill using search_students RPC
  const { data, error } = await supabase.rpc('search_students', {
    p_query: trimmed,
    p_limit: limit,
    p_offset: 0,
    p_scope: scope,
  })

  if (error) throw error
  if (!data || data.length === 0) return []

  // Augment with skills for rich student card display
  try {
    const userIds = data.map((s) => s.id)
    const { data: userSkills } = await supabase
      .from('user_skills')
      .select('user_id, skills(name)')
      .in('user_id', userIds)

    if (userSkills && userSkills.length > 0) {
      const skillsByUser = {}
      userSkills.forEach((row) => {
        if (!skillsByUser[row.user_id]) skillsByUser[row.user_id] = []
        if (row.skills?.name) skillsByUser[row.user_id].push(row.skills.name)
      })
      return data.map((student) => ({
        ...student,
        all_skills: skillsByUser[student.id] || (student.matched_skill ? [student.matched_skill] : []),
      }))
    }
  } catch (skillErr) {
    console.warn('Augmenting skills notice:', skillErr)
  }

  return data
}

export async function searchStudentsByName(
  query,
  { limit = 40, scope = 'same_college', collegeId = null } = {}
) {
  const trimmed = query.trim()
  if (!trimmed) return []

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let q = supabase
    .from('public_profiles')
    .select('id, name, avatar_url, department, year, bio, students_helped, college_id, college_name, can_teach')
    .ilike('name', `%${trimmed}%`)

  if (user?.id) {
    q = q.neq('id', user.id)
  }

  if (scope === 'same_college') {
    if (collegeId) {
      q = q.eq('college_id', collegeId)
    } else if (user?.id) {
      const { data: profile } = await supabase.from('profiles').select('college_id').eq('id', user.id).single()
      if (profile?.college_id) {
        q = q.eq('college_id', profile.college_id)
      }
    }
  }

  q = q.order('students_helped', { ascending: false }).order('name', { ascending: true }).limit(limit)

  const { data, error } = await q
  if (error) {
    console.warn('searchStudentsByName public_profiles error:', error)
    return []
  }

  if (!data || data.length === 0) return []

  // Fetch user_skills for student cards
  try {
    const userIds = data.map((s) => s.id)
    const { data: userSkills } = await supabase
      .from('user_skills')
      .select('user_id, skills(name)')
      .in('user_id', userIds)

    const skillsByUser = {}
    userSkills?.forEach((row) => {
      if (!skillsByUser[row.user_id]) skillsByUser[row.user_id] = []
      if (row.skills?.name) skillsByUser[row.user_id].push(row.skills.name)
    })

    return data.map((student) => ({
      ...student,
      all_skills: skillsByUser[student.id] || [],
    }))
  } catch {
    return data.map((student) => ({
      ...student,
      all_skills: [],
    }))
  }
}

