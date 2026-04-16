import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toggleSaveJob } from '../firebase/db'
import { useState } from 'react'

const BADGE = {
  Tech:      'bg-emerald-50 text-emerald-800 border-emerald-100',
  Design:    'bg-purple-50 text-purple-800 border-purple-100',
  Local:     'bg-amber-50 text-amber-800 border-amber-100',
  Content:   'bg-pink-50 text-pink-800 border-pink-100',
  Education: 'bg-blue-50 text-blue-800 border-blue-100',
}

function timeAgo(ts) {
  if (!ts) return 'just now'
  const h = Math.floor((Date.now() - ts.toMillis()) / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function JobCard({ job, onSaveToggle }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isSaved = user && job.savedBy?.includes(user.uid)
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.stopPropagation()
    if (!user) return
    setSaving(true)
    await toggleSaveJob(job.id, user.uid, isSaved)
    onSaveToggle?.()
    setSaving(false)
  }

  const isNew = job.createdAt && Date.now() - job.createdAt.toMillis() < 86400000

  return (
    <div
      onClick={() => navigate(`/job/${job.id}`)}
      className="card p-5 cursor-pointer group"
    >
      {isNew && (
        <div className="absolute -top-px right-4 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-b-lg" style={{ background: 'var(--gold)', color: 'var(--forest)' }}>
          New
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${BADGE[job.category] || BADGE.Tech}`}>
          {job.category}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{
            border: `1px solid ${isSaved ? 'var(--gold)' : 'rgba(4,50,34,0.12)'}`,
            background: isSaved ? '#fffbf0' : 'transparent',
            color: isSaved ? 'var(--gold)' : 'var(--muted)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>

      <h3 className="font-bold text-[15px] leading-snug mb-2 transition-colors" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--forest)' }}>
        {job.title}
      </h3>

      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0" style={{ background: 'var(--forest)', color: 'var(--cream)' }}>
          {job.postedBy?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>{job.postedBy?.name} · {timeAgo(job.createdAt)}</span>
      </div>

      <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: '#6b5a40' }}>
        {job.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-[10px] px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: 'var(--cream)', color: 'var(--muted)' }}>
          📍 {job.location}
        </span>
        {job.tags?.slice(0, 2).map(t => (
          <span key={t} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: 'var(--cream)', color: 'var(--muted)' }}>{t}</span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(4,50,34,0.07)' }}>
        <div>
          <p className="font-bold text-base" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--forest)' }}>
            ₹{Number(job.payMin).toLocaleString()}–{Number(job.payMax).toLocaleString()}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{job.payType}</p>
        </div>
        <button className="btn-primary text-xs px-4 py-2">View →</button>
      </div>
    </div>
  )
}
