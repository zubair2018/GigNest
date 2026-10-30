import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'

import { auth } from '../firebase/config'
import { createOrUpdateUser } from '../firebase/db'

function safeReturnTo(value, fallback = '/my-jobs') {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback
  }

  const url = new URL(value, window.location.origin)
  if (url.origin !== window.location.origin) return fallback
  if (['/signin', '/signup', '/forgot-password', '/verify-email'].includes(url.pathname)) {
    return fallback
  }

  return `${url.pathname}${url.search}${url.hash}`
}

function getAuthError(error) {
  const messages = {
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/invalid-credential': 'Your email or password is incorrect.',
    'auth/user-not-found': 'Your email or password is incorrect.',
    'auth/wrong-password': 'Your email or password is incorrect.',
    'auth/email-already-in-use':
      'An account already uses this email. Please sign in.',
    'auth/weak-password': 'Choose a stronger password.',
    'auth/password-does-not-meet-requirements':
      'Your password does not meet this project’s password policy.',
    'auth/too-many-requests':
      'Too many attempts. Please wait before trying again.',
    'auth/network-request-failed':
      'Check your internet connection and try again.',
    'auth/operation-not-allowed':
      'Email/password authentication is not enabled in Firebase yet.',
  }

  return messages[error?.code] || 'Unable to complete this request. Please try again.'
}

