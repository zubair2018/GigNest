import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSavedListings } from '../context/SavedListingsContext'

const BADGE = {
  Tech: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  Design: 'bg-purple-50 text-purple-800 border-purple-100',
  Local: 'bg-amber-50 text-amber-800 border-amber-100',
  Content: 'bg-pink-50 text-pink-800 border-pink-100',
  Education: 'bg-blue-50 text-blue-800 border-blue-100',
}

function timeAgo(timestamp) {
  if (!timestamp?.toMillis) return 'just now'

  const difference = Date.now() - timestamp.toMillis()
  const hours = Math.floor(difference / 3600000)

  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`

  return `${Math.floor(hours / 24)}d ago`
}

export default function JobCard({
  job,
  compact = false,
  onSaveToggle,
}) {
  const { user } = useAuth()
  const { savedIds, loading: savedLoading, toggle } = useSavedListings()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const skill = job.type === 'skill'
  const listingCollection = skill ? 'skills' : 'jobs'
  const saved = Boolean(user && savedIds.has(`${listingCollection}_${job.id}`))

  const initials =
    job.postedBy?.name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'

  function openDetail() {
    navigate(`/job/${job.id}`)
  }

  async function handleSave(event) {
    event.stopPropagation()

    if (!user) {
      navigate(`/signin?returnTo=${encodeURIComponent(`/job/${job.id}`)}`)
      return
    }

    setSaving(true)

    try {
      await toggle(listingCollection, job.id)
      onSaveToggle?.()
    } catch (error) {
      console.error('Failed to save listing:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article
      onClick={openDetail}
      className="cursor-pointer group relative rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{
        background: '#fff',
        border: '1px solid rgba(4,50,34,0.08)',
      }}
    >
      <div className={compact ? 'p-4' : 'p-5'}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                BADGE[job.category] || BADGE.Tech
              }`}
            >
              {job.category}
            </span>

            <span
              className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
              style={{
                background: skill
                  ? 'rgba(201,168,76,0.15)'
                  : 'rgba(4,50,34,0.07)',
                color: skill ? '#8a6200' : 'var(--forest)',
              }}
            >
              {skill ? '🙋 Available' : '🧑‍💼 Hiring'}
            </span>

          </div>

          {user?.uid !== job.postedBy?.uid && (
            <button
              onClick={handleSave}
              disabled={saving || savedLoading}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-50"
              style={{
                border: `1px solid ${saved ? 'var(--gold)' : 'rgba(4,50,34,0.12)'}`,
                background: saved ? '#fffbf0' : 'transparent',
                color: saved ? 'var(--gold)' : 'var(--muted)',
              }}
              aria-label={saved ? 'Unsave listing' : 'Save listing'}
              aria-pressed={saved}
              title={saved ? 'Remove from saved listings' : 'Save listing'}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={saved ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          )}
        </div>

        <h3
          className={`font-bold leading-snug group-hover:text-amber-700 transition-colors ${
            compact ? 'text-sm mb-2' : 'text-[15px] mb-2'
          }`}
          style={{
            fontFamily: '"Playfair Display", serif',
            color: 'var(--forest)',
          }}
        >
          {job.title}
        </h3>

        <div className="flex items-center gap-2 mb-2.5">
          {job.postedBy?.photo ? (
            <img
              src={job.postedBy.photo}
              alt=""
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
              style={{
                background: 'var(--forest)',
                color: 'var(--cream)',
              }}
            >
              {initials}
            </div>
          )}

          <span className="text-xs truncate" style={{ color: 'var(--muted)' }}>
            {job.postedBy?.name || 'Anonymous'} · {timeAgo(job.createdAt)}
          </span>
        </div>

        {!compact && (
          <p
            className="text-xs leading-relaxed mb-3 line-clamp-2"
            style={{ color: '#6b5a40' }}
          >
            {job.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span
            className="text-[10px] px-2 py-1 rounded-lg"
            style={{ background: 'var(--cream)', color: 'var(--muted)' }}
          >
            📍 {job.location}
          </span>

          {job.tags?.slice(0, compact ? 1 : 2).map(tag => (
            <span
              key={tag}
              className="text-[10px] px-2 py-1 rounded-lg"
              style={{ background: 'var(--cream)', color: 'var(--muted)' }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid rgba(4,50,34,0.07)' }}
        >
          <div>
            <p
              className={compact ? 'font-bold text-sm' : 'font-bold text-base'}
              style={{
                fontFamily: '"Playfair Display", serif',
                color: 'var(--forest)',
              }}
            >
              ₹{Number(job.payMin).toLocaleString()}–₹
              {Number(job.payMax).toLocaleString()}
            </p>

            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {job.payType}
            </p>
          </div>

          <button
            onClick={event => {
              event.stopPropagation()
              openDetail()
            }}
            className="btn-primary text-xs px-4 py-2"
          >
            {skill ? 'Hire →' : 'View →'}
          </button>
        </div>
      </div>
    </article>
  )
}