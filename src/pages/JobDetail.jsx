import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJob, toggleSaveJob, deleteJob } from '../firebase/db'
import { useAuth } from '../context/AuthContext'

const BADGE = { Tech: 'bg-emerald-50 text-emerald-800', Design: 'bg-purple-50 text-purple-800', Local: 'bg-amber-50 text-amber-800', Content: 'bg-pink-50 text-pink-800', Education: 'bg-blue-50 text-blue-800' }

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { getJob(id).then(j => { setJob(j); setLoading(false) }) }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--forest)', borderTopColor: 'transparent' }} /></div>
  if (!job) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)', color: 'var(--muted)' }}>Job not found.</div>

  const isOwner = user?.uid === job.postedBy?.uid
  const isSaved = user && job.savedBy?.includes(user.uid)

  async function handleSave() {
    if (!user) return
    setSaving(true)
    await toggleSaveJob(job.id, user.uid, isSaved)
    setJob(await getJob(id))
    setSaving(false)
  }

  async function handleDelete() {
    if (!window.confirm('Delete this job post?')) return
    setDeleting(true)
    await deleteJob(id)
    navigate('/')
  }

  const waLink = `https://wa.me/${job.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I saw your job "${job.title}" on GigsNest and I'm interested.`)}`

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--cream)' }}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-sm mb-6 flex items-center gap-1" style={{ color: 'var(--muted)' }}>← Back to jobs</button>

        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(4,50,34,0.08)' }}>
          {/* Header */}
          <div className="p-6 pb-5" style={{ background: 'var(--forest)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3 inline-block ${BADGE[job.category] || ''}`}>{job.category}</span>
                <h1 className="font-black text-2xl leading-tight" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--cream)' }}>{job.title}</h1>
                <p className="text-xs mt-1" style={{ color: 'rgba(246,233,208,0.5)' }}>{job.location}</p>
              </div>
              {user && !isOwner && (
                <button onClick={handleSave} disabled={saving} className="mt-1 p-2 rounded-lg transition-all" style={{ border: `1px solid ${isSaved ? 'var(--gold)' : 'rgba(246,233,208,0.2)'}`, background: isSaved ? 'rgba(201,168,76,0.15)' : 'transparent', color: isSaved ? 'var(--gold)' : 'rgba(246,233,208,0.5)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Poster */}
            <div className="flex items-center gap-3 pb-5 mb-5" style={{ borderBottom: '1px solid rgba(4,50,34,0.08)' }}>
              {job.postedBy?.photo
                ? <img src={job.postedBy.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--forest)', color: 'var(--cream)' }}>{job.postedBy?.name?.[0]}</div>
              }
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--forest)' }}>{job.postedBy?.name}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Job poster</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <p className="label mb-2">About this job</p>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#3a2a10' }}>{job.description}</p>
            </div>

            {/* Tags */}
            {job.tags?.length > 0 && (
              <div className="mb-5">
                <p className="label mb-2">Skills required</p>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map(t => <span key={t} className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--cream)', color: 'var(--muted)', border: '1px solid rgba(4,50,34,0.1)' }}>{t}</span>)}
                </div>
              </div>
            )}

            {/* Pay */}
            <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--forest)' }}>
              <p className="label mb-1" style={{ color: 'rgba(246,233,208,0.45)' }}>Pay range</p>
              <p className="font-black text-2xl" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--cream)' }}>
                ₹{Number(job.payMin).toLocaleString()} – ₹{Number(job.payMax).toLocaleString()}
                <span className="text-sm font-normal ml-1" style={{ color: 'rgba(246,233,208,0.5)', fontFamily: '"DM Sans", sans-serif' }}>{job.payType}</span>
              </p>
            </div>

            {/* Actions */}
            {isOwner ? (
              <div className="flex gap-3">
                <button onClick={() => navigate(`/edit/${id}`)} className="btn-outline flex-1 py-3">Edit Post</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-full text-sm font-medium transition-all text-red-500 hover:bg-red-50 disabled:opacity-50" style={{ border: '1px solid #fca5a5' }}>
                  {deleting ? 'Deleting...' : 'Delete Post'}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <a href={waLink} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-white text-sm font-medium transition-all" style={{ background: '#25D366' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  WhatsApp {job.postedBy?.name?.split(' ')[0]}
                </a>
                <a href={`tel:${job.phone}`} className="btn-outline px-6 py-3">Call</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
