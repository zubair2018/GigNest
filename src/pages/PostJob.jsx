import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createJob } from '../firebase/db'
import {
  CATEGORIES,
  PAY_TYPES,
} from '../shared/constants'
import {
  parseTags,
  validateListing,
} from '../shared/validation'

export default function PostJob() {
  const { user, signInWithGoogle, signingIn } = useAuth()
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)
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
    portfolioText: '',
  })

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

    if (!user) {
      await signInWithGoogle()
      return
    }

    setSubmitting(true)

    try {
      const jobId = await createJob(
        {
          title: form.title.trim(),
          category: form.category,
          location: form.location.trim(),
          description: form.description.trim(),
          payMin: Number(form.payMin),
          payMax: Number(form.payMax),
          payType: form.payType,
          tags: parseTags(form.tags),
          availability: 'remote',
          portfolio: [],
        },
        user
      )

      navigate(`/job/${jobId}`)
    } catch (error) {
      console.error('Job create error:', error)
      setError('Could not post your request. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <AuthRequiredCard
        title="Sign in to post a job"
        description="Post a hiring request for free. You can message applicants directly."
        signingIn={signingIn}
        onSignIn={signInWithGoogle}
      />
    )
  }

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{ background: 'var(--cream)' }}
    >
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-sm mb-5"
          style={{ color: 'var(--muted)' }}
        >
          ← Back
        </button>

        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: 'var(--forest)' }}
        >
          <p className="text-3xl">🧑‍💼</p>

          <h1
            className="font-black text-2xl mt-2"
            style={{
              fontFamily: '"Playfair Display", serif',
              color: 'var(--cream)',
            }}
          >
            Post a Hiring Request
          </h1>

          <p
            className="text-sm mt-1"
            style={{ color: 'rgba(246,233,208,0.64)' }}
          >
            Hiring requests are free and published immediately. Requests may be suspended for policy violations.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: '#fff',
            border: '1px solid rgba(4,50,34,0.08)',
          }}
        >
          <ListingForm
            form={form}
            set={set}
            type="job"
          />

          {error && <ErrorBox message={error} />}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold disabled:opacity-60"
            style={{
              background: 'var(--forest)',
              color: 'var(--cream)',
              fontFamily: '"Playfair Display", serif',
            }}
          >
            {submitting ? 'Posting...' : 'Post request for free →'}
          </button>
        </form>
      </div>
    </div>
  )
}

export function ListingForm({ form, set, type }) {
  const isSkill = type === 'skill'

  return (
    <>
      <div>
        <label className="label" htmlFor="listing-title">
          {isSkill ? 'Your skill or service title *' : 'What do you need? *'}
        </label>

        <input
          id="listing-title"
          className="input"
          value={form.title}
          onChange={event => set('title', event.target.value)}
          placeholder={
            isSkill
              ? 'I build React apps, Logo Design, Home Tutoring...'
              : 'Need a React developer for my app'
          }
          minLength={5}
          maxLength={100}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="listing-category">Category *</label>

          <select
            id="listing-category"
            className="input cursor-pointer"
            value={form.category}
            onChange={event => set('category', event.target.value)}
          >
            {CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="listing-location">Location *</label>

          <input
            id="listing-location"
            className="input"
            value={form.location}
            onChange={event => set('location', event.target.value)}
            placeholder="Srinagar, Remote..."
            minLength={2}
            maxLength={80}
            required
          />
        </div>
      </div>

      {isSkill && (
        <div>
          <label className="label" htmlFor="service-availability">
            Work arrangement *
          </label>
          <select
            id="service-availability"
            className="input cursor-pointer"
            value={form.availability}
            onChange={event => set('availability', event.target.value)}
          >
            <option value="remote">Remote</option>
            <option value="onsite">On-site</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      )}

      <div>
        <label className="label" htmlFor="listing-description">
          {isSkill
            ? 'Describe your experience and service *'
            : 'Describe the work *'}
        </label>

        <textarea
          id="listing-description"
          className="input min-h-[110px] resize-y"
          value={form.description}
          onChange={event => set('description', event.target.value)}
          placeholder={
            isSkill
              ? 'Experience, past work, delivery time, portfolio...'
              : 'Requirements, timeline, expected delivery...'
          }
          minLength={20}
          maxLength={3000}
          required
        />
      </div>

      <div>
        <label className="label">
          {isSkill ? 'Your rate (₹) *' : 'Budget (₹) *'}
        </label>

        <div className="grid grid-cols-3 gap-2">
          <input
            id="listing-pay-min"
            className="input"
            type="number"
            min="0"
            max="1000000000"
            required
            value={form.payMin}
            onChange={event => set('payMin', event.target.value)}
            placeholder="Min"
          />

          <input
            id="listing-pay-max"
            className="input"
            type="number"
            min="0"
            max="1000000000"
            required
            value={form.payMax}
            onChange={event => set('payMax', event.target.value)}
            placeholder="Max"
          />

          <select
            id="listing-pay-unit"
            className="input cursor-pointer"
            value={form.payType}
            onChange={event => set('payType', event.target.value)}
          >
            {PAY_TYPES.map(payType => (
              <option key={payType} value={payType}>
                {payType}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="listing-tags">
          {isSkill ? 'Skills and tools' : 'Skills needed'}
        </label>

        <input
          id="listing-tags"
          className="input"
          value={form.tags}
          onChange={event => set('tags', event.target.value)}
          placeholder="React, Tailwind, Figma"
          maxLength={220}
        />
      </div>

      {isSkill && (
        <div>
          <label className="label" htmlFor="service-portfolio">
            Portfolio links (optional, up to 5)
          </label>
          <textarea
            id="service-portfolio"
            className="input min-h-[100px] resize-y"
            value={form.portfolioText}
            onChange={event => set('portfolioText', event.target.value)}
            placeholder={'Website | https://example.com\nhttps://youtube.com/...'}
            maxLength={10500}
            aria-describedby="portfolio-help"
          />
          <p id="portfolio-help" className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            One HTTPS link per line. Optionally add a label followed by |. Links must be publicly viewable; they do not prove ownership or professional verification.
          </p>
        </div>
      )}
    </>
  )
}

export function ErrorBox({ message }) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
      }}
    >
      ⚠️ {message}
    </div>
  )
}

export function AuthRequiredCard({
  title,
  description,
  signingIn,
  onSignIn,
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--cream)' }}
    >
      <div
        className="rounded-2xl p-8 max-w-sm w-full text-center"
        style={{
          background: '#fff',
          border: '1px solid rgba(4,50,34,0.1)',
        }}
      >
        <p className="text-4xl">🔒</p>

        <h1
          className="font-black text-2xl mt-3"
          style={{
            fontFamily: '"Playfair Display", serif',
            color: 'var(--forest)',
          }}
        >
          {title}
        </h1>

        <p className="text-sm mt-2 mb-5" style={{ color: 'var(--muted)' }}>
          {description}
        </p>

        <button
          onClick={onSignIn}
          disabled={signingIn}
          className="btn-primary w-full py-3 disabled:opacity-60"
        >
          {signingIn ? 'Opening sign-in...' : 'Sign in with Google →'}
        </button>
      </div>
    </div>
  )
}