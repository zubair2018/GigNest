import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSavedListingsPage } from '../firebase/db'
import JobCard from '../components/JobCard'

export default function SavedJobs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState('')
  const [error, setError] = useState('')
  const [nextCursors, setNextCursors] = useState({ jobs: null, skills: null })
  const requestSequence = useRef(0)
  const cursors = useRef({ jobs: null, skills: null })

  async function loadSavedListings(collectionName = null) {
    if (!user) return

    if (collectionName) {
      setLoadingMore(collectionName)
      setError('')
      try {
        const page = await getSavedListingsPage(
          user.uid,
          collectionName,
          cursors.current[collectionName]
        )
        const setItems = collectionName === 'jobs' ? setJobs : setSkills
        setItems(current => [...current, ...page.items])
        cursors.current[collectionName] = page.hasMore ? page.cursor : null
        setNextCursors(current => ({
          ...current,
          [collectionName]: cursors.current[collectionName],
        }))
      } catch (pageError) {
        console.error('Saved listing page error:', pageError)
        setError(`Could not load more saved ${collectionName === 'jobs' ? 'requests' : 'services'}.`)
      } finally {
        setLoadingMore('')
      }
      return
    }

    const requestId = ++requestSequence.current
    cursors.current = { jobs: null, skills: null }
    setNextCursors({ jobs: null, skills: null })
    setLoading(true)
    setError('')

    const results = await Promise.allSettled([
      getSavedListingsPage(user.uid, 'jobs'),
      getSavedListingsPage(user.uid, 'skills'),
    ])

    if (requestId !== requestSequence.current) return

    const jobPage = results[0].status === 'fulfilled' ? results[0].value : null
    const skillPage = results[1].status === 'fulfilled' ? results[1].value : null
    setJobs(jobPage?.items || [])
    setSkills(skillPage?.items || [])
    cursors.current = {
      jobs: jobPage?.hasMore ? jobPage.cursor : null,
      skills: skillPage?.hasMore ? skillPage.cursor : null,
    }
    setNextCursors(cursors.current)

    const failedSections = results
      .map((result, index) => result.status === 'rejected' ? (index === 0 ? 'requests' : 'services') : '')
      .filter(Boolean)

    if (failedSections.length) {
      setError(`Could not load saved ${failedSections.join(' and ')}. Retry to try again.`)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSavedListings()
    return () => { requestSequence.current += 1 }
  }, [user])

  const total = useMemo(() => jobs.length + skills.length, [jobs.length, skills.length])

  if (!user) return <Navigate to="/signin" replace />

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--cream)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="font-black text-3xl" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--forest)' }}>
              Saved Listings
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              {loading ? 'Loading saved listings...' : `${total} loaded saved listing${total !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={() => navigate('/')} className="btn-primary">Browse services</button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl px-4 py-3 text-sm" role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            {error} <button type="button" className="underline font-semibold" onClick={() => loadSavedListings()}>Retry</button>
          </div>
        )}

        {loading ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
        ) : total === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl" aria-hidden="true">🔖</p>
            <h2 className="font-black text-xl mt-4" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--forest)' }}>Nothing saved yet</h2>
            <p className="text-sm mt-2 mb-6" style={{ color: 'var(--muted)' }}>Save services or hiring requests to revisit them here.</p>
            <button onClick={() => navigate('/')} className="btn-primary">Browse listings</button>
          </div>
        ) : (
          <>
            <SavedSection
              title="Saved Services"
              collectionName="skills"
              items={skills}
              emptyMessage="You have not saved any services."
              onRefresh={loadSavedListings}
              hasMore={Boolean(nextCursors.skills)}
              loadingMore={loadingMore === 'skills'}
              onLoadMore={() => loadSavedListings('skills')}
            />
            <SavedSection
              title="Saved Hiring Requests"
              collectionName="jobs"
              items={jobs}
              emptyMessage="You have not saved any hiring requests."
              onRefresh={loadSavedListings}
              hasMore={Boolean(nextCursors.jobs)}
              loadingMore={loadingMore === 'jobs'}
              onLoadMore={() => loadSavedListings('jobs')}
            />
          </>
        )}
      </div>
    </div>
  )
}

function SavedSection({ title, collectionName, items, emptyMessage, onRefresh, hasMore, loadingMore, onLoadMore }) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-black text-xl" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--forest)' }}>{title}</h2>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>{items.length} loaded</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl px-5 py-7 text-sm" style={{ background: '#fff', border: '1px solid rgba(4,50,34,0.08)', color: 'var(--muted)' }}>{emptyMessage}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <JobCard key={`${collectionName}-${item.id}`} job={item} onSaveToggle={onRefresh} />
          ))}
        </div>
      )}
      {hasMore && (
        <button type="button" className="btn-outline mt-4" onClick={onLoadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Load next 30'}
        </button>
      )}
    </section>
  )
}
