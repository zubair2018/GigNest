import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyJobs, setJobStatus } from '../firebase/db'
import { JOB_STATUS } from '../shared/constants'
import JobCard from '../components/JobCard'

export default function MyJobs() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [updatingJobId, setUpdatingJobId] = useState('')
  const [error, setError] = useState('')
  const requestSequence = useRef(0)
  const cursorRef = useRef(null)

  async function loadJobs(append = false) {
    if (!user) return

    const requestId = ++requestSequence.current
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError('')

    try {
      const data = await getMyJobs(user.uid, append ? cursorRef.current : null)
      if (requestId !== requestSequence.current) return
      setJobs(current => append ? [...current, ...data.items] : data.items)
      cursorRef.current = data.hasMore ? data.cursor : null
      setNextCursor(cursorRef.current)
    } catch (err) {
      if (requestId !== requestSequence.current) return
      console.error('Unable to load my jobs:', err)
      setError('Unable to load your jobs. Please refresh and try again.')
    } finally {
      if (requestId === requestSequence.current) {
        if (append) setLoadingMore(false)
        else setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadJobs()
    return () => { requestSequence.current += 1 }
  }, [user])

  const groupedJobs = useMemo(() => {
    return {
      pending: jobs.filter(
        job => job.status === JOB_STATUS.PENDING_PAYMENT
      ),
      published: jobs.filter(
        job => job.status === JOB_STATUS.PUBLISHED && job.privacySafe === true
      ),
      paused: jobs.filter(job => job.status === JOB_STATUS.PAUSED && job.privacySafe === true),
      closed: jobs.filter(job => job.status === JOB_STATUS.CLOSED && job.privacySafe === true),
      privateLegacy: jobs.filter(job =>
        job.privacySafe !== true && [JOB_STATUS.PUBLISHED, JOB_STATUS.PAUSED, JOB_STATUS.CLOSED].includes(job.status)
      ),
      removed: jobs.filter(job => job.status === JOB_STATUS.DELETED),
    }
  }, [jobs])

  async function changeStatus(job, status) {
    setUpdatingJobId(job.id)
    setError('')

    try {
      await setJobStatus(job.id, status)
      await loadJobs()
    } catch (err) {
      console.error('Job status update error:', err)
      setError('Could not update this request. Refresh and try again.')
    } finally {
      setUpdatingJobId('')
    }
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  return (
    <DashboardLayout
      title="My Jobs"
      description="Manage your free hiring requests. New requests publish immediately and may be suspended for policy violations. Showing up to 30 requests per page."
      buttonText="+ Post a request"
      onButtonClick={() => navigate('/post-job')}
      error={error}
      loading={loading}
    >
      <JobSection
        title="Published"
        jobs={groupedJobs.published}
        emptyMessage="You have no published jobs yet."
        onRefresh={loadJobs}
        renderAction={job => (
          <div className="flex gap-2">
            <button disabled={updatingJobId === job.id} onClick={() => changeStatus(job, JOB_STATUS.PAUSED)} className="btn-outline text-xs">
              Pause
            </button>
            <button disabled={updatingJobId === job.id} onClick={() => changeStatus(job, JOB_STATUS.CLOSED)} className="btn-outline text-xs">
              Close
            </button>
            <button disabled={updatingJobId === job.id} onClick={() => changeStatus(job, JOB_STATUS.DELETED)} className="btn-outline text-xs">
              Remove
            </button>
          </div>
        )}
      />

      <JobSection
        title="Private legacy requests: edit to remove old contact data"
        jobs={groupedJobs.privateLegacy}
        emptyMessage="No legacy requests need privacy updates."
        onRefresh={loadJobs}
        renderAction={job => (
          <button onClick={() => navigate(`/edit/${job.id}`)} className="btn-outline text-xs">
            Edit and make safe
          </button>
        )}
      />

      <JobSection
        title="Closed"
        jobs={groupedJobs.closed}
        emptyMessage="No closed requests."
        onRefresh={loadJobs}
        renderAction={job => (
          <div className="flex gap-2">
            <button disabled={updatingJobId === job.id} onClick={() => changeStatus(job, JOB_STATUS.PUBLISHED)} className="btn-outline text-xs">
              Reopen
            </button>
            <button disabled={updatingJobId === job.id} onClick={() => changeStatus(job, JOB_STATUS.DELETED)} className="btn-outline text-xs">
              Remove
            </button>
          </div>
        )}
      />

      <JobSection
        title="Paused"
        jobs={groupedJobs.paused}
        emptyMessage="You have no paused requests."
        onRefresh={loadJobs}
        renderAction={job => (
          <div className="flex gap-2">
            <button disabled={updatingJobId === job.id} onClick={() => changeStatus(job, JOB_STATUS.PUBLISHED)} className="btn-outline text-xs">
              Reopen
            </button>
            <button disabled={updatingJobId === job.id} onClick={() => changeStatus(job, JOB_STATUS.CLOSED)} className="btn-outline text-xs">
              Close
            </button>
            <button disabled={updatingJobId === job.id} onClick={() => changeStatus(job, JOB_STATUS.DELETED)} className="btn-outline text-xs">
              Remove
            </button>
          </div>
        )}
      />

      {groupedJobs.pending.length > 0 && (
        <JobSection
          title="Older unpublished requests"
          jobs={groupedJobs.pending}
          emptyMessage=""
          onRefresh={loadJobs}
        />
      )}

      <JobSection
        title="Deleted"
        jobs={groupedJobs.removed}
        emptyMessage="No removed requests."
        onRefresh={loadJobs}
      />
      {nextCursor && (
        <button type="button" className="btn-outline mb-8" onClick={() => loadJobs(true)} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Load next 30 requests'}
        </button>
      )}
    </DashboardLayout>
  )
}

export function DashboardLayout({
  title,
  description,
  buttonText,
  onButtonClick,
  error,
  loading,
  children,
}) {
  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{ background: 'var(--cream)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1
              className="font-black text-3xl"
              style={{
                fontFamily: '"Playfair Display", serif',
                color: 'var(--forest)',
              }}
            >
              {title}
            </h1>

            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              {description}
            </p>
          </div>

          <button onClick={onButtonClick} className="btn-primary">
            {buttonText}
          </button>
        </div>

        {error && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            Loading...
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function JobSection({
  title,
  jobs,
  emptyMessage,
  onRefresh,
  renderAction,
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2
          className="font-black text-xl"
          style={{
            fontFamily: '"Playfair Display", serif',
            color: 'var(--forest)',
          }}
        >
          {title}
        </h2>

        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {jobs.length}
        </span>
      </div>

      {jobs.length === 0 ? (
        <div
          className="rounded-2xl px-5 py-7 text-sm"
          style={{
            background: '#fff',
            border: '1px solid rgba(4,50,34,0.08)',
            color: 'var(--muted)',
          }}
        >
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(job => (
            <div key={job.id} className="space-y-2">
              {renderAction && (
                <div className="flex justify-end">
                  {renderAction(job)}
                </div>
              )}

              <JobCard job={job} onSaveToggle={onRefresh} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}