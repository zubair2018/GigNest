import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  const location = useLocation()
  const navigate = useNavigate()
  const containerRef = useRef(null)

  const [openMenu, setOpenMenu] = useState(null)
  const [error, setError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    setOpenMenu(null)
  }, [location.pathname, location.search])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpenMenu(null)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpenMenu(null)
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function toggleMenu(name) {
    setOpenMenu(current => (current === name ? null : name))
  }

  async function handleLogout() {
    setSigningOut(true)
    setError('')

    try {
      await logout()
      setOpenMenu(null)
      navigate('/')
    } catch {
      setError('Unable to sign out. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }

  const freelancerDestination = user
    ? '/post-skill'
    : '/signup?intent=freelancer'

  return (
    <header className="gs-header" ref={containerRef}>
      <div className="gs-container gs-navbar">
        <Link to="/" className="gs-logo" aria-label="Gigspot home">
          gigspot<span>.</span>
        </Link>

        <nav className="gs-desktop-nav" aria-label="Main navigation">
          <Link to="/?type=skills#explore">Explore services</Link>

          <div className="gs-menu-container">
            <button
              type="button"
              className="gs-nav-button"
              aria-expanded={openMenu === 'pro'}
              aria-controls="gigspot-pro-menu"
              onClick={() => toggleMenu('pro')}
            >
              Gigspot Pro
              <span aria-hidden="true">⌄</span>
            </button>

            {openMenu === 'pro' && (
              <div className="gs-dropdown" id="gigspot-pro-menu">
                <Link to="/?type=skills#explore">
                  <strong>I am looking to hire</strong>
                  <span>Find people who can bring your ideas to life.</span>
                </Link>

                <Link to={freelancerDestination}>
                  <strong>I want to offer skills</strong>
                  <span>Create a service and share your work.</span>
                </Link>

                <p>
                  Free hiring and freelancing tools.
                  No paid Pro subscription is offered yet.
                </p>
              </div>
            )}
          </div>

          {user ? (
            <>
              <Link className="gs-button gs-button-spark" to="/post-job">Post a request</Link>
              <NavLink to="/messages">Messages</NavLink>
              <NavLink to="/my-skills">My Skills</NavLink>
              <NavLink to="/my-jobs">My Jobs</NavLink>

              <div className="gs-menu-container">
                <button
                  type="button"
                  className="gs-avatar"
                  onClick={() => toggleMenu('account')}
                  aria-label="Open account menu"
                  aria-expanded={openMenu === 'account'}
                  aria-controls="gigspot-account-menu"
                >
                  {(user.displayName || user.email || 'G')
                    .charAt(0)
                    .toUpperCase()}
                </button>

                {openMenu === 'account' && (
                  <div className="gs-dropdown" id="gigspot-account-menu">
                    <div className="gs-account-summary">
                      <strong>{user.displayName || 'Gigspot member'}</strong>
                      <span>{user.email}</span>
                    </div>

                    <Link to="/post-skill">Offer a skill</Link>
                    <Link to="/post-job">Post a hiring request</Link>
                    <Link to="/saved">Saved listings</Link>

                    <button
                      type="button"
                      className="gs-dropdown-action"
                      onClick={handleLogout}
                      disabled={signingOut}
                    >
                      {signingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to={freelancerDestination}>Join as freelancer</Link>
              <Link to="/signin">Sign in</Link>
              <Link className="gs-button gs-button-outline" to="/signup">
                Join
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          className="gs-mobile-toggle"
          onClick={() => toggleMenu('mobile')}
          aria-label="Toggle navigation"
          aria-expanded={openMenu === 'mobile'}
          aria-controls="gigspot-mobile-menu"
        >
          {openMenu === 'mobile' ? 'Close' : 'Menu'}
        </button>
      </div>

      {openMenu === 'mobile' && (
        <nav
          className="gs-mobile-nav gs-container"
          id="gigspot-mobile-menu"
          aria-label="Mobile navigation"
        >
          <Link to="/?type=skills#explore">I am looking to hire</Link>
          <Link to={freelancerDestination}>I want to offer skills</Link>

          {user ? (
            <>
              <Link to="/post-job">Post a request</Link>
              <Link to="/my-skills">My Skills</Link>
              <Link to="/my-jobs">My Jobs</Link>
              <Link to="/messages">Messages</Link>
              <Link to="/saved">Saved listings</Link>

              <button
                type="button"
                className="gs-nav-button"
                disabled={signingOut}
                onClick={handleLogout}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/signin">Sign in</Link>
              <Link to="/signup">Create account</Link>
            </>
          )}
        </nav>
      )}

      {error && (
        <div className="gs-container">
          <p className="gs-alert" role="alert">{error}</p>
        </div>
      )}
    </header>
  )
}