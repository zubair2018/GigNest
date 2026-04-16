import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { user, signInWithGoogle, logout } = useAuth()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)

  return (
    <nav style={{ background: 'var(--forest)' }} className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 h-[60px] flex items-center justify-between">
        <Link to="/" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--cream)' }} className="text-xl font-black tracking-tight">
          Gigs<span style={{ color: 'var(--gold)' }}>Nest</span>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <>
              <Link to="/my-jobs" style={{ color: 'rgba(246,233,208,0.6)', fontSize: 13 }} className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all hidden sm:block">
                My Posts
              </Link>
              <Link to="/saved" style={{ color: 'rgba(246,233,208,0.6)', fontSize: 13 }} className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all hidden sm:block">
                Saved
              </Link>
            </>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/post')} className="btn-gold text-xs sm:text-sm px-3 sm:px-5">
                + Post Job
              </button>
              <div className="relative">
                <button onClick={() => setMenu(!menu)} className="w-8 h-8 rounded-full overflow-hidden border-2 transition-all" style={{ borderColor: 'rgba(246,233,208,0.3)' }}>
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--gold)', color: 'var(--forest)' }}>
                        {user.displayName?.[0]}
                      </div>
                  }
                </button>
                {menu && (
                  <div className="absolute right-0 top-10 rounded-xl shadow-xl p-1 w-44 z-50" style={{ background: 'var(--cream)', border: '1px solid rgba(4,50,34,0.15)' }}>
                    <p className="px-3 py-2 text-xs truncate" style={{ color: 'var(--muted)' }}>{user.displayName}</p>
                    <hr style={{ borderColor: 'rgba(4,50,34,0.1)' }} className="my-1" />
                    <button onClick={() => { logout(); setMenu(false) }} className="w-full text-left px-3 py-2 text-sm rounded-lg transition-all text-red-600 hover:bg-red-50">
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button onClick={signInWithGoogle} className="btn-gold flex items-center gap-2 text-xs sm:text-sm">
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
