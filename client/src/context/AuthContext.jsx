import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'

const AuthContext = createContext(undefined)

/**
 * Owns the Supabase session and the current user's `profiles` row.
 *
 * `profile === null` (after loading) means: authenticated, but no profile
 * row yet — a bare row is actually auto-created by the
 * handle_new_auth_user() trigger the moment auth.users gets a row, so in
 * practice this state is "profile exists but onboarding hasn't been
 * completed" (see `isOnboarded` below), not "no row at all". Phase 4 will
 * decide onboarding-completeness from real profile fields (e.g. whether
 * skills have been selected); for now this is a scaffold.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load profile:', error.message)
      setProfile(null)
      return
    }
    setProfile(data)
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      if (session?.user?.id) await fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        if (newSession?.user?.id) {
          await fetchProfile(newSession.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const refreshProfile = useCallback(() => {
    if (session?.user?.id) return fetchProfile(session.user.id)
    return Promise.resolve()
  }, [session, fetchProfile])

  // Placeholder rule until Phase 4 defines the real onboarding-completion
  // criteria (skills selected, can_teach set, etc.) — department is the
  // first field the wizard writes, so its presence is a reasonable proxy.
  const isOnboarded = Boolean(profile?.department)

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isOnboarded,
    signInWithGoogle,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
