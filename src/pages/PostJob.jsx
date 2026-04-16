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
  const [form, setForm] = useState({ title: '', category: 'Tech', location: '', description: '', payMin: '', payMax: '', payType: '/project', phone: '', tags: '' })

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--cream)' }}>
      <div className="rounded-2xl p-8 max-w-sm w-full text-center" style={{ background: '#fff', border: '1px solid rgba(4,50,34,0.1)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(4,50,34,0.07)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 className="font-bold text-xl mb-2" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--forest)' }}>Sign in to post a job</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Reach local talent in your city instantly.</p>
        <button onClick={signInWithGoogle} className="btn-primary w-full py-3">Sign in with Google →</button>
      </div>
    </div>
  )

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title || !form.description || !form.location || !form.phone) { setError('Please fill in all required fields.'); return }
    if (Number(form.payMin) > Number(form.payMax)) { setError('Min pay cannot be higher than max pay.'); return }
    setLoading(true)
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5)
      const id = await createJob({ title: form.title, category: form.category, location: form.location, description: form.description, payMin: Number(form.payMin), payMax: Number(form.payMax), payType: form.payType, phone: form.phone, tags }, user)
      navigate(`/job/${id}`)
    } catch { setError('Failed to post. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--cream)' }}>
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-sm mb-6 flex items-center gap-1" style={{ color: 'var(--muted)' }}>← Back</button>
        <h1 className="font-black text-3xl mb-1 tracking-tight" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--forest)' }}>Post a Job</h1>
        <p className="text-sm mb-7" style={{ color: 'var(--muted)' }}>Reach local talent in minutes — it's free.</p>

        <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4" style={{ background: '#fff', border: '1px solid rgba(4,50,34,0.08)' }}>
          <div><label className="label">Job Title *</label><input className="input" placeholder="e.g. Need a React Developer" value={form.title} onChange={e => set('title', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Category *</label><select className="input" value={form.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className="label">Location *</label><input className="input" placeholder="Srinagar, Remote..." value={form.location} onChange={e => set('location', e.target.value)} /></div>
          </div>
          <div><label className="label">Description *</label><textarea className="input min-h-[100px] resize-y" placeholder="Describe the work, requirements, timeline..." value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Min Pay (₹) *</label><input className="input" type="number" placeholder="5000" value={form.payMin} onChange={e => set('payMin', e.target.value)} /></div>
            <div><label className="label">Max Pay (₹) *</label><input className="input" type="number" placeholder="15000" value={form.payMax} onChange={e => set('payMax', e.target.value)} /></div>
            <div><label className="label">Per</label><select className="input" value={form.payType} onChange={e => set('payType', e.target.value)}>{PAY_TYPES.map(p => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div><label className="label">Skills / Tags</label><input className="input" placeholder="React, Tailwind, Remote" value={form.tags} onChange={e => set('tags', e.target.value)} /></div>
          <div><label className="label">WhatsApp / Phone *</label><input className="input" placeholder="+91 94190 00000" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-base transition-all disabled:opacity-50" style={{ background: 'var(--forest)', color: 'var(--cream)', fontFamily: '"Playfair Display", serif' }}>
            {loading ? 'Posting...' : 'Post Job →'}
          </button>
        </form>
      </div>
    </div>
  )
}
