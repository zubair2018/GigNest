import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyJobs } from '../firebase/db'
import JobCard from '../components/JobCard'

export default function MyJobs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getMyJobs(user.uid).then(j => { setJobs(j); setLoading(false) })
  }, [user])

  if (!user) { navigate('/'); return null }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--cream)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="font-black text-3xl tracking-tight" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--forest)' }}>My Posts</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{jobs.length} job{jobs.length !== 1 ? 's' : ''} posted</p>
          </div>
          <button onClick={() => navigate('/post')} className="btn-primary">+ Post New Job</button>
        </div>
        {loading ? <p style={{ color: 'var(--muted)' }} className="text-sm">Loading...</p>
        : jobs.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--muted)' }}>
            <p className="text-5xl mb-4">📋</p>
            <p className="font-bold text-xl mb-2" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--forest)' }}>No posts yet</p>
            <p className="text-sm mb-5">Start by posting your first job</p>
            <button onClick={() => navigate('/post')} className="btn-primary">Post a Job →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jobs.map(job => <JobCard key={job.id} job={job} onSaveToggle={() => getMyJobs(user.uid).then(setJobs)} />)}
          </div>
        )}
      </div>
    </div>
  )
}
