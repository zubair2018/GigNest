import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getJob,
  updateJob,
} from '../firebase/db'
import {
  parseTags,
  validateListing,
} from '../shared/validation'
import {
  ErrorBox,
  ListingForm,
} from './PostJob'

export default function EditJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    category: 'Tech',
    location: '',
    description: '',
    payMin: '',
    payMax: '',
    payType: '/project',
    tags: '',
    availability: 'remote',
    portfolio: [],
  })

  useEffect(() => {
    async function loadJob() {
      if (!user) return

      try {
        const job = await getJob(id)

        if (!job || job.postedBy?.uid !== user.uid) {
          navigate('/')
          return
        }

        setForm({
          title: job.title || '',
          category: job.category || 'Tech',
          location: job.location || '',
          description: job.description || '',
          payMin: job.payMin ?? '',
          payMax: job.payMax ?? '',
          payType: job.payType || '/project',
          tags: (job.tags || []).join(', '),
          availability: job.availability || 'remote',
          portfolio: Array.isArray(job.portfolio) ? job.portfolio : [],
        })
      } catch (error) {
        console.error('Job edit load error:', error)
        setError('Unable to load job details.')
      } finally {
        setLoading(false)
      }
    }

    loadJob()
  }, [id, user, navigate])

  function set(field, value) {
    setForm(previous => ({
      ...previous,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const validationError = validateListing(form, 'job')

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      await updateJob(id, {
        title: form.title.trim(),
        category: form.category,
        location: form.location.trim(),
        description: form.description.trim(),
        payMin: Number(form.payMin),
        payMax: Number(form.payMax),
        payType: form.payType,
        tags: parseTags(form.tags),
        availability: form.availability,
        portfolio: form.portfolio,
      })

      navigate(`/job/${id}`)
    } catch (error) {
      console.error('Job update error:', error)
      setError('Unable to update job. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <EditLayout
      title="Edit Job"
      subtitle="Update your job listing details."
      form={form}
      set={set}
      type="job"
      error={error}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
    />
  )
}

export function EditLayout({
  title,
  subtitle,
  form,
  set,
  type,
  error,
  saving,
  onSubmit,
  onCancel,
}) {
  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{ background: 'var(--cream)' }}
    >
      <div className="max-w-xl mx-auto">
        <button
          onClick={onCancel}
          className="text-sm mb-5"
          style={{ color: 'var(--muted)' }}
        >
          ← Back
        </button>

        <h1
          className="font-black text-3xl mb-1"
          style={{
            fontFamily: '"Playfair Display", serif',
            color: 'var(--forest)',
          }}
        >
          {title}
        </h1>

        <p className="text-sm mb-7" style={{ color: 'var(--muted)' }}>
          {subtitle}
        </p>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: '#fff',
            border: '1px solid rgba(4,50,34,0.08)',
          }}
        >
          <ListingForm form={form} set={set} type={type} />

          {error && <ErrorBox message={error} />}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn-outline flex-1 py-3"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-bold disabled:opacity-60"
              style={{
                background:
                  type === 'skill'
                    ? 'var(--gold)'
                    : 'var(--forest)',
                color:
                  type === 'skill'
                    ? 'var(--forest)'
                    : 'var(--cream)',
                fontFamily: '"Playfair Display", serif',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--cream)' }}
    >
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{
          borderColor: 'var(--forest)',
          borderTopColor: 'transparent',
        }}
      />
    </div>
  )
}