import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSavedJobs } from '../firebase/db'
import JobCard from '../components/JobCard'

export default function SavedJobs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    setLoading(true)
    try { setJobs(await getSavedJobs(user.uid)) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [user])

  if (!user) { navigate('/'); return null }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--cream)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-7">
          <h1 className="font-black text-3xl tracking-tight" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--forest)' }}>
            Saved Jobs
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {loading ? 'Loading...' : `${jobs.length} saved`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: '#fff', border: '1px solid rgba(4,50,34,0.08)' }}>
                <div className="h-3 w-16 rounded-full mb-4" style={{ background: 'var(--cream2)' }} />
                <div className="h-5 w-3/4 rounded mb-6" style={{ background: 'var(--cream2)' }} />
                <div className="h-16 rounded mb-4" style={{ background: 'var(--cream)' }} />
                <div className="h-9 rounded" style={{ background: 'var(--cream)' }} />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔖</p>
            <p className="font-bold text-xl mb-2" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--forest)' }}>Nothing saved yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Bookmark jobs you like from the home feed</p>
            <button onClick={() => navigate('/')} className="btn-primary">Browse Jobs →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => <JobCard key={job.id} job={job} onSaveToggle={load} />)}
          </div>
        )}
      </div>
    </div>
  )
}
