import { supabase } from './supabaseClient'

export async function fetchConversations() {
  const { data, error } = await supabase.rpc('list_conversations')
  if (error) throw error
  return data
}

/** Just the other member's profile info, for the chat header — cheaper
 * than re-running list_conversations when you already have the id from
 * the URL. */
export async function fetchConversationInfo(conversationId) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('conversation_members')
    .select('user_id, profiles(id, name, avatar_url)')
    .eq('conversation_id', conversationId)
    .neq('user_id', user.id)
    .single()

  if (error) throw error
  return data.profiles
}

export async function fetchMessages(conversationId, { limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, read_at, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}

export async function sendMessage(conversationId, content) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, content: content.trim() })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function markConversationRead(conversationId) {
  const { error } = await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId })
  if (error) throw error
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
      (payload) => onInsert(payload.new)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
