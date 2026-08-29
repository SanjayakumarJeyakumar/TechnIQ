import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConversationMessages } from '../hooks/useConversationMessages'
import { fetchConversationInfo, markConversationRead } from '../services/conversations'
import MessageBubble from '../components/MessageBubble'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function Conversation() {
  const { conversationId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { messages, status, sendMessage } = useConversationMessages(conversationId)
  const [otherUser, setOtherUser] = useState(null)
  const [infoError, setInfoError] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetchConversationInfo(conversationId)
      .then((profile) => { if (!cancelled) setOtherUser(profile) })
      .catch((err) => {
        console.error('Failed to load conversation info:', err)
        if (!cancelled) setInfoError(true)
      })
    return () => { cancelled = true }
  }, [conversationId])

  // Mark as read once messages have loaded — matches "open the thread to
  // clear its unread badge" behavior people expect from chat apps.
  useEffect(() => {
    if (status === 'done') {
      markConversationRead(conversationId).catch((err) =>
        console.error('Failed to mark conversation read:', err)
      )
    }
  }, [status, conversationId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const content = draft.trim()
    if (!content || sending) return

    setSending(true)
    setDraft('')
    try {
      await sendMessage(content)
    } catch (err) {
      console.error('Failed to send message:', err)
      setDraft(content) // restore so nothing's lost
    } finally {
      setSending(false)
    }
  }

  if (infoError) {
    return (
      <EmptyState
        title="Couldn't open this conversation"
        description="It may not exist, or you may not have access to it."
      />
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 64px - var(--sp-6) * 2)', maxWidth: 640,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
        paddingBottom: 'var(--sp-3)', borderBottom: '1px solid var(--ink-100)', marginBottom: 'var(--sp-3)',
      }}>
        <button
          onClick={() => navigate('/messages')}
          style={{ background: 'none', border: 'none', color: 'var(--ink-500)', fontSize: 'var(--text-lg)', padding: 0 }}
          aria-label="Back to conversations"
        >
          ←
        </button>
        {otherUser && (
          <button
            type="button"
            onClick={() => navigate(`/students/${otherUser.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
              background: 'none', border: 'none', padding: 'var(--sp-1) var(--sp-2)',
              borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
              transition: 'background var(--dur-fast) var(--ease-out)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            title="View student profile"
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: 'var(--violet-50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {otherUser.avatar_url ? (
                <img src={otherUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontWeight: 600, color: 'var(--violet-800)', fontSize: 'var(--text-sm)' }}>
                  {otherUser.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-md)', margin: 0, color: 'var(--ink-900)' }}>{otherUser.name}</h2>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--violet-600)' }}>View profile →</span>
            </div>
          </button>
        )}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 'var(--sp-2) 0' }}>
        {status === 'loading' && <LoadingSpinner label="Loading messages…" />}

        {status === 'error' && (
          <EmptyState title="Couldn't load messages" description="Please try refreshing the page." />
        )}

        {status === 'done' && messages.length === 0 && (
          <EmptyState title="No messages yet" description="Say hello and start the conversation." />
        )}

        {status === 'done' && messages.map((m) => (
          <MessageBubble
            key={m.id}
            content={m.content}
            createdAt={m.created_at}
            isOwn={m.sender_id === user.id}
          />
        ))}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 'var(--sp-2)', paddingTop: 'var(--sp-3)' }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          style={{
            flex: 1, padding: 'var(--sp-3) var(--sp-4)', border: '1px solid var(--ink-100)',
            borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-base)',
            background: 'var(--surface-1)', color: 'var(--ink-900)',
          }}
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          style={{
            padding: 'var(--sp-3) var(--sp-5)',
            background: draft.trim() ? 'var(--violet-600)' : 'var(--ink-100)',
            color: draft.trim() ? '#fff' : 'var(--ink-500)',
            border: 'none', borderRadius: 'var(--radius-pill)', fontWeight: 500,
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
