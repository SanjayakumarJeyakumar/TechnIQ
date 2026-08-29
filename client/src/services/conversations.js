import { supabase } from './supabaseClient'

export async function fetchConversations() {
  const { data, error } = await supabase.rpc('list_conversations')
  if (error) throw error
  return data || []
}

/**
 * Loads the other member's profile information for the chat header safely.
 * Uses the secure get_public_profile RPC (or public_profiles view fallback)
 * without violating profile email isolation.
 */
export async function fetchConversationInfo(conversationId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const { data, error } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .neq('user_id', user.id)
    .single()

  if (error) throw error
  if (!data?.user_id) return null

  try {
    const { data: profileRows, error: profileErr } = await supabase.rpc('get_public_profile', {
      p_user_id: data.user_id,
    })

    if (!profileErr && profileRows?.[0]) {
      return profileRows[0]
    }
  } catch (rpcErr) {
    console.warn('get_public_profile RPC fallback:', rpcErr)
  }

  // View fallback
  const { data: viewRow } = await supabase
    .from('public_profiles')
    .select('id, name, avatar_url, college_name, department')
    .eq('id', data.user_id)
    .single()

  return viewRow || { id: data.user_id, name: 'Student Peer' }
}

export async function fetchMessages(conversationId, { limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, read_at, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function sendMessage(conversationId, content) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, content: content.trim() })
    .select('id, conversation_id, sender_id, content, read_at, created_at')
    .single()

  if (error) throw error
  return data
}

export async function markConversationRead(conversationId) {
  const { error } = await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId })
  if (error) {
    console.warn('markConversationRead warning:', error)
  }
}

/**
 * Subscribes to new messages inserted into a specific conversation.
 * Returns an unsubscribe function — always call it in a cleanup effect.
 */
export function subscribeToMessages(conversationId, onInsert) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        if (payload?.new) {
          onInsert(payload.new)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
