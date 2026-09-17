import {
  collection, addDoc, getDocs, getDoc, doc, setDoc,
  updateDoc, deleteDoc, query, where, orderBy,
  serverTimestamp, arrayUnion, arrayRemove, onSnapshot, increment,
} from 'firebase/firestore'
import { db } from './config'

const JOBS = 'jobs'
const CHATS = 'chats'

// ── JOBS ──────────────────────────────────────────────────
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

export async function getJobs() {
  const q = query(collection(db, JOBS), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getJob(id) {
  const snap = await getDoc(doc(db, JOBS, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function getMyJobs(uid) {
  const q = query(collection(db, JOBS), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(j => j.postedBy?.uid === uid)
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
  const q = query(collection(db, JOBS), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(j => Array.isArray(j.savedBy) && j.savedBy.includes(uid))
}

export async function incrementViews(id) {
  await updateDoc(doc(db, JOBS, id), { views: increment(1) })
}

// ── CHATS ─────────────────────────────────────────────────
// Unique chat doc ID — same two users on same job always get same chat
function makeChatId(uid1, uid2, jobId) {
  return [uid1, uid2].sort().join('_') + '_' + jobId
}

export async function getOrCreateChat(jobId, jobTitle, senderUser, receiverUser) {
  const chatDocId = makeChatId(senderUser.uid, receiverUser.uid, jobId)
  const ref = doc(db, CHATS, chatDocId)
  await setDoc(ref, {
    jobId,
    jobTitle,
    participants: [senderUser.uid, receiverUser.uid],
    participantNames: {
      [senderUser.uid]: senderUser.displayName || 'User',
      [receiverUser.uid]: receiverUser.displayName || 'User',
    },
    participantPhotos: {
      [senderUser.uid]: senderUser.photoURL || '',
      [receiverUser.uid]: receiverUser.photoURL || '',
    },
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true })
  return chatDocId
}

export async function sendMessage(chatDocId, senderUid, text) {
  await addDoc(collection(db, CHATS, chatDocId, 'messages'), {
    senderUid,
    text: text.trim(),
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, CHATS, chatDocId), {
    lastMessage: text.trim(),
    lastMessageAt: serverTimestamp(),
  })
}

export function subscribeMessages(chatDocId, callback) {
  const q = query(
    collection(db, CHATS, chatDocId, 'messages'),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function getMyChats(uid) {
  const q = query(
    collection(db, CHATS),
    where('participants', 'array-contains', uid),
    orderBy('lastMessageAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}