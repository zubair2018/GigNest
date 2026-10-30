import { useCallback, useEffect, useRef, useState } from 'react'
import { getMarketplacePage } from '../firebase/db'

const PAGE_SIZE = 20

function getSourceError(error, label) {
  console.error(`${label} marketplace load failed:`, error)

  if (error?.code === 'permission-denied') {
    return `Firestore denied access to ${label.toLowerCase()}. Check account verification and database rules.`
  }

  if (error?.code === 'failed-precondition') {
    return `Firestore needs an index for ${label.toLowerCase()}. Check the Firebase console index link in the browser error.`
  }

  if (error?.code === 'unavailable' || error?.code === 'network-request-failed') {
    return `Could not connect to load ${label.toLowerCase()}. Check your connection and retry.`
  }

  return `Could not load ${label.toLowerCase()}. Check Firebase configuration and try again.`
}

function orderListings(listings) {
  return [...listings].sort((first, second) => {
    const firstTime = first.createdAt?.toMillis?.() || first.publishedAt?.toMillis?.() || 0
    const secondTime = second.createdAt?.toMillis?.() || second.publishedAt?.toMillis?.() || 0
    return secondTime - firstTime
  })
}

export function useMarketplace() {
  const [jobs, setJobs] = useState([])
  const [skills, setSkills] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [skillsLoading, setSkillsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState({ jobs: false, skills: false })
  const [jobsError, setJobsError] = useState('')
  const [skillsError, setSkillsError] = useState('')
  const [hasMore, setHasMore] = useState({ jobs: false, skills: false })
  const cursors = useRef({ jobs: null, skills: null })
  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current
    cursors.current = { jobs: null, skills: null }
    setJobsLoading(true)
    setSkillsLoading(true)
    setJobsError('')
    setSkillsError('')
    setHasMore({ jobs: false, skills: false })
    setJobs([])
    setSkills([])

    const loadSource = async (kind, setter, errorSetter, loadingSetter) => {
      try {
        const page = await getMarketplacePage(kind, null, PAGE_SIZE)
        if (currentRequest !== requestId.current) return
        setter(orderListings(page.items))
        cursors.current[kind] = page.cursor
        setHasMore(current => ({ ...current, [kind]: page.hasMore }))
      } catch (error) {
        if (currentRequest !== requestId.current) return
        errorSetter(getSourceError(error, kind === 'jobs' ? 'Hiring requests' : 'Services'))
      } finally {
        if (currentRequest === requestId.current) loadingSetter(false)
      }
    }

    await Promise.all([
      loadSource('jobs', setJobs, setJobsError, setJobsLoading),
      loadSource('skills', setSkills, setSkillsError, setSkillsLoading),
    ])
  }, [])

  const loadMore = useCallback(async kind => {
    if (!['jobs', 'skills'].includes(kind) || !hasMore[kind] || loadingMore[kind]) return

    const currentRequest = requestId.current
    setLoadingMore(current => ({ ...current, [kind]: true }))

    try {
      const page = await getMarketplacePage(kind, cursors.current[kind], PAGE_SIZE)
      if (currentRequest !== requestId.current) return
      const setter = kind === 'jobs' ? setJobs : setSkills
      setter(current => orderListings([...current, ...page.items]))
      cursors.current[kind] = page.cursor
      setHasMore(current => ({ ...current, [kind]: page.hasMore }))
    } catch (error) {
      if (currentRequest !== requestId.current) return
      const errorSetter = kind === 'jobs' ? setJobsError : setSkillsError
      errorSetter(getSourceError(error, kind === 'jobs' ? 'Hiring requests' : 'Services'))
    } finally {
      if (currentRequest === requestId.current) {
        setLoadingMore(current => ({ ...current, [kind]: false }))
      }
    }
  }, [hasMore, loadingMore])

  useEffect(() => {
    refresh()
    return () => {
      requestId.current += 1
    }
  }, [refresh])

  return {
    jobs,
    skills,
    jobsLoading,
    skillsLoading,
    loading: jobsLoading || skillsLoading,
    loadingMore,
    jobsError,
    skillsError,
    hasMore,
    loadMore,
    refresh,
  }
}
