import { supabase } from './supabaseClient'

/**
 * Blocks another student.
 */
export async function blockUser(blockedId) {
  if (!blockedId) throw new Error('Target user ID is required.')
  const { error } = await supabase.rpc('block_user', {
    p_blocked_id: blockedId,
  })
  if (error) throw error
}

/**
 * Unblocks a previously blocked student.
 */
export async function unblockUser(blockedId) {
  if (!blockedId) throw new Error('Target user ID is required.')
  const { error } = await supabase.rpc('unblock_user', {
    p_blocked_id: blockedId,
  })
  if (error) throw error
}

/**
 * Fetches all students blocked by the current user.
 */
export async function fetchBlockedStudents() {
  const { data, error } = await supabase.rpc('fetch_blocked_students')
  if (error) throw error
  return Array.isArray(data) ? data : []
}

/**
 * Checks if a block exists between the current user and target user.
 */
export async function checkBlockStatus(targetUserId) {
  if (!targetUserId) return false
  const { data, error } = await supabase.rpc('is_user_blocked', {
    p_user_id: targetUserId,
  })
  if (error) {
    console.warn('Block check warning:', error)
    return false
  }
  return Boolean(data)
}

/**
 * Submits a moderation report against a student.
 */
export async function reportUser(reportedUserId, { reason, description = '' }) {
  if (!reportedUserId) throw new Error('Target user ID is required.')
  if (!reason) throw new Error('A reason for reporting is required.')

  const { error } = await supabase.rpc('report_user', {
    p_reported_user_id: reportedUserId,
    p_reason: reason,
    p_description: description.trim() || null,
  })
  if (error) throw error
}

/**
 * Self-serve permanent account wipe.
 */
export async function deleteMyAccount() {
  const { error } = await supabase.rpc('delete_user_account')
  if (error) throw error
  await supabase.auth.signOut()
}
