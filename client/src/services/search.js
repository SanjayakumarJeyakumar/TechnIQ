import { supabase } from './supabaseClient'

/**
 * Calls the search_students RPC (see supabase/migrations/0006_search_scope.sql).
 * Server enforces:
 * - scope ('same_college' | 'any_college')
 * - can_teach = true
 * - skill name match
 * - self-exclusion
 * - authenticated session
 */
export async function searchStudents(query, { limit = 40, scope = 'same_college' } = {}) {
  const trimmed = query.trim()
  if (!trimmed) return []

  const { data, error } = await supabase.rpc('search_students', {
    p_query: trimmed,
    p_limit: limit,
    p_offset: 0,
    p_scope: scope,
  })

  if (error) throw error
  return data || []
}
