import { useEffect, useState } from 'react'
import { fetchConversations } from '../services/conversations'
import ConversationListItem from '../components/ConversationListItem'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function Messages() {
  const [conversations, setConversations] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    fetchConversations()
      .then((data) => {
        if (cancelled) return
        setConversations(data)
        setStatus('done')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load conversations:', err)
        setStatus('error')
      })

    return () => { cancelled = true }
  }, [])

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 'var(--text-xl)' }}>Messages</h1>

      {status === 'loading' && <LoadingSpinner label="Loading conversations…" />}

      {status === 'error' && (
        <EmptyState title="Couldn't load your conversations" description="Please try refreshing the page." />
      )}

      {status === 'done' && conversations.length === 0 && (
        <EmptyState
          title="No conversations yet"
          description="Once you send or accept a learning request, you'll be able to chat here."
        />
      )}

      {status === 'done' && conversations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {conversations.map((c) => (
            <ConversationListItem key={c.conversation_id} conversation={c} />
          ))}
        </div>
      )}
    </div>
  )
}
