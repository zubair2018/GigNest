import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { user, signInWithGoogle, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menu, setMenu] = useState(false)

  const active = (path) => location.pathname === path

  return (
    <nav style={{ background: 'var(--forest)' }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-[60px] flex items-center justify-between gap-2">

        <Link to="/" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--cream)' }}
          className="text-xl font-black tracking-tight flex-shrink-0">
          Gig<span style={{ color: 'var(--gold)' }}>Nest</span>
        </Link>

        <div className="flex items-center gap-1.5">
          {user && (
            <>
              <Link to="/messages"
                className="text-xs px-3 py-1.5 rounded-lg transition-all hidden sm:flex items-center gap-1"
                style={{ color: active('/messages') ? 'var(--gold)' : 'rgba(246,233,208,0.6)', background: active('/messages') ? 'rgba(246,233,208,0.08)' : 'transparent' }}>
                💬 Messages
              </Link>
              <Link to="/my-jobs"
                className="text-xs px-3 py-1.5 rounded-lg transition-all hidden sm:block"
                style={{ color: active('/my-jobs') ? 'var(--gold)' : 'rgba(246,233,208,0.6)', background: active('/my-jobs') ? 'rgba(246,233,208,0.08)' : 'transparent' }}>
                My Posts
              </Link>
            </>
          )}

          {user ? (
            <div className="flex items-center gap-1.5">
              {/* Two separate post buttons */}
              <button onClick={() => navigate('/post-job')}
                className="hidden sm:block text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{ background: 'rgba(246,233,208,0.12)', color: 'var(--cream)', border: '1px solid rgba(246,233,208,0.15)' }}>
                🧑‍💼 Post Job
              </button>
              <button onClick={() => navigate('/post-skill')}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{ background: 'var(--gold)', color: 'var(--forest)' }}>
                🙋 Offer Skill
              </button>

              {/* Avatar + menu */}
              <div className="relative ml-1">
                <button onClick={() => setMenu(!menu)}
                  className="w-8 h-8 rounded-full overflow-hidden border-2 transition-all"
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
                    <Link to="/post-job" onClick={() => setMenu(false)} className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-black/5" style={{ color: 'var(--forest)' }}>🧑‍💼 Post a Job</Link>
                    <Link to="/post-skill" onClick={() => setMenu(false)} className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-black/5" style={{ color: 'var(--forest)' }}>🙋 Offer a Skill</Link>
                    <Link to="/my-jobs" onClick={() => setMenu(false)} className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-black/5 sm:hidden" style={{ color: 'var(--forest)' }}>📋 My Posts</Link>
                    <Link to="/saved" onClick={() => setMenu(false)} className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-black/5" style={{ color: 'var(--forest)' }}>🔖 Saved Jobs</Link>
                    <Link to="/messages" onClick={() => setMenu(false)} className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-black/5 sm:hidden" style={{ color: 'var(--forest)' }}>💬 Messages</Link>
                    <hr style={{ borderColor: 'rgba(4,50,34,0.1)' }} className="my-1" />
                    <button onClick={() => { logout(); setMenu(false) }} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-red-50" style={{ color: '#dc2626' }}>Sign out</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button onClick={signInWithGoogle}
              className="text-xs px-4 py-2 rounded-lg font-medium transition-all"
              style={{ background: 'var(--gold)', color: 'var(--forest)' }}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}