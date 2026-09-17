import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPendingPayments, updatePaymentStatus, activateFeaturedPost, deleteJob } from '../firebase/db'
import { useNavigate } from 'react-router-dom'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    // In production, verify user is admin here (custom claims or allowed UID list)
    getPendingPayments()
      .then(setPayments)
      .catch(e => {
        console.error(e)
        setError('Failed to load payments.')
      })
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    navigate('/')
    return null
  }

  async function handleActivate(payment) {
    if (!window.confirm(`Activate featured post for "${payment.jobTitle}" (${payment.planDays} days)?`)) return
    try {
      await activateFeaturedPost(payment.jobId, payment.planDays)
      await updatePaymentStatus(payment.id, 'activated')
      setPayments(prev => prev.filter(p => p.id !== payment.id))
    } catch (e) {
      console.error(e)
      alert('Failed to activate. Check console.')
    }
  }

  async function handleDeleteJob(jobId, jobTitle) {
    if (!window.confirm(`Delete job "${jobTitle}"? This cannot be undone.`)) return
    try {
      await deleteJob(jobId)
      alert('Job deleted.')
    } catch (e) {
      console.error(e)
      alert('Failed to delete job.')
    }
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--cream)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="font-black text-3xl mb-1" style={{ fontFamily: '"Playfair Display",serif', color: 'var(--forest)' }}>
          Admin – Pending Payments
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
          Verify payments and activate featured posts.
        </p>

        {error && (
          <div className="text-sm px-4 py-3 rounded-xl mb-4" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm" style={{ color: 'var(--muted)' }}>Loading...</div>
        ) : payments.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--muted)' }}>No pending payments.</div>
        ) : (
          <div className="space-y-3">
            {payments.map(p => (
              <div key={p.id} className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid rgba(4,50,34,0.08)' }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--forest)' }}>
                      {p.jobTitle}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {p.planDays} days · ₹{p.planPrice} · {p.userName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleActivate(p)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: 'var(--forest)', color: 'var(--cream)' }}
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleDeleteJob(p.jobId, p.jobTitle)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ border: '1px solid #fca5a5', color: '#dc2626' }}
                    >
                      Delete Job
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}