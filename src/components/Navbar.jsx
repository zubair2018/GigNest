import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { user, signInWithGoogle, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menu, setMenu] = useState(false)

  return (
    <nav style={{ background: 'var(--forest)' }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-[60px] flex items-center justify-between">
        <Link to="/" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--cream)' }} className="text-xl font-black tracking-tight">
          Gigs<span style={{ color: 'var(--gold)' }}>Nest</span>
        </Link>

        <div className="flex items-center gap-1">
          {user && (
            <>
              <Link to="/my-jobs" className="text-xs px-3 py-2 rounded-lg transition-all hidden sm:block"
                style={{ color: location.pathname === '/my-jobs' ? 'var(--gold)' : 'rgba(246,233,208,0.6)', background: location.pathname === '/my-jobs' ? 'rgba(246,233,208,0.08)' : 'transparent' }}>
                My Posts
              </Link>
              <Link to="/saved" className="text-xs px-3 py-2 rounded-lg transition-all hidden sm:block"
                style={{ color: location.pathname === '/saved' ? 'var(--gold)' : 'rgba(246,233,208,0.6)', background: location.pathname === '/saved' ? 'rgba(246,233,208,0.08)' : 'transparent' }}>
                Saved
              </Link>
            </>
          )}

          {user ? (
            <div className="flex items-center gap-2 ml-2">
              <button onClick={() => navigate('/post')} className="btn-gold text-xs px-4 py-2">
                + Post Job
              </button>
              <div className="relative">
                <button onClick={() => setMenu(!menu)}
                  className="w-8 h-8 rounded-full overflow-hidden border-2 transition-all flex-shrink-0"
                  style={{ borderColor: menu ? 'var(--gold)' : 'rgba(246,233,208,0.25)' }}>
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--gold)', color: 'var(--forest)' }}>
                        {user.displayName?.[0] || '?'}
                      </div>
                  }
                </button>
                {menu && (
                  <div className="absolute right-0 top-11 rounded-xl shadow-2xl p-1.5 w-52 z-50"
                    style={{ background: 'var(--cream)', border: '1px solid rgba(4,50,34,0.15)' }}
                    onMouseLeave={() => setMenu(false)}>
                    <div className="px-3 py-2 mb-1">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--forest)' }}>{user.displayName}</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--muted)' }}>{user.email}</p>
                    </div>
                    <hr style={{ borderColor: 'rgba(4,50,34,0.1)' }} className="mb-1" />
                    <Link to="/my-jobs" onClick={() => setMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-all sm:hidden"
                      style={{ color: 'var(--forest)' }}>
                      📋 My Posts
                    </Link>
                    <Link to="/saved" onClick={() => setMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-all sm:hidden"
                      style={{ color: 'var(--forest)' }}>
                      🔖 Saved Jobs
                    </Link>
                    <button onClick={() => { logout(); setMenu(false) }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg transition-all"
                      style={{ color: '#dc2626' }}>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button onClick={signInWithGoogle} className="btn-gold ml-2 text-xs px-4 py-2 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9L37.4 9.3C34 6.2 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-7.9 19.6-20 0-1.3-.1-2.7-.4-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3 0 5.7 1.1 7.8 2.9L37.4 9.3C34 6.2 29.2 4 24 4c-7.7 0-14.4 4.1-18.1 10.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5.1l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-2.9-11.3-7H6.1C9.6 39.5 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.7 2.1-2 3.9-3.8 5.2l6.2 5.2C41.2 35.2 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
              </svg>
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
