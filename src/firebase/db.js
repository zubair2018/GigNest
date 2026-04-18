import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, where, orderBy,
  serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { db } from './config'

const JOBS = 'jobs'

export async function createJob(jobData, user) {
  const ref = await addDoc(collection(db, JOBS), {
    ...jobData,
    postedBy: { uid: user.uid, name: user.displayName, photo: user.photoURL },
    createdAt: serverTimestamp(),
    savedBy: [],
    featured: false,
    featuredUntil: null,
    views: 0,
  })
  return ref.id
}

export async function getJobs(category = null) {
  let q
  if (category && category !== 'All') {
    q = query(collection(db, JOBS), where('category', '==', category), orderBy('createdAt', 'desc'))
  } else {
    q = query(collection(db, JOBS), orderBy('createdAt', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getJob(id) {
  const snap = await getDoc(doc(db, JOBS, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function getMyJobs(uid) {
  const q = query(collection(db, JOBS), where('postedBy.uid', '==', uid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateJob(id, data) {
  await updateDoc(doc(db, JOBS, id), data)
}

export async function deleteJob(id) {
  await deleteDoc(doc(db, JOBS, id))
}

export async function toggleSaveJob(jobId, uid, isSaved) {
  await updateDoc(doc(db, JOBS, jobId), {
    savedBy: isSaved ? arrayRemove(uid) : arrayUnion(uid),
  })
}

export async function getSavedJobs(uid) {
  const q = query(collection(db, JOBS), where('savedBy', 'array-contains', uid))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function incrementViews(id) {
  const ref = doc(db, JOBS, id)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, { views: (snap.data().views || 0) + 1 })
  }
}
