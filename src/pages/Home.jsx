import { useState, useMemo } from 'react'
import { useJobs } from '../hooks/useJobs'
import JobCard from '../components/JobCard'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CATS = ['All', 'Tech', 'Design', 'Local', 'Content', 'Education']

export default function Home() {
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const { jobs, loading, refresh } = useJobs(cat === 'All' ? null : cat)
  const { user, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    let list = [...jobs]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(j =>
        [j.title, j.description, j.location, ...(j.tags || [])].join(' ').toLowerCase().includes(q)
      )
    }
    if (sort === 'pay-high') list.sort((a, b) => b.payMax - a.payMax)
    if (sort === 'pay-low') list.sort((a, b) => a.payMin - b.payMin)
    return list
  }, [jobs, search, sort])

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>

      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-12 pb-10" style={{ background: 'var(--forest)' }}>
        <div className="absolute right-[-80px] top-[-80px] w-[300px] h-[300px] rounded-full opacity-10" style={{ border: '1px solid var(--cream)' }} />
        <div className="absolute right-[40px] bottom-[-100px] w-[180px] h-[180px] rounded-full opacity-5" style={{ border: '1px solid var(--cream)' }} />
        <div className="max-w-6xl mx-auto relative">
          <div className="flex items-center gap-2 mb-4 text-[11px] uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--gold)' }} />
            Kashmir & beyond
          </div>
          <h1 className="font-black tracking-tight leading-none mb-4"
            style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(32px,6vw,52px)', color: 'var(--cream)' }}>
            Find local <em style={{ color: 'var(--gold)' }}>gigs</em> &<br />hire real talent
          </h1>
          <p className="text-base mb-8 max-w-md leading-relaxed" style={{ color: 'rgba(246,233,208,0.6)' }}>
            Post jobs, offer skills, connect instantly. The hyperlocal marketplace built for your city — 100% free.
          </p>
          <div className="flex gap-3 flex-wrap">
            {user
              ? <button onClick={() => navigate('/post')} className="btn-gold">+ Post a Job</button>
              : <button onClick={signInWithGoogle} className="btn-gold">Get Started Free →</button>
            }
            <button onClick={() => document.getElementById('jobs-section').scrollIntoView({ behavior: 'smooth' })} className="btn-ghost">
              Browse Gigs ↓
            </button>
          </div>
          <div className="flex gap-10 mt-10 pt-8" style={{ borderTop: '1px solid rgba(246,233,208,0.1)' }}>
            {[{ n: jobs.length || 0, l: 'Active Jobs' }, { n: 5, l: 'Categories' }, { n: '100%', l: 'Free' }].map(s => (
              <div key={s.l}>
                <p className="font-bold text-2xl" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--cream)' }}>{s.n}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-widest" style={{ color: 'rgba(246,233,208,0.4)' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sign in banner */}
      {!user && (
        <div className="px-5 py-4" style={{ background: 'rgba(201,168,76,0.12)', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm" style={{ color: 'var(--forest)' }}>
              <strong>Sign in free</strong> to post jobs and save listings
            </p>
            <button onClick={signInWithGoogle} className="btn-primary text-xs whitespace-nowrap">Sign in with Google →</button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="sticky top-[60px] z-40 px-4 py-3 flex flex-wrap gap-2 items-center"
        style={{ background: 'var(--cream2)', borderBottom: '1px solid rgba(4,50,34,0.1)' }}>
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search jobs, skills, location..." value={search}
            onChange={e => setSearch(e.target.value)} className="input pl-8 h-9 text-sm" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} className="text-xs px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer"
              style={{ border: `1px solid ${cat === c ? 'var(--forest)' : 'rgba(4,50,34,0.2)'}`, background: cat === c ? 'var(--forest)' : 'transparent', color: cat === c ? 'var(--cream)' : 'var(--muted)' }}>
              {c}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="input h-9 text-xs w-auto cursor-pointer">
          <option value="newest">Newest first</option>
          <option value="pay-high">Highest pay</option>
          <option value="pay-low">Lowest pay</option>
        </select>
      </div>

      {/* Jobs */}
      <div id="jobs-section" className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-xl" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--forest)' }}>
            Latest Opportunities
            <span className="ml-2 font-normal text-sm" style={{ color: 'var(--muted)', fontFamily: '"DM Sans",sans-serif' }}>
              {filtered.length} found
            </span>
          </h2>
          {user && <button onClick={() => navigate('/post')} className="btn-primary text-xs">+ Post a Job</button>}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: '#fff', border: '1px solid rgba(4,50,34,0.08)' }}>
                <div className="h-3 w-16 rounded-full mb-4" style={{ background: 'var(--cream2)' }} />
                <div className="h-5 w-3/4 rounded mb-2" style={{ background: 'var(--cream2)' }} />
                <div className="h-3 w-1/2 rounded mb-6" style={{ background: 'var(--cream2)' }} />
                <div className="h-16 rounded mb-4" style={{ background: 'var(--cream)' }} />
                <div className="h-9 rounded" style={{ background: 'var(--cream)' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-bold text-xl mb-2" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--forest)' }}>No jobs found</p>
            <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>Try a different category or search term</p>
            {user && <button onClick={() => navigate('/post')} className="btn-primary">Be the first to post →</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(job => <JobCard key={job.id} job={job} onSaveToggle={refresh} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-xs" style={{ color: 'var(--muted)', borderTop: '1px solid rgba(4,50,34,0.1)' }}>
        <p className="font-bold mb-1" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--forest)' }}>GigsNest</p>
        <p>Hyperlocal jobs & skills — Kashmir & beyond</p>
      </footer>
    </div>
  )
}
