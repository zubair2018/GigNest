import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJob, toggleSaveJob, deleteJob, incrementViews, getOrCreateChat } from '../firebase/db'
import { useAuth } from '../context/AuthContext'

const BADGE = {
  Tech: 'bg-emerald-50 text-emerald-800',
  Design: 'bg-purple-50 text-purple-800',
  Local: 'bg-amber-50 text-amber-800',
  Content: 'bg-pink-50 text-pink-800',
  Education: 'bg-blue-50 text-blue-800',
}

const PLANS = [
  { days: 7,  price: 99,  label: '7 Days',  tag: 'Starter' },
  { days: 15, price: 179, label: '15 Days', tag: '🔥 Popular' },
  { days: 30, price: 299, label: '30 Days', tag: 'Best Value' },
]

const GIGSNEST_WA = '919419000000' // ← replace with your number

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, signInWithGoogle } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [contacting, setContacting] = useState(false)
  const [showFeatureModal, setShowFeatureModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1])

  useEffect(() => {
    getJob(id).then(j => {
      setJob(j)
      setLoading(false)
      if (j && user && user.uid !== j.postedBy?.uid) incrementViews(id).catch(() => {})
    })
  }, [id, user])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--forest)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!job) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--cream)' }}>
      <p className="text-4xl">😕</p>
      <p className="font-bold text-lg" style={{ color: 'var(--forest)' }}>Job not found</p>
      <button onClick={() => navigate('/')} className="btn-primary">← Back to jobs</button>
    </div>
  )

  const now = new Date()
  const isOwner = user?.uid === job.postedBy?.uid
  const isSkill = job.type === 'skill'
  const isSaved = user && Array.isArray(job.savedBy) && job.savedBy.includes(user.uid)
  const isFeatured = job.featured && job.featuredUntil?.toDate?.() > now
  const featuredUntilStr = job.featuredUntil?.toDate?.()?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try { await toggleSaveJob(job.id, user.uid, isSaved); setJob(await getJob(id)) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this post?')) return
    setDeleting(true)
    try { await deleteJob(id); navigate('/my-jobs') }
    catch { setDeleting(false) }
  }

  async function handleContact() {
    if (!user) { signInWithGoogle(); return }
    setContacting(true)
    try {
      const chatDocId = await getOrCreateChat(
        job.id, job.title,
        { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL },
        { uid: job.postedBy.uid, displayName: job.postedBy.name, photoURL: job.postedBy.photo }
      )
      navigate(`/chat/${chatDocId}`)
    } catch (err) {
      console.error(err)
      setContacting(false)
    }
  }

  const paymentWA = `https://wa.me/${GIGSNEST_WA}?text=${encodeURIComponent(`Hi GigsNest! I want to feature my post "${job.title}" (ID: ${job.id}) for ${selectedPlan.days} days (₹${selectedPlan.price}). Please share payment details.`)}`

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--cream)' }}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-sm mb-6 flex items-center gap-1 hover:opacity-70" style={{ color: 'var(--muted)' }}>
          ← Back
        </button>

        <div className="rounded-2xl overflow-hidden shadow-sm"
          style={{ background: '#fff', border: isFeatured ? '1.5px solid var(--gold)' : '1px solid rgba(4,50,34,0.08)' }}>

          {/* Featured banner */}
          {isFeatured && (
            <div className="flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-widest" style={{ background: 'var(--gold)', color: 'var(--forest)' }}>
              ⭐ Featured · Active until {featuredUntilStr}
            </div>
          )}

          {/* Header */}
          <div className="p-6" style={{ background: 'var(--forest)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${BADGE[job.category] || ''}`}>
                    {job.category}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
                    style={{ background: isSkill ? 'rgba(201,168,76,0.3)' : 'rgba(246,233,208,0.15)', color: isSkill ? 'var(--gold)' : 'rgba(246,233,208,0.8)' }}>
                    {isSkill ? '🙋 Available for hire' : '🧑‍💼 Looking to hire'}
                  </span>
                </div>
                <h1 className="font-black text-2xl leading-tight" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--cream)' }}>
                  {job.title}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xs" style={{ color: 'rgba(246,233,208,0.5)' }}>📍 {job.location}</p>
                  {job.views > 0 && <p className="text-xs" style={{ color: 'rgba(246,233,208,0.35)' }}>👁 {job.views} views</p>}
                </div>
              </div>
              {user && !isOwner && (
                <button onClick={handleSave} disabled={saving} className="p-2 rounded-lg transition-all flex-shrink-0"
                  style={{ border: `1px solid ${isSaved ? 'var(--gold)' : 'rgba(246,233,208,0.2)'}`, background: isSaved ? 'rgba(201,168,76,0.2)' : 'transparent', color: isSaved ? 'var(--gold)' : 'rgba(246,233,208,0.5)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Poster */}
            <div className="flex items-center gap-3 pb-5 mb-5" style={{ borderBottom: '1px solid rgba(4,50,34,0.08)' }}>
              {job.postedBy?.photo
                ? <img src={job.postedBy.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--forest)', color: 'var(--cream)' }}>
                    {job.postedBy?.name?.[0] || '?'}
                  </div>
              }
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--forest)' }}>{job.postedBy?.name}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{isSkill ? 'Freelancer' : 'Client'}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <p className="label mb-2">{isSkill ? 'About this skill' : 'About this job'}</p>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#3a2a10' }}>{job.description}</p>
            </div>

            {/* Tags */}
            {job.tags?.length > 0 && (
              <div className="mb-5">
                <p className="label mb-2">{isSkill ? 'Skills offered' : 'Skills required'}</p>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map(t => (
                    <span key={t} className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--cream)', color: 'var(--muted)', border: '1px solid rgba(4,50,34,0.1)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pay */}
            <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--forest)' }}>
              <p className="label mb-1" style={{ color: 'rgba(246,233,208,0.4)' }}>{isSkill ? 'Rate' : 'Budget'}</p>
              <p className="font-black text-2xl" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--cream)' }}>
                ₹{Number(job.payMin).toLocaleString()} – ₹{Number(job.payMax).toLocaleString()}
                <span className="text-sm font-normal ml-1.5" style={{ color: 'rgba(246,233,208,0.5)', fontFamily: '"DM Sans",sans-serif' }}>{job.payType}</span>
              </p>
            </div>

            {/* Actions */}
            {isOwner ? (
              <div className="space-y-3">
                {!isFeatured ? (
                  <button onClick={() => setShowFeatureModal(true)}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all hover:shadow-sm"
                    style={{ background: 'rgba(201,168,76,0.08)', border: '1.5px dashed rgba(201,168,76,0.6)' }}>
                    <div className="text-left">
                      <p className="font-bold text-sm" style={{ color: 'var(--forest)', fontFamily: '"Playfair Display",serif' }}>⭐ Feature this post</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Get 5× more views — appear at top of feed</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full ml-3" style={{ background: 'var(--gold)', color: 'var(--forest)' }}>From ₹99</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--forest)' }}>
                    ⭐ Featured until {featuredUntilStr}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => navigate(`/edit/${id}`)} className="btn-outline flex-1 py-3">✏️ Edit</button>
                  <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-full text-sm font-medium transition-all disabled:opacity-50"
                    style={{ border: '1px solid #fca5a5', color: '#dc2626' }}>
                    {deleting ? 'Deleting...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Main contact button */}
                <button onClick={handleContact} disabled={contacting}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all disabled:opacity-60"
                  style={{ background: 'var(--forest)', color: 'var(--cream)', fontFamily: '"Playfair Display",serif' }}>
                  {contacting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Opening chat...
                    </>
                  ) : (
                    <>
                      💬 {isSkill ? `Message ${job.postedBy?.name?.split(' ')[0]}` : `Contact ${job.postedBy?.name?.split(' ')[0]}`}
                    </>
                  )}
                </button>
                {!user && (
                  <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
                    Sign in to send a message
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature Modal */}
      {showFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(4,50,34,0.6)' }} onClick={() => setShowFeatureModal(false)}>
          <div className="rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" style={{ background: 'var(--cream)' }} onClick={e => e.stopPropagation()}>
            <div className="p-5 text-center" style={{ background: 'var(--forest)' }}>
              <p className="text-3xl mb-2">⭐</p>
              <h2 className="font-black text-xl" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--cream)' }}>Feature this Post</h2>
              <p className="text-xs mt-1" style={{ color: 'rgba(246,233,208,0.5)' }}>Appear at top of feed · Get 5× more views</p>
            </div>
            <div className="p-5">
              <p className="label mb-3">Choose a plan</p>
              <div className="space-y-2 mb-4">
                {PLANS.map(plan => (
                  <button key={plan.days} onClick={() => setSelectedPlan(plan)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left"
                    style={{ border: selectedPlan.days === plan.days ? '2px solid var(--forest)' : '1px solid rgba(4,50,34,0.15)', background: selectedPlan.days === plan.days ? 'rgba(4,50,34,0.06)' : '#fff' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--forest)' }}>{plan.label}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{plan.tag}</p>
                    </div>
                    <p className="font-black text-lg" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--forest)' }}>₹{plan.price}</p>
                  </button>
                ))}
              </div>
              <div className="rounded-xl p-3 mb-4 text-xs space-y-1" style={{ background: 'rgba(4,50,34,0.05)', color: 'var(--muted)' }}>
                <p className="font-medium" style={{ color: 'var(--forest)' }}>How it works:</p>
                <p>1. Click below → WhatsApp opens</p>
                <p>2. We reply with UPI payment details</p>
                <p>3. After payment → featured within 1 hour ✅</p>
              </div>
              <a href={paymentWA} target="_blank" rel="noreferrer" onClick={() => setShowFeatureModal(false)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-sm font-bold mb-2"
                style={{ background: '#25D366', display: 'flex' }}>
                💳 Pay ₹{selectedPlan.price} via WhatsApp
              </a>
              <button onClick={() => setShowFeatureModal(false)} className="w-full text-xs py-2 hover:opacity-70" style={{ color: 'var(--muted)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}