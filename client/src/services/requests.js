import { supabase } from './supabaseClient'

const REQUEST_SELECT = `
  id, message, status, created_at, updated_at,
  skill:skills(id, name),
  sender:profiles!learning_requests_sender_id_fkey(id, name, avatar_url, department),
  receiver:profiles!learning_requests_receiver_id_fkey(id, name, avatar_url, department)
`

/**
 * Creates a learning request. The DB has a partial unique index
 * (sender, receiver, skill) where status='pending' — see migration 0001 —
 * so a duplicate pending request throws Postgres error code 23505, which
 * we translate into a friendly message here rather than a raw DB error.
 */
export async function createRequest({ receiverId, skillId, message }) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('learning_requests')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      skill_id: skillId,
      message: message.trim() || null,
    })
    .select(REQUEST_SELECT)
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error("You already have a pending request with this student for this skill.")
    }
    throw error
  }
  return data
}

export async function fetchReceivedRequests(userId) {
  const { data, error } = await supabase
    .from('learning_requests')
    .select(REQUEST_SELECT)
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchSentRequests(userId) {
  const { data, error } = await supabase
    .from('learning_requests')
    .select(REQUEST_SELECT)
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/** Only the receiver may call this (enforced by RLS, not just this check). */
export async function respondToRequest(requestId, status) {
  if (!['accepted', 'rejected'].includes(status)) {
    throw new Error('Invalid response status.')
  }
  const { data, error } = await supabase
    .from('learning_requests')
    .update({ status })
    .eq('id', requestId)
    .select(REQUEST_SELECT)
    .single()

  if (error) throw error
  return data
}

/** Only the sender may cancel, and only while still pending (RLS-enforced). */
export async function cancelRequest(requestId) {
  const { data, error } = await supabase
    .from('learning_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .select(REQUEST_SELECT)
    .single()

  if (error) throw error
  return data
}
