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

  const load = () => { if (!user) return; getSavedJobs(user.uid).then(j => { setJobs(j); setLoading(false) }) }
  useEffect(() => { load() }, [user])

  if (!user) { navigate('/'); return null }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--cream)' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="font-black text-3xl tracking-tight mb-1" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--forest)' }}>Saved Jobs</h1>
        <p className="text-sm mb-7" style={{ color: 'var(--muted)' }}>{jobs.length} saved</p>
        {loading ? <p style={{ color: 'var(--muted)' }} className="text-sm">Loading...</p>
        : jobs.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--muted)' }}>
            <p className="text-5xl mb-4">🔖</p>
            <p className="font-bold text-xl mb-2" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--forest)' }}>Nothing saved yet</p>
            <p className="text-sm mb-5">Bookmark jobs you like from the home feed</p>
            <button onClick={() => navigate('/')} className="btn-primary">Browse Jobs →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jobs.map(job => <JobCard key={job.id} job={job} onSaveToggle={load} />)}
          </div>
        )}
      </div>
    </div>
  )
}
