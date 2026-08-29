import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabaseClient'
import { getAIGuidance } from '../services/ai'
import LoadingSpinner from '../components/LoadingSpinner'
import './AIGuide.css'

const STORAGE_KEY = 'techniq_ai_guide_messages'

const STARTER_PROMPTS = [
  {
    icon: '🧭',
    title: 'Next Learning Steps',
    prompt: 'What should I learn next based on my current skills?',
  },
  {
    icon: '💡',
    title: 'Project Ideas',
    prompt: 'Can you give me a concrete beginner project idea?',
  },
  {
    icon: '🚀',
    title: 'Real-World Applications',
    prompt: 'What are some practical real-world applications for my skills?',
  },
]

export default function AIGuide() {
  const { session, user } = useAuth()
  const [skills, setSkills] = useState([])
  const [loadingSkills, setLoadingSkills] = useState(true)

  // Lazily restore messages synchronously from localStorage
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          return parsed
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved AI Guide messages from localStorage:', e)
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {}
    }
    return []
  })

  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState(null)

  const messagesEndRef = useRef(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      if (messages && messages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (e) {
      console.warn('Failed to save AI Guide messages to localStorage:', e)
    }
  }, [messages])

  useEffect(() => {
    async function loadSkills() {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('user_skills')
          .select('skills(name)')
          .eq('user_id', user.id)

        if (error) throw error
        if (isMounted.current) {
          setSkills(data?.map((d) => d.skills?.name).filter(Boolean) || [])
        }
      } catch (err) {
        console.error('Failed to load skills:', err)
      } finally {
        if (isMounted.current) {
          setLoadingSkills(false)
        }
      }
    }

    loadSkills()
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const handleAsk = async (promptText) => {
    const trimmed = promptText?.trim()
    if (!trimmed || isThinking) return

    const now = new Date()
    const userMessage = {
      role: 'user',
      content: trimmed,
      time: now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setError(null)
    setIsThinking(true)

    try {
      // Retrieve a fresh token reliably from session or getSession()
      let token = session?.access_token
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession()
        token = sessionData?.session?.access_token
      }

      if (!token) {
        throw new Error('Please sign in to ask the AI Guide.')
      }

      const guidance = await getAIGuidance(skills, trimmed, token)
      const assistantTime = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      const assistantMessage = {
        role: 'assistant',
        content: guidance,
        time: assistantTime,
      }

      if (isMounted.current) {
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          const current = saved ? JSON.parse(saved) : []
          if (Array.isArray(current)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, assistantMessage]))
          }
        } catch {}
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message || 'The AI Guide is unavailable right now. Please try again.')
      }
    } finally {
      if (isMounted.current) {
        setIsThinking(false)
      }
    }
  }

  const handleClearChat = () => {
    setMessages([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.warn('Failed to clear AI Guide messages from localStorage:', e)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleAsk(inputValue)
  }

  if (loadingSkills) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
        <LoadingSpinner label="Loading your profile skills..." />
      </div>
    )
  }

  return (
    <div className="ai-guide-page">
      {/* Header */}
      <header className="ai-guide-header">
        <div className="ai-guide-badge">
          <SparklesIcon />
          <span>AI Tutor & Career Path</span>
        </div>
        <h1 className="ai-guide-title">TechnIQ AI Learning Guide</h1>
        <p className="ai-guide-subtitle">
          Personalized next steps, roadmaps, and project ideas crafted around your current skills.
        </p>

        {/* User Skills Chips */}
        {skills.length > 0 && (
          <div className="ai-guide-skills-container">
            <span className="ai-guide-skills-label">Your Skills</span>
            <div className="ai-guide-skills-list">
              {skills.map((skill) => (
                <span key={skill} className="ai-guide-skill-chip">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Chat Interface */}
      <div className="ai-guide-card">
        {/* Chat Header Bar with Clear Chat Action */}
        {messages.length > 0 && (
          <div className="ai-guide-card-header">
            <div className="ai-guide-card-header-left">
              <SparklesIcon />
              <span>Conversation</span>
            </div>
            <button
              type="button"
              onClick={handleClearChat}
              className="ai-guide-clear-btn"
              title="Clear conversation and start a new chat"
            >
              <RotateCcwIcon />
              <span>New Chat</span>
            </button>
          </div>
        )}

        <div className="ai-guide-messages-area">
          {messages.length === 0 ? (
            <div className="ai-guide-welcome">
              <div className="ai-guide-welcome-icon">
                <BrainIcon />
              </div>
              <div className="ai-guide-welcome-text">
                <h3>How can I help you grow today?</h3>
                <p>
                  Pick a starter prompt below or type your own question to get clear, step-by-step guidance.
                </p>
              </div>

              {/* Starter Prompts */}
              <div className="ai-guide-starter-grid">
                {STARTER_PROMPTS.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    className="ai-guide-starter-card"
                    onClick={() => handleAsk(item.prompt)}
                  >
                    <span className="ai-guide-starter-icon">{item.icon}</span>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.875rem' }}>{item.title}</strong>
                    <p className="ai-guide-starter-prompt-text">{item.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === 'user' ? 'user-message-row' : 'ai-message-row'}>
                  {msg.role === 'assistant' && (
                    <div className="ai-avatar" title="TechnIQ AI Guide">
                      <SparklesIcon />
                    </div>
                  )}

                  <div className={msg.role === 'user' ? '' : 'ai-message-body'}>
                    {msg.role === 'assistant' && (
                      <div className="ai-message-meta">
                        <span className="ai-author-name">TechnIQ Guide</span>
                        <span className="ai-message-time">{msg.time}</span>
                      </div>
                    )}

                    <div className={msg.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-assistant'}>
                      {msg.content}
                    </div>

                    {msg.role === 'user' && (
                      <div className="user-message-time">{msg.time}</div>
                    )}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="ai-message-row">
                  <div className="ai-avatar">
                    <SparklesIcon />
                  </div>
                  <div className="ai-message-body">
                    <div className="ai-message-meta">
                      <span className="ai-author-name">TechnIQ Guide</span>
                    </div>
                    <div className="ai-thinking-bubble">
                      <span>Thinking of recommendations</span>
                      <div className="ai-dot-pulse">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="ai-guide-error-banner">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Input Bar */}
        <div className="ai-guide-input-container">
          <form onSubmit={handleSubmit} className="ai-guide-input-form">
            <div className="ai-guide-input-wrapper">
              <input
                type="text"
                className="ai-guide-text-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question or request a learning roadmap..."
                disabled={isThinking}
              />
            </div>
            <button
              type="submit"
              className="ai-guide-submit-button"
              disabled={!inputValue.trim() || isThinking}
            >
              <span>Ask</span>
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function SparklesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function BrainIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-3 3.87A4 4 0 0 0 4 14a4 4 0 0 0 3 3.87V19a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-1.13A4 4 0 0 0 20 14a4 4 0 0 0-1-3.13A4 4 0 0 0 16 7V6a4 4 0 0 0-4-4z" />
      <path d="M9 12a3 3 0 1 0 6 0" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
  )
}

function RotateCcwIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}
