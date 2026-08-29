import { useEffect, useState } from 'react'
import { fetchConversations } from '../services/conversations'
import ConversationListItem from '../components/ConversationListItem'
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
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: '#FFFFFF', marginBottom: 'var(--sp-1)' }}>Messages</h1>
        <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-base)', margin: 0 }}>
          Your real-time conversations with student peers and mentors.
        </p>
      </div>

      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton" style={{ height: 74, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <EmptyState title="Couldn't load your conversations" description="Please try refreshing the page." />
      )}

      {status === 'done' && conversations.length === 0 && (
        <EmptyState
          title="No conversations yet"
          description="Once you send or accept a learning request, you'll be able to chat with peers in real-time here."
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
