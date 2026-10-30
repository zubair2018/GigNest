import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSavedListings } from '../context/SavedListingsContext'
import {
  getJob,
  getSkill,
  getOrCreateChat,
  incrementJobViews,
  incrementSkillViews,
} from '../firebase/db'
import { JOB_STATUS, SKILL_STATUS } from '../shared/constants'

const BADGE = {
  Tech: 'bg-emerald-50 text-emerald-800',
  Design: 'bg-purple-50 text-purple-800',
  Local: 'bg-amber-50 text-amber-800',
  Content: 'bg-pink-50 text-pink-800',
  Education: 'bg-blue-50 text-blue-800',
}

function safePortfolioUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, signingIn } = useAuth()
  const { savedIds, toggle } = useSavedListings()
  const loadSequence = useRef(0)

  const [listing, setListing] = useState(null)
  const [listingType, setListingType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [contacting, setContacting] = useState(false)

  async function loadListing(shouldCountView = false) {
    const requestId = ++loadSequence.current
    setLoading(true)
    setError('')

    // Jobs and skills share the same /job/:id URL, so we don't know
    // which collection this id belongs to. Each lookup is tried in its
    // own try/catch: Firestore's security rules throw a permission
    // error (not a clean "not found") when a document doesn't exist in
    // a collection, so a single shared try/catch here would let a
    // failed job lookup kill the skill lookup that should follow it.
    let lookupError = null
    let jobData = null
    let skillData = null

    try {
      jobData = await getJob(id)
    } catch (err) {
      lookupError = err
      jobData = null
    }

    if (requestId !== loadSequence.current) return

    if (jobData) {
      setListing(jobData)
      setListingType('job')

      if (
        shouldCountView &&
        user &&
        user.uid !== jobData.postedBy?.uid &&
        jobData.status === JOB_STATUS.PUBLISHED
      ) {
        incrementJobViews(id).catch(() => {})
      }

      setLoading(false)
      return
    }

    try {
      skillData = await getSkill(id)
    } catch (err) {
      lookupError = err
      skillData = null
    }

    if (requestId !== loadSequence.current) return

    if (skillData) {
      setListing(skillData)
      setListingType('skill')

      if (
        shouldCountView &&
        user &&
        user.uid !== skillData.postedBy?.uid &&
        skillData.status === SKILL_STATUS.PUBLISHED
      ) {
        incrementSkillViews(id).catch(() => {})
      }

      setLoading(false)
      return
    }

    setListing(null)
    setListingType('')
    if (lookupError) {
      console.error('Listing access error:', lookupError)
      setError(lookupError.code === 'permission-denied'
        ? 'This listing is not public or you do not have permission to view it.'
        : 'Could not load this listing. Check your connection and try again.')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadListing(true)
    return () => { loadSequence.current += 1 }
  }, [id, user?.uid])

  if (loading) {
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

  if (!listing) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-4"
        style={{ background: 'var(--cream)' }}
      >
        <p className="text-5xl">😕</p>

        <h1
          className="font-black text-2xl"
          style={{
            fontFamily: '"Playfair Display", serif',
            color: 'var(--forest)',
          }}
        >
          Listing not found
        </h1>

        <button onClick={() => navigate('/')} className="btn-primary">
          ← Back to home
        </button>
      </div>
    )
  }

  const isSkill = listingType === 'skill'
  const isOwner = user?.uid === listing.postedBy?.uid
  const saved = Boolean(
    user && savedIds.has(`${isSkill ? 'skills' : 'jobs'}_${listing.id}`)
  )

  const publicListing = listing.privacySafe === true && (isSkill
    ? listing.status === SKILL_STATUS.PUBLISHED
    : listing.status === JOB_STATUS.PUBLISHED)
  const canEdit = isSkill
    ? [SKILL_STATUS.PENDING_REVIEW, SKILL_STATUS.REJECTED, SKILL_STATUS.PUBLISHED, SKILL_STATUS.PAUSED, SKILL_STATUS.ACTIVE].includes(listing.status)
    : [JOB_STATUS.PUBLISHED, JOB_STATUS.PAUSED, JOB_STATUS.CLOSED].includes(listing.status)

  const initials =
    listing.postedBy?.name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'

  async function handleSave() {
    if (!user) {
      navigate(`/signin?returnTo=${encodeURIComponent(`/job/${id}`)}`)
      return
    }

    setSaving(true)

    try {
      await toggle(isSkill ? 'skills' : 'jobs', listing.id)
    } catch (error) {
      console.error('Save listing error:', error)
      setError('Unable to update saved listing.')
    } finally {
      setSaving(false)
    }
  }

  async function handleContact() {
    if (!user) {
      navigate(`/signin?returnTo=${encodeURIComponent(`/job/${id}`)}`)
      return
    }

    if (!user.emailVerified) {
      navigate(`/verify-email?returnTo=${encodeURIComponent(`/job/${id}`)}`)
      return
    }

    if (isOwner) return

    setContacting(true)

    try {
      const chatId = await getOrCreateChat(
        listing.id,
        listing.title,
        listingType,
        {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        {
          uid: listing.postedBy.uid,
          displayName: listing.postedBy.name,
          photoURL: listing.postedBy.photo,
        }
      )

      navigate(`/chat/${chatId}`)
    } catch (error) {
      console.error('Chat create error:', error)
      setError('Unable to open chat. Please try again.')
    } finally {
      setContacting(false)
    }
  }

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{ background: 'var(--cream)' }}
    >
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-sm mb-6"
          style={{ color: 'var(--muted)' }}
        >
          ← Back
        </button>

        {error && (
          <div
            className="mb-5 rounded-xl px-4 py-3 text-sm"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {!publicListing && isOwner && (
          <div
            className="mb-5 rounded-xl px-4 py-3 text-sm"
            style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              color: '#c2410c',
            }}
          >
            {listing.privacySafe !== true
              ? 'This legacy listing is private until edited to remove old public contact fields.'
              : listing.status === SKILL_STATUS.PENDING_REVIEW
              ? 'Your service is waiting for review and is not public yet.'
              : listing.status === SKILL_STATUS.REJECTED
                ? `Changes requested: ${listing.rejectionReason || 'Please edit and resubmit this service.'}`
                : listing.status === JOB_STATUS.PENDING_PAYMENT
                  ? 'This older job uses a retired publication flow and remains private. Its payment data has not been changed.'
                  : 'This listing is not currently public.'}
          </div>
        )}

        <article
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{
            background: '#fff',
            border: '1px solid rgba(4,50,34,0.08)',
          }}
        >
          <header className="p-6" style={{ background: 'var(--forest)' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                      BADGE[listing.category] || ''
                    }`}
                  >
                    {listing.category}
                  </span>

                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
                    style={{
                      background: isSkill
                        ? 'rgba(201,168,76,0.3)'
                        : 'rgba(246,233,208,0.15)',
                      color: isSkill
                        ? 'var(--gold)'
                        : 'rgba(246,233,208,0.8)',
                    }}
                  >
                    {isSkill
                      ? '🙋 Available for hire'
                      : '🧑‍💼 Looking to hire'}
                  </span>

                </div>

                <h1
                  className="font-black text-2xl leading-tight"
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    color: 'var(--cream)',
                  }}
                >
                  {listing.title}
                </h1>

                <div className="flex items-center gap-3 mt-3">
                  <p
                    className="text-xs"
                    style={{ color: 'rgba(246,233,208,0.58)' }}
                  >
                    📍 {listing.location}
                  </p>

                  {Number(listing.views) > 0 && (
                    <p
                      className="text-xs"
                      style={{ color: 'rgba(246,233,208,0.4)' }}
                    >
                      👁 {listing.views} views
                    </p>
                  )}
                </div>
              </div>

              {user && !isOwner && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2 rounded-lg disabled:opacity-60"
                  style={{
                    border: `1px solid ${
                      saved
                        ? 'var(--gold)'
                        : 'rgba(246,233,208,0.22)'
                    }`,
                    color: saved
                      ? 'var(--gold)'
                      : 'rgba(246,233,208,0.58)',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={saved ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              )}
            </div>
          </header>

          <div className="p-6">
            <div
              className="flex items-center gap-3 pb-5 mb-5"
              style={{ borderBottom: '1px solid rgba(4,50,34,0.08)' }}
            >
              {listing.postedBy?.photo ? (
                <img
                  src={listing.postedBy.photo}
                  alt=""
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: 'var(--forest)',
                    color: 'var(--cream)',
                  }}
                >
                  {initials}
                </div>
              )}

              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--forest)' }}
                >
                  {listing.postedBy?.name || 'Gigspot member'}
                </p>

                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {isSkill ? 'Service provider' : 'Hiring client'}
                </p>
              </div>
            </div>

            <section className="mb-5">
              <p className="label mb-2">
                {isSkill ? 'About this skill' : 'About this job'}
              </p>

              <p
                className="text-sm leading-relaxed whitespace-pre-line"
                style={{ color: '#3a2a10' }}
              >
                {listing.description}
              </p>
            </section>

            {listing.tags?.length > 0 && (
              <section className="mb-5">
                <p className="label mb-2">
                  {isSkill ? 'Skills offered' : 'Skills required'}
                </p>

                <div className="flex flex-wrap gap-2">
                  {listing.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full"
                      style={{
                        background: 'var(--cream)',
                        color: 'var(--muted)',
                        border: '1px solid rgba(4,50,34,0.1)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {isSkill && (
              <section className="mb-5">
                <p className="label mb-2">Work arrangement</p>
                <p className="text-sm capitalize" style={{ color: 'var(--text)' }}>
                  {listing.availability || 'Not specified'}
                </p>
              </section>
            )}

            {isSkill && listing.portfolio?.length > 0 && (
              <section className="mb-5">
                <p className="label mb-2">Portfolio links</p>
                <ul className="space-y-2">
                  {listing.portfolio.slice(0, 5).map((item, index) => {
                    const href = safePortfolioUrl(item.url)
                    return href ? (
                      <li key={`${href}-${index}`}>
                        <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--forest)' }}>
                          {item.label || 'View work'}
                        </a>
                      </li>
                    ) : null
                  })}
                </ul>
                <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                  External links are provided by the listing owner and do not verify ownership or credentials.
                </p>
              </section>
            )}

            <section
              className="rounded-xl p-4 mb-6"
              style={{ background: 'var(--forest)' }}
            >
              <p
                className="label mb-1"
                style={{ color: 'rgba(246,233,208,0.42)' }}
              >
                {isSkill ? 'Rate' : 'Budget'}
              </p>

              <p
                className="font-black text-2xl"
                style={{
                  fontFamily: '"Playfair Display", serif',
                  color: 'var(--cream)',
                }}
              >
                ₹{Number(listing.payMin).toLocaleString()} – ₹
                {Number(listing.payMax).toLocaleString()}

                <span
                  className="text-sm font-normal ml-1.5"
                  style={{
                    color: 'rgba(246,233,208,0.52)',
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  {listing.payType}
                </span>
              </p>
            </section>

            {isOwner ? (
              <div className="space-y-3">
                {canEdit && (
                  <button
                    onClick={() => navigate(isSkill ? `/edit-skill/${listing.id}` : `/edit/${listing.id}`)}
                    className="btn-outline w-full py-3"
                  >
                    Edit listing
                  </button>
                )}
              </div>
            ) : (
              <div>
                <button
                  onClick={handleContact}
                  disabled={contacting || signingIn}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base disabled:opacity-60"
                  style={{
                    background: 'var(--forest)',
                    color: 'var(--cream)',
                    fontFamily: '"Playfair Display", serif',
                  }}
                >
                  {contacting || signingIn
                    ? 'Opening chat...'
                    : `💬 ${
                        isSkill
                          ? `Message ${
                              listing.postedBy?.name?.split(' ')[0] || 'Professional'
                            }`
                          : `Contact ${
                              listing.postedBy?.name?.split(' ')[0] || 'Client'
                            }`
                      }`}
                </button>

                {!user && (
                  <p
                    className="text-xs text-center mt-3"
                    style={{ color: 'var(--muted)' }}
                  >
                    Sign in and verify your email to message or save this listing.
                  </p>
                )}
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}