export default function AuthPage({ mode = 'signin', internalOnly = false }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, authError, signInWithGoogle, signingIn } = useAuth()
  const location = useLocation()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [accountCreated, setAccountCreated] = useState(false)

  const signup = mode === 'signup'
  const resettingPassword = mode === 'reset'
  const requestedReturnTo = params.get('returnTo')
  const signupFallback = params.get('intent') === 'freelancer' ? '/my-skills' : '/my-jobs'

  useEffect(() => {
    if (!user || signup || resettingPassword) return

    const destination = safeReturnTo(requestedReturnTo, signupFallback)
    const target = user.emailVerified
      ? destination
      : `/verify-email?returnTo=${encodeURIComponent(destination)}`

    if (`${location.pathname}${location.search}` !== target) {
      navigate(target, { replace: true })
    }
  }, [user, signup, resettingPassword, requestedReturnTo, signupFallback, location.pathname, location.search, navigate])

  useEffect(() => {
    setError('')
    setMessage('')
    setAccountCreated(false)
    setForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
  }, [mode])

  function updateField(event) {
    const { name, value } = event.target

    setForm(current => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (signup) {
      const name = form.name.trim()

      if (name.length < 2 || name.length > 60) {
        setError('Your name must contain between 2 and 60 characters.')
        return
      }

      if (form.password.length < 6) {
        setError('Use a password containing at least 6 characters.')
        return
      }

      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    setBusy(true)

    try {
      if (resettingPassword) {
        try {
          await sendPasswordResetEmail(auth, form.email.trim())
        } catch (resetError) {
          if (resetError?.code !== 'auth/user-not-found') throw resetError
        }

        setMessage(
          'If an account exists for this email, a password-reset link has been requested. Check your inbox and spam folder.'
        )

        return
      }

      if (signup) {
        const result = await createUserWithEmailAndPassword(
          auth,
          form.email.trim(),
          form.password
        )

        setAccountCreated(true)

        try {
          await updateProfile(result.user, {
            displayName: form.name.trim(),
          })
        } catch {
          setError(
            'Your account was created, but your display name could not be saved. You can update it when profile settings are added.'
          )
        }

        try {
          await createOrUpdateUser(result.user)
        } catch (profileError) {
          console.warn('Signup succeeded, but profile sync failed:', profileError)
        }

        try {
          await sendEmailVerification(result.user)

          setMessage(
            'We sent a verification link. Verify your email before posting or messaging.'
          )
        } catch {
          setError(
            'Your account was created, but the verification email could not be sent. Do not create another account; sign in and request verification again.'
          )
        }

        const fallback = params.get('intent') === 'freelancer' ? '/my-skills' : '/my-jobs'
        navigate(`/verify-email?returnTo=${encodeURIComponent(safeReturnTo(params.get('returnTo'), fallback))}`, { replace: true })
        return
      }

      const result = await signInWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      )

      try {
        await createOrUpdateUser(result.user)
      } catch (profileError) {
        console.warn('Email sign-in succeeded, but profile sync failed:', profileError)
      }

      if (!result.user.emailVerified) {
        const fallback = params.get('intent') === 'freelancer' ? '/my-skills' : '/my-jobs'
        navigate(`/verify-email?returnTo=${encodeURIComponent(safeReturnTo(params.get('returnTo'), fallback))}`, { replace: true })
        return
      }

      navigate(
        safeReturnTo(
          params.get('returnTo'),
          params.get('intent') === 'freelancer' ? '/my-skills' : '/my-jobs'
        ),
        { replace: true }
      )
    } catch (error) {
      setError(getAuthError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="gs-auth-shell">
      <section className="gs-auth-card">
        <Link to="/" className="gs-logo">
          gigspot<span>.</span>
        </Link>

        <p className="gs-eyebrow">
          {resettingPassword ? 'Account recovery' : 'Your next opportunity starts here'}
        </p>

        <h1>
          {resettingPassword
            ? 'Reset your password'
            : signup
              ? 'Create your account'
              : 'Welcome back'}
        </h1>

        <p className="gs-auth-description">
          {resettingPassword
            ? 'Enter your email and we’ll request a password-reset link.'
            : signup
              ? 'One account for hiring professionals and offering your skills.'
              : 'Sign in to manage your listings and conversations.'}
        </p>

        {(error || authError) && (
          <p className="gs-alert" role="alert">
            {error || authError}
          </p>
        )}

        {message && (
          <p className="gs-alert gs-alert-success" role="status">
            {message}
          </p>
        )}

        {accountCreated ? (
          <div className="gs-auth-created">
            <Link
              className="gs-button gs-button-full"
              to={`/verify-email?returnTo=${encodeURIComponent(safeReturnTo(params.get('returnTo')) )}`}
            >
              Verify your email
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="gs-auth-form">
            {signup && (
              <label>
                <span>Full name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  autoComplete="name"
                  minLength={2}
                  maxLength={60}
                  required
                />
              </label>
            )}

            <label>
              <span>Email address</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>

            {!resettingPassword && (
              <label>
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={updateField}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  minLength={signup ? 6 : undefined}
                  maxLength={128}
                  required
                />
              </label>
            )}

            {signup && (
              <>
                <label>
                  <span>Confirm password</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={updateField}
                    autoComplete="new-password"
                    maxLength={128}
                    required
                  />
                </label>

                <p className="gs-auth-hint">
                  Use at least 6 characters and a password you do not use
                  for another account.
                </p>
              </>
            )}

            <button
              type="submit"
              className="gs-button gs-button-full"
              disabled={busy}
            >
              {busy
                ? 'Please wait…'
                : resettingPassword
                  ? 'Send reset email'
                  : signup
                    ? 'Create account'
                    : 'Sign in'}
            </button>
          </form>
        )}

        {!signup && !resettingPassword && (
          <button
            type="button"
            className="gs-button gs-button-outline gs-button-full gs-google-button"
            disabled={busy || signingIn}
            onClick={async () => {
              setError('')
              await signInWithGoogle()
            }}
          >
            {signingIn ? 'Signing in…' : 'Continue with Google'}
          </button>
        )}

        {internalOnly ? (
          <p className="gs-auth-hint">
            Access requires an administrator claim assigned through a trusted process.
          </p>
        ) : !accountCreated && (
          <div className="gs-auth-links">
            {resettingPassword ? (
              <Link to="/signin">Back to sign in</Link>
            ) : (
              <>
                <p>
                  {signup ? 'Already a member?' : 'New to Gigspot?'}{' '}
                  <Link to={signup ? '/signin' : '/signup'}>
                    {signup ? 'Sign in' : 'Create an account'}
                  </Link>
                </p>

                {!signup && (
                  <Link to="/forgot-password">Forgot your password?</Link>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </main>
  )
}