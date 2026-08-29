import { Routes, Route } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'

import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Search from './pages/Search'
import StudentProfile from './pages/StudentProfile'
import Requests from './pages/Requests'
import Messages from './pages/Messages'
import Conversation from './pages/Conversation'
import AIGuide from './pages/AIGuide'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Public / unauthenticated */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Onboarding: authenticated but not gated on isOnboarded (it IS the
          onboarding flow) — RequireAuth special-cases this path. Uses its
          own wider centered wrapper rather than AuthLayout's 420px login
          card, since the skill-selector step needs more room. */}
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <div style={{
              minHeight: '100%', display: 'flex', alignItems: 'flex-start',
              justifyContent: 'center', background: 'var(--surface-0)',
              padding: 'var(--sp-6) var(--sp-5)',
            }}>
              <div style={{ width: '100%', maxWidth: 640 }}>
                <Onboarding />
              </div>
            </div>
          </RequireAuth>
        }
      />

      {/* Authenticated + onboarded app shell */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/students/:studentId" element={<StudentProfile />} />
        <Route path="/profile/:studentId" element={<StudentProfile />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:conversationId" element={<Conversation />} />
        <Route path="/ai-guide" element={<AIGuide />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
