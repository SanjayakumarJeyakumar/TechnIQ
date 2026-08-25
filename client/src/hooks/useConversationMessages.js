import { useEffect, useState, useCallback } from 'react'
import { fetchMessages, subscribeToMessages, sendMessage as sendMessageApi } from '../services/conversations'

/**
 * Loads the initial page of messages for a conversation, then keeps them
 * live via a Supabase Realtime subscription. Handles its own loading state
 * and cleans up the subscription on unmount / conversationId change.
 */
export function useConversationMessages(conversationId) {
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('loading') // loading | done | error

  useEffect(() => {
    if (!conversationId) return
    let cancelled = false
    setStatus('loading')

    fetchMessages(conversationId)
      .then((data) => {
        if (cancelled) return
        setMessages(data)
        setStatus('done')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load messages:', err)
        setStatus('error')
      })

    const unsubscribe = subscribeToMessages(conversationId, (newMessage) => {
      setMessages((prev) => {
        // Guard against double-appending the message we just optimistically
        // added ourselves when the realtime echo arrives.
        if (prev.some((m) => m.id === newMessage.id)) return prev
        return [...prev, newMessage]
      })
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [conversationId])

  const sendMessage = useCallback(
    async (content) => {
      const sent = await sendMessageApi(conversationId, content)
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]))
      return sent
    },
    [conversationId]
  )

  return { messages, status, sendMessage }
}
