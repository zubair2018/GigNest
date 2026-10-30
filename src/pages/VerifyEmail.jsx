import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { sendEmailVerification } from 'firebase/auth'
import { useAuth } from '../context/AuthContext'
import { auth } from '../firebase/config'

function safeDestination(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/my-jobs'
  }

  const destination = new URL(value, window.location.origin)
  if (destination.origin !== window.location.origin) return '/my-jobs'
  if (['/signin', '/signup', '/forgot-password', '/verify-email'].includes(destination.pathname)) {
    return '/my-jobs'
  }

  return `${destination.pathname}${destination.search}${destination.hash}`
}

export default function VerifyEmail() {
  const { user, refreshCurrentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const destination = safeDestination(params.get('returnTo'))

  useEffect(() => {
    if (user?.emailVerified) navigate(destination, { replace: true })
  }, [user?.emailVerified, destination, navigate])

  if (!user) {
    return <Navigate to={`/signin?returnTo=${encodeURIComponent(destination)}`} replace />
  }

  async function checkVerification() {
    setBusy(true)
    setError('')
    setMessage('')

    try {
      const refreshedUser = await refreshCurrentUser()
      if (!refreshedUser?.emailVerified) {
        setMessage('Email is not verified yet. Open the link in your inbox, then check again.')
      }
    } catch (refreshError) {
      console.error('Email verification refresh failed:', refreshError)
      setError('Could not refresh account status. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function resendVerification() {
    setBusy(true)
    setError('')
    setMessage('')

    try {
      await sendEmailVerification(auth.currentUser)
      setMessage('Verification email sent. Check your inbox and spam folder.')
    } catch (sendError) {
      console.error('Verification email request failed:', sendError)
      setError('Could not send the verification email. Wait a moment and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function switchAccount() {
    await logout()
    navigate(`/signin?returnTo=${encodeURIComponent(destination)}`, { replace: true })
  }

  return (
    <main className="gs-auth-shell">
      <section className="gs-auth-card">
        <Link to="/" className="gs-logo">gigspot<span>.</span></Link>
        <p className="gs-eyebrow">One quick account check</p>
        <h1>Verify your email</h1>
        <p className="gs-auth-description">
          We sent a verification link to <strong>{user.email}</strong>. You need a verified email to publish listings or start conversations.
        </p>

        {error && <p className="gs-alert" role="alert">{error}</p>}
        {message && <p className="gs-alert gs-alert-success" role="status">{message}</p>}

        <div className="gs-auth-form">
          <button type="button" className="gs-button gs-button-full" onClick={checkVerification} disabled={busy}>
            {busy ? 'Checking…' : 'I verified my email'}
          </button>
          <button type="button" className="gs-button gs-button-outline gs-button-full" onClick={resendVerification} disabled={busy}>
            Resend verification email
          </button>
          <button type="button" className="gs-text-button" onClick={switchAccount} disabled={busy}>
            Sign out and use another account
          </button>
        </div>
      </section>
    </main>
  )
}
