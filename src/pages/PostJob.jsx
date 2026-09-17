import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createJob } from '../firebase/db'

const CATEGORIES = ['Tech', 'Design', 'Local', 'Content', 'Education']
const PAY_TYPES = ['/project', '/month', '/day', '/hour', '/job']

export default function PostJob() {
  const { user, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', category: 'Tech', location: '',
    description: '', payMin: '', payMax: '',
    payType: '/project', tags: '', phone: ''
  })

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--cream)' }}>
      <div className="rounded-2xl p-8 max-w-sm w-full text-center" style={{ background: '#fff', border: '1px solid rgba(4,50,34,0.1)' }}>
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="font-black text-xl mb-2" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--forest)' }}>Sign in first</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>Sign in to post a job and find talent.</p>
        <button onClick={signInWithGoogle} className="btn-primary w-full py-3">Sign in with Google →</button>
      </div>
    </div>
  )

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) return setError('Job title is required.')
    if (!form.description.trim()) return setError('Description is required.')
    if (!form.location.trim()) return setError('Location is required.')
    if (!form.phone.trim()) return setError('Phone/WhatsApp number is required.')
    if (!form.payMin || !form.payMax) return setError('Budget range is required.')
    if (Number(form.payMin) > Number(form.payMax)) return setError('Min budget cannot exceed max.')

    setLoading(true)
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5)
      const id = await createJob({
        title: form.title.trim(), category: form.category,
        location: form.location.trim(), description: form.description.trim(),
        payMin: Number(form.payMin), payMax: Number(form.payMax),
        payType: form.payType, tags, type: 'job',
      }, user, form.phone.trim())
      navigate(`/job/${id}`)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--cream)' }}>
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-sm mb-5 flex items-center gap-1 hover:opacity-70" style={{ color: 'var(--muted)' }}>← Back</button>

        {/* Header */}
        <div className="rounded-2xl p-5 mb-5 flex items-center gap-4" style={{ background: 'var(--forest)' }}>
          <div className="text-4xl">🧑‍💼</div>
          <div>
            <h1 className="font-black text-2xl tracking-tight" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--cream)' }}>Post a Job</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(246,233,208,0.6)' }}>Find skilled people in your area — free</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(4,50,34,0.08)' }}>
          <div>
            <label className="label">What do you need? *</label>
            <input className="input" placeholder="e.g. Need a React Developer for my app" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category *</label>
              <select className="input cursor-pointer" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Location *</label>
              <input className="input" placeholder="Srinagar, Remote..." value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Describe the work *</label>
            <textarea className="input min-h-[110px] resize-y" placeholder="What exactly needs to be done? Requirements, timeline, deliverables..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Budget (₹) *</label>
            <div className="grid grid-cols-3 gap-2">
              <input className="input" type="number" placeholder="Min" value={form.payMin} onChange={e => set('payMin', e.target.value)} />
              <input className="input" type="number" placeholder="Max" value={form.payMax} onChange={e => set('payMax', e.target.value)} />
              <select className="input cursor-pointer" value={form.payType} onChange={e => set('payType', e.target.value)}>
                {PAY_TYPES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Skills needed <span className="normal-case tracking-normal" style={{ color: 'var(--muted)' }}>(comma separated)</span></label>
            <input className="input" placeholder="React, Tailwind, Figma" value={form.tags} onChange={e => set('tags', e.target.value)} />
          </div>
          <div>
            <label className="label">WhatsApp / Phone *</label>
            <input className="input" placeholder="+91 99060xxxxx" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          {error && <div className="text-sm px-4 py-3 rounded-xl" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>⚠️ {error}</div>}
          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-50"
            style={{ background: 'var(--forest)', color: 'var(--cream)', fontFamily: '"Playfair Display",serif' }}>
            {loading ? 'Posting...' : 'Post Job →'}
          </button>
        </form>
      </div>
    </div>
  )
}