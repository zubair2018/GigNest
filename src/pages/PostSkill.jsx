import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createSkill } from '../firebase/db'
import {
  parsePortfolio,
  parseTags,
  validateListing,
} from '../shared/validation'
import {
  AuthRequiredCard,
  ErrorBox,
  ListingForm,
} from './PostJob'

export default function PostSkill() {
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

    const validationError = validateListing(form, 'skill')

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
      const skillId = await createSkill(
        {
          title: form.title.trim(),
          category: form.category,
          location: form.location.trim(),
          description: form.description.trim(),
          payMin: Number(form.payMin),
          payMax: Number(form.payMax),
          payType: form.payType,
          tags: parseTags(form.tags),
          availability: form.availability,
          portfolio: parsePortfolio(form.portfolioText),
        },
        user
      )

      navigate(`/job/${skillId}`)
    } catch (error) {
      console.error('Skill creation error:', error)
      setError('Unable to create your skill profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <AuthRequiredCard
        title="Offer your skill for free"
        description="Create a free service listing. It will be reviewed before appearing publicly."
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
          style={{ background: 'var(--gold)' }}
        >
          <p className="text-3xl">🙋</p>

          <h1
            className="font-black text-2xl mt-2"
            style={{
              fontFamily: '"Playfair Display", serif',
              color: 'var(--forest)',
            }}
          >
            Offer a Skill
          </h1>

          <p
            className="text-sm mt-1"
            style={{ color: 'rgba(4,50,34,0.7)' }}
          >
            Creating a listing is free. Services appear after review; portfolio links are optional and do not verify ownership.
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
          <ListingForm form={form} set={set} type="skill" />

          {error && <ErrorBox message={error} />}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold disabled:opacity-60"
            style={{
              background: 'var(--gold)',
              color: 'var(--forest)',
              fontFamily: '"Playfair Display", serif',
            }}
          >
            {submitting
              ? 'Creating profile...'
              : 'Create Free Skill Profile →'}
          </button>
        </form>
      </div>
    </div>
  )
}