import { useState, useEffect } from 'react'
import { Id } from '../../convex/_generated/dataModel'

export interface SessionUser {
  userId: Id<'users'>
  email: string
  name: string
}

const SESSION_KEY = 'safeguard-user-session'

/**
 * Get the current user session from localStorage
 */
export function useUserSession() {
  // Initialize from localStorage
  const [session, setSessionState] = useState<SessionUser | null>(() => {
    if (typeof window === 'undefined') return null

    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return null

    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  })

  // Sync to localStorage whenever session changes
  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [session])

  const login = (user: SessionUser) => {
    setSessionState(user)
  }

  const logout = () => {
    setSessionState(null)
  }

  return {
    user: session,
    login,
    logout,
    isAuthenticated: !!session,
  }
}
