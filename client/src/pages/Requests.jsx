import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  fetchReceivedRequests, fetchSentRequests,
  respondToRequest, cancelRequest,
  subscribeToRequests,
} from '../services/requests'
import RequestCard from '../components/RequestCard'
import EmptyState from '../components/EmptyState'

export default function Requests() {
  const { user } = useAuth()
  const [tab, setTab] = useState('received')
  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [status, setStatus] = useState('loading')
  const [busyId, setBusyId] = useState(null)

  const loadRequests = useCallback(async (showLoading = true) => {
    if (!user?.id) return
    if (showLoading) setStatus('loading')

    try {
      const [r, s] = await Promise.all([
        fetchReceivedRequests(user.id),
        fetchSentRequests(user.id),
      ])
      setReceived(Array.isArray(r) ? r : [])
      setSent(Array.isArray(s) ? s : [])
      setStatus('done')
    } catch (err) {
      console.error('Failed to load requests:', err)
      setStatus('error')
    }
  }, [user?.id])

  useEffect(() => {
    loadRequests(true)

    if (!user?.id) return
    const unsubscribe = subscribeToRequests(user.id, () => {
      loadRequests(false)
    })

    return () => {
      unsubscribe()
    }
  }, [user?.id, loadRequests])

  async function handleAccept(id) {
    setBusyId(id)
    try {
      const updated = await respondToRequest(id, 'accepted')
      setReceived((rows) => rows.map((r) => (r.id === id ? updated : r)))
    } catch (err) {
      console.error('Failed to accept request:', err)
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id) {
    setBusyId(id)
    try {
      const updated = await respondToRequest(id, 'rejected')
      setReceived((rows) => rows.map((r) => (r.id === id ? updated : r)))
    } catch (err) {
      console.error('Failed to decline request:', err)
    } finally {
      setBusyId(null)
    }
  }

  async function handleCancel(id) {
    setBusyId(id)
    try {
      const updated = await cancelRequest(id)
      setSent((rows) => rows.map((r) => (r.id === id ? updated : r)))
    } catch (err) {
      console.error('Failed to cancel request:', err)
    } finally {
      setBusyId(null)
    }
  }

  const pendingReceivedCount = received.filter((r) => r.status === 'pending').length
  const pendingSentCount = sent.filter((s) => s.status === 'pending').length
  const activeList = tab === 'received' ? received : sent

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: '#FFFFFF', marginBottom: 'var(--sp-1)' }}>Learning Requests</h1>
        <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-base)', margin: 0 }}>
          Manage structured requests to learn or teach skills with your peers.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', background: 'var(--surface-1)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-3)', width: 'fit-content' }}>
        <TabButton active={tab === 'received'} onClick={() => setTab('received')}>
          Received {pendingReceivedCount > 0 && <span style={{ background: 'var(--brand-primary)', color: '#0F1115', padding: '1px 6px', borderRadius: 'var(--radius-pill)', fontSize: '11px', fontWeight: 700, marginLeft: 4 }}>{pendingReceivedCount}</span>}
        </TabButton>
        <TabButton active={tab === 'sent'} onClick={() => setTab('sent')}>
          Sent{pendingSentCount > 0 ? ` (${pendingSentCount})` : ''}
        </TabButton>
      </div>

      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <EmptyState title="Couldn't load your requests" description="Please try refreshing the page." />
      )}

      {status === 'done' && activeList.length === 0 && (
        <EmptyState
          title={tab === 'received' ? 'No pending learning requests' : "You haven't sent any requests yet"}
          description={
            tab === 'received'
              ? 'When another student from your college requests your help with a skill, it will appear here.'
              : 'Search for a skill and connect with a peer to get started.'
          }
        />
      )}

      {status === 'done' && activeList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {activeList.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              direction={tab}
              busy={busyId === request.id}
              onAccept={handleAccept}
              onReject={handleReject}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: 'var(--sp-2) var(--sp-4)',
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--surface-3)' : 'transparent',
        color: active ? '#FFFFFF' : 'var(--ink-500)',
        fontSize: 'var(--text-sm)',
        fontWeight: active ? 600 : 500,
        display: 'inline-flex',
        alignItems: 'center',
        transition: 'all var(--dur-fast) var(--ease-out)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
