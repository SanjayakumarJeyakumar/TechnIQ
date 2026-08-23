import { supabase } from './supabaseClient'

/**
 * Calls the search_students RPC (see supabase/migrations/0002 + 0005).
 * All the real filtering — same college, can_teach, skill match,
 * self-exclusion — happens server-side inside the RPC. This function does
 * NOT re-implement any of that logic client-side.
 */
export async function searchStudents(query, { limit = 40 } = {}) {
  const trimmed = query.trim()
  if (!trimmed) return []

  const { data, error } = await supabase.rpc('search_students', {
    p_query: trimmed,
    p_limit: limit,
    p_offset: 0,
  })

  if (error) throw error
  return data
}
