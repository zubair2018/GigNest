import { useState, useMemo } from 'react'
import { useJobs } from '../hooks/useJobs'
import JobCard from '../components/JobCard'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CATS = [
  { label: 'All',       emoji: '🌐' },
  { label: 'Tech',      emoji: '💻' },
  { label: 'Design',    emoji: '🎨' },
  { label: 'Local',     emoji: '📍' },
  { label: 'Content',   emoji: '✍️' },
  { label: 'Education', emoji: '📚' },
]

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest first' },
  { value: 'pay-high', label: 'Highest pay' },
  { value: 'pay-low',  label: 'Lowest pay' },
]

const HOW_IT_WORKS = [
  {
    emoji: '📋',
    title: 'Client Posts a Job',
    desc: 'A client posts exactly what skill they need — React dev, plumber, video editor, tutor — with their budget.',
  },
  {
    emoji: '🔍',
    title: 'Freelancer Finds the Match',
    desc: 'Browse by category, search by skill or location. Find the opportunity that matches what you offer.',
  },
  {
    emoji: '💬',
    title: 'Connect via In-App Chat',
    desc: 'Click "Message" on any listing — a private chat opens instantly between client and freelancer.',
  },
]

export default function Home() {
  const [cat, setCat]       = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort]     = useState('newest')

  const { jobs, loading, refresh } = useJobs()
  const { user, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    let list = [...jobs]

    if (cat !== 'All') {
      list = list.filter(j => j.category === cat)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(j =>
        [j.title, j.description, j.location, ...(j.tags || [])]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    }

    if (sort === 'pay-high') list.sort((a, b) => b.payMax - a.payMax)
    if (sort === 'pay-low')  list.sort((a, b) => a.payMin - b.payMin)

    return list
  }, [jobs, cat, search, sort])

  const activeCatEmoji = CATS.find(c => c.label === cat)?.emoji || '🌐'

  function scrollToJobs() {
    document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden px-5 pt-12 pb-10" style={{ background: 'var(--forest)' }}>
        <div
          className="absolute right-[-80px] top-[-80px] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ border: '1px solid rgba(246,233,208,0.07)' }}
        />
        <div className="max-w-6xl mx-auto relative">
          <div className="flex items-center gap-2 mb-4 text-[11px] uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--gold)' }} />
            Kashmir & beyond
          </div>

          <h1
            className="font-black tracking-tight leading-none mb-4"
            style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(32px,6vw,52px)', color: 'var(--cream)' }}
          >
            Find local <em style={{ color: 'var(--gold)' }}>gigs</em> &<br />hire real talent
          </h1>

          <p className="text-base mb-8 max-w-md leading-relaxed" style={{ color: 'rgba(246,233,208,0.6)' }}>
            Post jobs, offer skills, connect instantly. The hyperlocal marketplace built for your city — 100% free.
          </p>

          <div className="flex gap-3 flex-wrap">
            {user ? (
              <button onClick={() => navigate('/post-job')} className="btn-gold">
                🧑‍💼 Post a Job
              </button>
            ) : (
              <button onClick={signInWithGoogle} className="btn-gold">
                Get Started Free →
              </button>
            )}
            <button onClick={scrollToJobs} className="btn-ghost">
              Browse Gigs ↓
            </button>
          </div>

          <div className="flex gap-10 mt-10 pt-8" style={{ borderTop: '1px solid rgba(246,233,208,0.1)' }}>
            {[
              { n: jobs.length, l: 'Active Listings' },
              { n: 5,           l: 'Categories' },
              { n: '100%',      l: 'Free' },
            ].map(s => (
              <div key={s.l}>
                <p className="font-bold text-2xl" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--cream)' }}>
                  {s.n}
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-widest" style={{ color: 'rgba(246,233,208,0.4)' }}>
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sign-in banner ── */}
      {!user && (
        <div
          className="px-5 py-3.5"
          style={{ background: 'rgba(201,168,76,0.12)', borderBottom: '1px solid rgba(201,168,76,0.2)' }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm" style={{ color: 'var(--forest)' }}>
              🔐 <strong>Sign in free</strong> to post jobs, save listings & chat with clients
            </p>
            <button onClick={signInWithGoogle} className="btn-primary text-xs whitespace-nowrap">
              Sign in with Google →
            </button>
          </div>
        </div>
      )}

      {/* ── Category tabs ── */}
      <div
        className="sticky top-[60px] z-40"
        style={{ background: 'var(--forest)', borderBottom: '1px solid rgba(246,233,208,0.1)' }}
      >
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto py-2">
          {CATS.map(c => (
            <button
              key={c.label}
              onClick={() => setCat(c.label)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 cursor-pointer"
              style={{
                background: cat === c.label ? 'var(--gold)'              : 'rgba(246,233,208,0.08)',
                color:      cat === c.label ? 'var(--forest)'            : 'rgba(246,233,208,0.7)',
                border:     cat === c.label ? '1px solid transparent'    : '1px solid rgba(246,233,208,0.1)',
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search + Sort ── */}
      <div
        className="px-4 py-3 flex gap-2 items-center flex-wrap"
        style={{ background: 'var(--cream2)', borderBottom: '1px solid rgba(4,50,34,0.1)' }}
      >
        <div className="relative flex-1 min-w-[180px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="var(--muted)" strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${cat === 'All' ? 'all listings' : cat + ' listings'}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-8 h-9 text-sm"
          />
        </div>

        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="input h-9 text-xs w-auto cursor-pointer"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {user && (
          <div className="flex gap-1.5">
            <button
              onClick={() => navigate('/post-job')}
              className="btn-primary text-xs h-9 px-3 whitespace-nowrap"
            >
              🧑‍💼 Post Job
            </button>
            <button
              onClick={() => navigate('/post-skill')}
              className="btn-gold text-xs h-9 px-3 whitespace-nowrap"
            >
              🙋 Offer Skill
            </button>
          </div>
        )}
      </div>

      {/* ── Active category chip ── */}
      {cat !== 'All' && (
        <div className="px-4 pt-3 max-w-6xl mx-auto flex items-center gap-2">
          <span
            className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5"
            style={{ background: 'var(--forest)', color: 'var(--cream)' }}
          >
            {activeCatEmoji} {cat}
            <button
              onClick={() => setCat('All')}
              className="ml-1 opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {filtered.length} listing{filtered.length !== 1 ? 's' : ''} found
          </span>
        </div>
      )}

      {/* ── Jobs grid ── */}
      <div id="jobs-section" className="max-w-6xl mx-auto px-4 py-6">
        {cat === 'All' && !search && (
          <div className="flex items-center justify-between mb-5">
            <h2
              className="font-bold text-xl"
              style={{ fontFamily: '"Playfair Display",serif', color: 'var(--forest)' }}
            >
              Latest Listings
              <span
                className="ml-2 font-normal text-sm"
                style={{ color: 'var(--muted)', fontFamily: '"DM Sans",sans-serif' }}
              >
                {filtered.length} total
              </span>
            </h2>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 animate-pulse"
                style={{ background: '#fff', border: '1px solid rgba(4,50,34,0.08)' }}
              >
                <div className="h-3 w-16 rounded-full mb-4" style={{ background: 'var(--cream2)' }} />
                <div className="h-5 w-3/4 rounded mb-2"   style={{ background: 'var(--cream2)' }} />
                <div className="h-3 w-1/2 rounded mb-4"   style={{ background: 'var(--cream2)' }} />
                <div className="h-16 rounded mb-4"         style={{ background: 'var(--cream)' }} />
                <div className="h-9 rounded"               style={{ background: 'var(--cream)' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">{cat !== 'All' ? activeCatEmoji : '🔍'}</p>
            <p
              className="font-bold text-xl mb-2"
              style={{ fontFamily: '"Playfair Display",serif', color: 'var(--forest)' }}
            >
              No {cat !== 'All' ? cat : ''} listings found
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              {cat !== 'All' ? `No ${cat} listings yet.` : 'Try a different search term.'} Be the first!
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {cat !== 'All' && (
                <button onClick={() => setCat('All')} className="btn-outline">
                  Show all listings
                </button>
              )}
              {user && (
                <button onClick={() => navigate('/post-job')} className="btn-primary">
                  Post a Job →
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(job => (
              <JobCard key={job.id} job={job} onSaveToggle={refresh} />
            ))}
          </div>
        )}
      </div>

      {/* ── How it works ── */}
      <div className="px-4 py-12" style={{ background: 'var(--forest)' }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="font-black text-2xl mb-2 text-center"
            style={{ fontFamily: '"Playfair Display",serif', color: 'var(--cream)' }}
          >
            How GigNest Works
          </h2>
          <p className="text-center text-sm mb-10" style={{ color: 'rgba(246,233,208,0.5)' }}>
            Connect skills with needs — in 3 simple steps
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {HOW_IT_WORKS.map(s => (
              <div
                key={s.title}
                className="rounded-2xl p-5 text-center"
                style={{ background: 'rgba(246,233,208,0.06)', border: '1px solid rgba(246,233,208,0.1)' }}
              >
                <div className="text-3xl mb-3">{s.emoji}</div>
                <h3
                  className="font-bold text-base mb-2"
                  style={{ fontFamily: '"Playfair Display",serif', color: 'var(--cream)' }}
                >
                  {s.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(246,233,208,0.55)' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Offer skill CTA */}
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <p
              className="font-bold text-lg mb-1"
              style={{ fontFamily: '"Playfair Display",serif', color: 'var(--gold)' }}
            >
              Have a skill to offer?
            </p>
            <p className="text-sm mb-4" style={{ color: 'rgba(246,233,208,0.6)' }}>
              Post your service — describe what you do, your rate, and location. Clients will message you directly.
            </p>
            {user ? (
              <button onClick={() => navigate('/post-skill')} className="btn-gold">
                🙋 Post Your Skill →
              </button>
            ) : (
              <button onClick={signInWithGoogle} className="btn-gold">
                Sign in & Offer Skills →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer
        className="text-center py-8 text-xs"
        style={{ color: 'var(--muted)', borderTop: '1px solid rgba(4,50,34,0.1)' }}
      >
        <p
          className="font-bold mb-1"
          style={{ fontFamily: '"Playfair Display",serif', color: 'var(--forest)', fontSize: 15 }}
        >
          GigNest
        </p>
        <p>Hyperlocal jobs & skills — Kashmir & beyond · 100% Free</p>
      </footer>
    </div>
  )
}