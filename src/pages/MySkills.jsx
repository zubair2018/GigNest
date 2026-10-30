import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMySkills, setSkillStatus } from '../firebase/db'
import { SKILL_STATUS } from '../shared/constants'
import JobCard from '../components/JobCard'
import { DashboardLayout } from './MyJobs'

const GROUPS = [
  { status: SKILL_STATUS.PENDING_REVIEW, title: 'Pending review', empty: 'No services waiting for review.' },
  { status: SKILL_STATUS.PUBLISHED, title: 'Published services', empty: 'No approved services yet.' },
  { status: SKILL_STATUS.REJECTED, title: 'Changes requested', empty: 'No services need changes.' },
  { status: SKILL_STATUS.ACTIVE, title: 'Legacy services (review required)', empty: 'No legacy services.' },
  { status: SKILL_STATUS.PAUSED, title: 'Paused services', empty: 'No paused services.' },
  { status: SKILL_STATUS.SUSPENDED, title: 'Suspended', empty: 'No suspended services.' },
]

export default function MySkills() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const cursorRef = useRef(null)
  const requestSequence = useRef(0)

  const loadSkills = useCallback(async (append = false) => {
    if (!user) return
    const requestId = ++requestSequence.current
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError('')
    try {
      const page = await getMySkills(user.uid, append ? cursorRef.current : null)
      if (requestId !== requestSequence.current) return
      setSkills(current => append ? [...current, ...page.items] : page.items)
      cursorRef.current = page.hasMore ? page.cursor : null
      setNextCursor(cursorRef.current)
    } catch (loadError) {
      if (requestId !== requestSequence.current) return
      console.error('Unable to load services:', loadError)
      setError('Could not load your services. Check your connection and retry.')
    } finally {
      if (requestId === requestSequence.current) {
        if (append) setLoadingMore(false)
        else setLoading(false)
      }
    }
  }, [user])

  useEffect(() => {
    loadSkills()
    return () => { requestSequence.current += 1 }
  }, [loadSkills])

  async function changeStatus(skill, status) {
    setBusyId(skill.id)
    setError('')
    try {
      await setSkillStatus(skill.id, status)
      await loadSkills()
    } catch (statusError) {
      console.error('Unable to change service status:', statusError)
      setError('Could not update this service. It may be suspended or no longer editable.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <DashboardLayout
      title="My services"
      description="Services are free. New submissions and edits go to review before they appear publicly. Showing up to 30 services per page."
      buttonText="+ Offer a service"
      onButtonClick={() => navigate('/post-skill')}
      error={error}
      loading={loading}
    >
      {GROUPS.map(group => {
        const items = skills.filter(skill => skill.status === group.status)
        if (!items.length && group.status !== SKILL_STATUS.PENDING_REVIEW && group.status !== SKILL_STATUS.PUBLISHED) return null

        return (
          <section className="mb-10" key={group.status}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-black text-xl" style={{ fontFamily: '"Playfair Display", serif', color: 'var(--forest)' }}>{group.title}</h2>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{items.length}</span>
            </div>
            {!items.length ? (
              <div className="rounded-2xl px-5 py-7 text-sm" style={{ background: '#fff', border: '1px solid rgba(4,50,34,0.08)', color: 'var(--muted)' }}>{group.empty}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(skill => (
                  <article key={skill.id} className="space-y-2">
                    {skill.status === SKILL_STATUS.REJECTED && skill.rejectionReason && (
                      <p className="rounded-lg px-3 py-2 text-xs" style={{ background: '#fff7ed', color: '#9a3412' }}>
                        Requested changes: {skill.rejectionReason}
                      </p>
                    )}
                    <JobCard job={skill} />
                    <div className="flex flex-wrap gap-2">
                      {!['suspended', 'deleted'].includes(skill.status) && (
                        <button className="btn-outline text-xs" onClick={() => navigate(`/edit-skill/${skill.id}`)}>Edit / resubmit</button>
                      )}
                      {skill.status === SKILL_STATUS.PUBLISHED && (
                        <button className="btn-outline text-xs" disabled={busyId === skill.id} onClick={() => changeStatus(skill, SKILL_STATUS.PAUSED)}>Pause</button>
                      )}
                      {[SKILL_STATUS.PENDING_REVIEW, SKILL_STATUS.REJECTED, SKILL_STATUS.PUBLISHED, SKILL_STATUS.PAUSED].includes(skill.status) && (
                        <button className="btn-outline text-xs" disabled={busyId === skill.id} onClick={() => changeStatus(skill, SKILL_STATUS.DELETED)}>Remove</button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )
      })}
      {nextCursor && (
        <button type="button" className="btn-outline mb-8" onClick={() => loadSkills(true)} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Load next 30 services'}
        </button>
      )}
    </DashboardLayout>
  )
}
