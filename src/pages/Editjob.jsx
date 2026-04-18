import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getJob, updateJob } from '../firebase/db'

const CATEGORIES = ['Tech', 'Design', 'Local', 'Content', 'Education']
const PAY_TYPES = ['/project', '/month', '/day', '/hour', '/job']

export default function EditJob() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', category: 'Tech', location: '', description: '',
    payMin: '', payMax: '', payType: '/project', phone: '', tags: ''
  })

  useEffect(() => {
    getJob(id).then(job => {
      if (!job) { navigate('/'); return }
      if (job.postedBy?.uid !== user?.uid) { navigate('/'); return }
      setForm({
        title: job.title || '',
        category: job.category || 'Tech',
        location: job.location || '',
        description: job.description || '',
        payMin: job.payMin || '',
        payMax: job.payMax || '',
        payType: job.payType || '/project',
        phone: job.phone || '',
        tags: (job.tags || []).join(', '),
      })
      setLoading(false)
    })
  }, [id, user])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) return setError('Job title is required.')
    if (!form.description.trim()) return setError('Description is required.')
    if (!form.location.trim()) return setError('Location is required.')
    if (!form.phone.trim()) return setError('Phone/WhatsApp number is required.')
    if (!form.payMin || !form.payMax) return setError('Pay range is required.')
    if (Number(form.payMin) > Number(form.payMax)) return setError('Min pay cannot be more than max pay.')
    setSaving(true)
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5)
      await updateJob(id, {
        title: form.title.trim(),
        category: form.category,
        location: form.location.trim(),
        description: form.description.trim(),
        payMin: Number(form.payMin),
        payMax: Number(form.payMax),
        payType: form.payType,
        phone: form.phone.trim(),
        tags,
      })
      navigate(`/job/${id}`)
    } catch (err) {
      console.error(err)
      setError('Failed to update. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--forest)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--cream)' }}>
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-sm mb-5 flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--muted)' }}>
          ← Back
        </button>
        <h1 className="font-black text-3xl mb-1 tracking-tight" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--forest)' }}>
          Edit Job
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--muted)' }}>Update your job listing below.</p>

        <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(4,50,34,0.08)' }}>

          <div>
            <label className="label">Job Title *</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} />
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
              <input className="input" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea className="input min-h-[110px] resize-y" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Min Pay (₹) *</label>
              <input className="input" type="number" value={form.payMin} onChange={e => set('payMin', e.target.value)} />
            </div>
            <div>
              <label className="label">Max Pay (₹) *</label>
              <input className="input" type="number" value={form.payMax} onChange={e => set('payMax', e.target.value)} />
            </div>
            <div>
              <label className="label">Per</label>
              <select className="input cursor-pointer" value={form.payType} onChange={e => set('payType', e.target.value)}>
                {PAY_TYPES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Skills / Tags</label>
            <input className="input" placeholder="React, Tailwind, Remote" value={form.tags} onChange={e => set('tags', e.target.value)} />
          </div>

          <div>
            <label className="label">WhatsApp / Phone *</label>
            <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>

          {error && (
            <div className="text-sm px-4 py-3 rounded-xl" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn-outline flex-1 py-3">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl font-bold text-base transition-all disabled:opacity-50"
              style={{ background: 'var(--forest)', color: 'var(--cream)', fontFamily: '"Playfair Display",serif' }}>
              {saving ? 'Saving...' : 'Save Changes →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
