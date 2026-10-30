import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { getSavedListingIds, toggleSavedListing } from '../firebase/db'

const SavedListingsContext = createContext(null)

export function SavedListingsProvider({ children }) {
  const { user } = useAuth()
  const [savedIds, setSavedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setSavedIds(new Set())
      return
    }

    setLoading(true)
    try {
      setSavedIds(new Set(await getSavedListingIds(user.uid)))
    } catch (error) {
      console.error('Unable to load private saved listings:', error)
      setSavedIds(new Set())
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!user) {
        setSavedIds(new Set())
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const ids = await getSavedListingIds(user.uid)
        if (mounted) setSavedIds(new Set(ids))
      } catch (error) {
        console.error('Unable to load private saved listings:', error)
        if (mounted) setSavedIds(new Set())
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [user])

  const toggle = useCallback(async (collectionName, listingId) => {
    if (!user) throw new Error('Sign in to save listings.')
    const savedId = `${collectionName}_${listingId}`
    const wasSaved = savedIds.has(savedId)

    await toggleSavedListing(collectionName, listingId, user.uid, wasSaved)
    setSavedIds(current => {
      const next = new Set(current)
      if (wasSaved) next.delete(savedId)
      else next.add(savedId)
      return next
    })
  }, [savedIds, user])

  return (
    <SavedListingsContext.Provider value={{ savedIds, loading, refresh, toggle }}>
      {children}
    </SavedListingsContext.Provider>
  )
}

export function useSavedListings() {
  const context = useContext(SavedListingsContext)
  if (!context) throw new Error('useSavedListings must be used inside SavedListingsProvider.')
  return context
}
