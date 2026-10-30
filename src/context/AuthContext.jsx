import { createContext, useContext, useEffect, useState } from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  reload,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config'
import { createOrUpdateUser } from '../firebase/db'

const AuthContext = createContext(null)

function readableAuthError(error) {
  const code = error?.code || ''

  if (code === 'auth/popup-closed-by-user') {
    return 'The sign-in window was closed before login finished.'
  }

  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the Google sign-in popup. Please allow popups and try again.'
  }

  if (code === 'auth/cancelled-popup-request') {
    return 'The previous sign-in request was cancelled. Please try again.'
  }

  if (code === 'auth/unauthorized-domain') {
    return 'This website domain is not authorised in Firebase Authentication. Add this domain in Firebase Authentication settings.'
  }

  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your internet connection and try again.'
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return 'This email is already connected to a different sign-in method.'
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled in Firebase Authentication.'
  }

  if (code === 'auth/internal-error') {
    return 'Firebase returned an internal error. Check your Firebase configuration and try again.'
  }

  return error?.message || 'Sign-in failed. Please try again.'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function handleGoogleRedirect() {
      try {
        const result = await getRedirectResult(auth)

        if (result?.user) {
          try {
            await createOrUpdateUser(result.user)
          } catch (profileError) {
            console.warn('Redirect sign-in succeeded, but profile sync failed:', profileError)
          }
        }
      } catch (error) {
        console.error('Google redirect sign-in error:', error)

        if (isMounted) {
          setAuthError(readableAuthError(error))
        }
      }
    }

    handleGoogleRedirect()

    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (!isMounted) return

      setUser(currentUser)
      setLoading(false)

    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  async function signInWithGoogle() {
    if (signingIn) return

    setSigningIn(true)
    setAuthError('')

    try {
      const result = await signInWithPopup(auth, googleProvider)
      try {
        await createOrUpdateUser(result.user)
      } catch (profileError) {
        console.warn('Google sign-in succeeded, but profile sync failed:', profileError)
      }
      return result?.user || null
    } catch (error) {
      console.error('Google popup sign-in error:', error)

      const needsRedirect =
        error?.code === 'auth/popup-blocked' ||
        error?.code === 'auth/cancelled-popup-request'

      if (needsRedirect) {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch (redirectError) {
          console.error('Google redirect fallback error:', redirectError)
          setAuthError(readableAuthError(redirectError))
        }
      } else {
        setAuthError(readableAuthError(error))
      }
    } finally {
      setSigningIn(false)
    }
  }

  async function refreshCurrentUser() {
    const currentUser = auth.currentUser
    if (!currentUser) return null

    await reload(currentUser)
    await currentUser.getIdToken(true)
    setUser(auth.currentUser)
    return auth.currentUser
  }

  async function logout() {
    setAuthError('')

    try {
      await signOut(auth)
    } catch (error) {
      console.error('Sign-out error:', error)
      setAuthError('Could not sign out. Please try again.')
      throw error
    }
  }

  function clearAuthError() {
    setAuthError('')
  }

  const value = {
    user,
    loading,
    signingIn,
    authError,
    signInWithGoogle,
    refreshCurrentUser,
    logout,
    clearAuthError,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside an AuthProvider component.'
    )
  }

  return context
}