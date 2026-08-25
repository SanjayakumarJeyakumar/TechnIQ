import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  fetchReceivedRequests, fetchSentRequests,
  respondToRequest, cancelRequest,
} from '../services/requests'
import RequestCard from '../components/RequestCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function Requests() {
  const { user } = useAuth()
  const [tab, setTab] = useState('received')
  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [status, setStatus] = useState('loading')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setStatus('loading')

    Promise.all([fetchReceivedRequests(user.id), fetchSentRequests(user.id)])
      .then(([r, s]) => {
        if (cancelled) return
        setReceived(r)
        setSent(s)
        setStatus('done')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load requests:', err)
        setStatus('error')
      })

    return () => { cancelled = true }
  }, [user])

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
  const activeList = tab === 'received' ? received : sent

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 'var(--text-xl)' }}>Learning requests</h1>

      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
        <TabButton active={tab === 'received'} onClick={() => setTab('received')}>
          Received{pendingReceivedCount > 0 ? ` (${pendingReceivedCount})` : ''}
        </TabButton>
        <TabButton active={tab === 'sent'} onClick={() => setTab('sent')}>
          Sent
        </TabButton>
      </div>

      {status === 'loading' && <LoadingSpinner label="Loading requests…" />}

      {status === 'error' && (
        <EmptyState title="Couldn't load your requests" description="Please try refreshing the page." />
      )}

      {status === 'done' && activeList.length === 0 && (
        <EmptyState
          title={tab === 'received' ? 'No pending learning requests' : "You haven't sent any requests yet"}
          description={
            tab === 'received'
              ? 'When someone wants your help with a skill, it will show up here.'
              : 'Search for a skill and request help from a student to get started.'
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
        padding: 'var(--sp-2) var(--sp-4)', borderRadius: 'var(--radius-pill)',
        border: '1px solid ' + (active ? 'var(--violet-600)' : 'var(--ink-100)'),
        background: active ? 'var(--violet-50)' : 'var(--surface-1)',
        color: active ? 'var(--violet-800)' : 'var(--ink-700)',
        fontSize: 'var(--text-sm)', fontWeight: 500,
      }}
    >
      {children}
    </button>
  )
}
