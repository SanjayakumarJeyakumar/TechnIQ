import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConversationMessages } from '../hooks/useConversationMessages'
import { fetchConversationInfo, markConversationRead } from '../services/conversations'
import { blockUser, unblockUser, checkBlockStatus, reportUser } from '../services/safety'
import MessageBubble from '../components/MessageBubble'
import EmptyState from '../components/EmptyState'
import BlockModal from '../components/BlockModal'
import ReportModal from '../components/ReportModal'

export default function Conversation() {
  const { conversationId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { messages, status, sendMessage } = useConversationMessages(conversationId)
  const [otherUser, setOtherUser] = useState(null)
  const [infoError, setInfoError] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetchConversationInfo(conversationId)
      .then((profile) => {
        if (!cancelled && profile) {
          setOtherUser(profile)
          checkBlockStatus(profile.id).then((blocked) => {
            if (!cancelled) setIsBlocked(blocked)
          })
        }
      })
      .catch((err) => {
        console.error('Failed to load conversation info:', err)
        if (!cancelled) setInfoError(true)
      })
    return () => { cancelled = true }
  }, [conversationId])

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
    if (!content || sending || isBlocked) return

    setSending(true)
    setSendError(null)
    setDraft('')
    try {
      await sendMessage(content)
    } catch (err) {
      console.error('Failed to send message:', err)
      setDraft(content)
      setSendError(err.message || 'Failed to deliver message.')
    } finally {
      setSending(false)
    }
  }

  const handleConfirmBlock = async () => {
    if (!otherUser?.id) return
    await blockUser(otherUser.id)
    setIsBlocked(true)
    setShowMenu(false)
  }

  const handleUnblock = async () => {
    if (!otherUser?.id) return
    try {
      await unblockUser(otherUser.id)
      setIsBlocked(false)
    } catch (err) {
      console.error('Unblock failed:', err)
    }
  }

  const handleConfirmReport = async ({ reason, description }) => {
    if (!otherUser?.id) return
    await reportUser(otherUser.id, { reason, description })
    setShowMenu(false)
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
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100dvh - 64px - var(--sp-5) * 2)',
      maxWidth: 720,
      margin: '0 auto',
      background: 'var(--surface-1)',
      border: '1px solid var(--surface-3)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden',
    }}>
      {/* Conversation Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
        padding: 'var(--sp-3) var(--sp-4)',
        background: 'var(--surface-2)',
        borderBottom: '1px solid var(--surface-3)',
      }}>
        <button
          onClick={() => navigate('/messages')}
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--surface-3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--ink-500)',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            cursor: 'pointer',
          }}
          aria-label="Back to conversations"
        >
          ←
        </button>

        {otherUser && (
          <button
            type="button"
            onClick={() => navigate(`/students/${otherUser.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-3)',
              background: 'none',
              border: 'none',
              padding: '4px 8px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background var(--dur-fast) var(--ease-out)',
              flex: 1,
              minWidth: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            title="View student profile"
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'var(--brand-subtle)',
              border: '1.5px solid var(--surface-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {otherUser.avatar_url ? (
                <img src={otherUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                  {(otherUser.name || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {otherUser.name}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {[otherUser.colleges?.name, otherUser.department].filter(Boolean).join(' · ')}
              </div>
            </div>
          </button>
        )}

        {/* Safety Options Menu */}
        {otherUser && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              aria-label="Conversation options"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--surface-3)',
                color: 'var(--ink-700)',
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.2rem',
                lineHeight: 1,
              }}
            >
              ⋯
            </button>

            {showMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 42,
                background: 'var(--surface-1)',
                border: '1px solid var(--surface-3)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                zIndex: 30,
                minWidth: 160,
                overflow: 'hidden',
              }}>
                {!isBlocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      setShowBlockModal(true)
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span>🚫</span> Block Student
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      handleUnblock()
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--brand-primary)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-subtle)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span>🔓</span> Unblock Student
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    setShowReportModal(true)
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    borderTop: '1px solid var(--surface-3)',
                    color: 'var(--ink-700)',
                    fontSize: 'var(--text-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span>🚩</span> Report User
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Blocked Conversation Notice Banner */}
      {isBlocked && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--sp-2) var(--sp-4)',
          background: 'rgba(239, 68, 68, 0.12)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
        }}>
          <span style={{ fontSize: 'var(--text-xs)', color: '#FCA5A5', fontWeight: 500 }}>
            🚫 This conversation is blocked. Messaging is disabled.
          </span>
          <button
            onClick={handleUnblock}
            className="btn-secondary"
            style={{ padding: '2px 8px', height: 26, fontSize: '11px' }}
          >
            Unblock
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--sp-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-2)',
        }}
      >
        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', padding: 'var(--sp-4)' }}>
            <div className="skeleton" style={{ height: 40, width: '60%', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ height: 40, width: '45%', alignSelf: 'flex-end', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ height: 40, width: '70%', borderRadius: 'var(--radius-md)' }} />
          </div>
        )}

        {status === 'done' && messages.length === 0 && (
          <div style={{ textAlign: 'center', margin: 'auto 0', color: 'var(--ink-500)', fontSize: 'var(--text-sm)', padding: 'var(--sp-6)' }}>
            This is the start of your learning conversation. Say hello to {otherUser?.name || 'your peer'}!
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isMine={msg.sender_id === user?.id} />
        ))}
      </div>

      {sendError && (
        <div style={{
          padding: 'var(--sp-2) var(--sp-4)',
          background: 'var(--danger-bg)',
          color: '#FFFFFF',
          fontSize: 'var(--text-xs)',
          borderTop: '1px solid rgba(239, 68, 68, 0.3)',
        }}>
          ✕ {sendError}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          gap: 'var(--sp-2)',
          padding: 'var(--sp-3) var(--sp-4)',
          background: 'var(--surface-2)',
          borderTop: '1px solid var(--surface-3)',
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isBlocked ? 'Cannot send messages while blocked' : 'Type a message…'}
          disabled={isBlocked || sending}
          className="input-dark"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending || isBlocked}
          className="btn-brand-primary"
          style={{ padding: '0 20px', height: 44 }}
        >
          {sending ? '…' : 'Send'}
        </button>
      </form>

      {showBlockModal && otherUser && (
        <BlockModal
          isOpen={showBlockModal}
          studentName={otherUser.name}
          onClose={() => setShowBlockModal(false)}
          onConfirmBlock={handleConfirmBlock}
        />
      )}

      {showReportModal && otherUser && (
        <ReportModal
          isOpen={showReportModal}
          studentName={otherUser.name}
          onClose={() => setShowReportModal(false)}
          onConfirmReport={handleConfirmReport}
        />
      )}
    </div>
  )
}
