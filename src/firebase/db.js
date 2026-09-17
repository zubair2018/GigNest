import {
  collection, addDoc, getDocs, getDoc, doc, setDoc,
  updateDoc, deleteDoc, query, where, orderBy,
  serverTimestamp, arrayUnion, arrayRemove, onSnapshot, increment,
} from 'firebase/firestore'
import { db } from './config'

const JOBS = 'jobs'
const CHATS = 'chats'

// ── JOBS ──────────────────────────────────────────────────
export async function createJob(jobData, user, phone) {
  const ref = await addDoc(collection(db, JOBS), {
    ...jobData,
    postedBy: { uid: user.uid, name: user.displayName, photo: user.photoURL },
    createdAt: serverTimestamp(),
    savedBy: [],
    featured: false,
    featuredUntil: null,
    views: 0,
    phone: phone || '',
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
  const q = query(
    collection(db, JOBS),
    where('postedBy.uid', '==', uid),
    orderBy('createdAt', 'desc')
  )
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
  const q = query(
    collection(db, JOBS),
    where('savedBy', 'array-contains', uid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function incrementViews(id) {
  await updateDoc(doc(db, JOBS, id), { views: increment(1) })
}

// ── CHATS ─────────────────────────────────────────────────
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

// ── FEATURED POSTS (ADMIN ONLY) ─────────────────────────────
export async function activateFeaturedPost(jobId, days) {
  const until = new Date()
  until.setDate(until.getDate() + days)

  await updateDoc(doc(db, JOBS, jobId), {
    featured: true,
    featuredUntil: until,
  })
}

// ── PAYMENTS ────────────────────────────────────────────────
export async function createPaymentRequest({ jobId, jobTitle, planDays, planPrice, userId, userName }) {
  const ref = await addDoc(collection(db, 'payments'), {
    jobId,
    jobTitle,
    planDays,
    planPrice,
    userId,
    userName,
    status: 'pending', // pending | paid | expired
    createdAt: serverTimestamp(),
    paidAt: null,
    activatedAt: null,
  })
  return ref.id
}

export async function updatePaymentStatus(paymentId, status, extra = {}) {
  const data = { status, ...extra }
  if (status === 'paid') data.paidAt = serverTimestamp()
  if (status === 'activated') data.activatedAt = serverTimestamp()
  await updateDoc(doc(db, 'payments', paymentId), data)
}

export async function getPendingPayments() {
  const q = query(collection(db, 'payments'), where('status', '==', 'pending'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}