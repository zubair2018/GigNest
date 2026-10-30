import {
  addDoc,
  collection,
  deleteField,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  increment,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './config'
import {
  JOB_STATUS,
  SKILL_STATUS,
} from '../shared/constants'

const JOBS = 'jobs'
const SKILLS = 'skills'
const USERS = 'users'
const CHATS = 'chats'

function mapDocs(snapshot) {
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

function listingOwner(user) {
  return {
    uid: user.uid,
    name: (user.displayName || 'User').trim().slice(0, 80) || 'User',
    photo: (user.photoURL || '').slice(0, 2048),
  }
}

export async function createOrUpdateUser(user) {
  if (!user?.uid) return

  const userRef = doc(db, USERS, user.uid)
  const existing = await getDoc(userRef)

  const userData = {
    uid: user.uid,
    name: (user.displayName || '').trim().slice(0, 60) || 'Gigspot member',
    email: user.email || '',
    photo: (user.photoURL || '').slice(0, 2048),
    lastLoginAt: serverTimestamp(),
  }

  if (!existing.exists()) {
    userData.createdAt = serverTimestamp()
  }

  await setDoc(userRef, userData, { merge: true })
}

export async function createJob(jobData, user) {
  const { portfolioText, ...listingData } = jobData

  const reference = await addDoc(collection(db, JOBS), {
    ...listingData,
    portfolio: Array.isArray(jobData.portfolio) ? jobData.portfolio : [],

    type: 'job',

    postedBy: listingOwner(user),

    status: JOB_STATUS.PUBLISHED,
    publishedAt: serverTimestamp(),
    privacySafe: true,

    featured: false,
    featuredUntil: null,

    views: 0,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return reference.id
}

export async function createSkill(skillData, user) {
  const reference = await addDoc(collection(db, SKILLS), {
    ...skillData,

    type: 'skill',

    postedBy: listingOwner(user),

    status: SKILL_STATUS.PENDING_REVIEW,
    rejectionReason: '',
    privacySafe: true,

    isVerified: false,
    verifiedUntil: null,
    verificationPlan: null,
    verificationPaymentId: null,

    featured: false,
    featuredUntil: null,

    views: 0,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return reference.id
}

async function getMyListingsPage(collectionName, uid, cursor, pageSize) {
  const q = query(
    collection(db, collectionName),
    where('postedBy.uid', '==', uid),
    orderBy('createdAt', 'desc'),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(Math.min(Math.max(Number(pageSize) || 30, 1), 50))
  )

  const snapshot = await getDocs(q)
  return {
    items: mapDocs(snapshot),
    cursor: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null,
    hasMore: snapshot.size === Math.min(Math.max(Number(pageSize) || 30, 1), 50),
  }
}

export async function getMyJobs(uid, cursor = null, pageSize = 30) {
  return getMyListingsPage(JOBS, uid, cursor, pageSize)
}

export async function getMySkills(uid, cursor = null, pageSize = 30) {
  return getMyListingsPage(SKILLS, uid, cursor, pageSize)
}

export async function getJob(id) {
  const snapshot = await getDoc(doc(db, JOBS, id))

  if (!snapshot.exists()) return null

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

export async function getSkill(id) {
  const snapshot = await getDoc(doc(db, SKILLS, id))

  if (!snapshot.exists()) return null

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

export async function updateJob(id, data) {
  await updateDoc(doc(db, JOBS, id), {
    ...data,
    phone: deleteField(),
    savedBy: deleteField(),
    privacySafe: true,
    updatedAt: serverTimestamp(),
  })
}

export async function setJobStatus(id, status) {
  await updateDoc(doc(db, JOBS, id), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function updateSkill(id, data) {
  await updateDoc(doc(db, SKILLS, id), {
    ...data,
    phone: deleteField(),
    savedBy: deleteField(),
    privacySafe: true,
    status: SKILL_STATUS.PENDING_REVIEW,
    rejectionReason: '',
    updatedAt: serverTimestamp(),
  })
}

export async function setSkillStatus(id, status) {
  await updateDoc(doc(db, SKILLS, id), {
    status,
    updatedAt: serverTimestamp(),
  })
}

const SAVED_LISTINGS = 'savedListings'

function savedListingRef(uid, collectionName, listingId) {
  return doc(db, USERS, uid, SAVED_LISTINGS, `${collectionName}_${listingId}`)
}

export async function toggleSavedListing(collectionName, listingId, uid, isSaved) {
  if (!['jobs', 'skills'].includes(collectionName)) {
    throw new Error('Unsupported listing type.')
  }

  const reference = savedListingRef(uid, collectionName, listingId)
  if (isSaved) {
    await deleteDoc(reference)
    return
  }

  await setDoc(reference, {
    collectionName,
    listingId,
    createdAt: serverTimestamp(),
  })
}

export async function getSavedListingIds(uid) {
  const q = query(
    collection(db, USERS, uid, SAVED_LISTINGS),
    orderBy('createdAt', 'desc'),
    limit(200)
  )
  return mapDocs(await getDocs(q)).map(item => `${item.collectionName}_${item.listingId}`)
}

export async function getSavedListingsPage(uid, collectionName, cursor = null, pageSize = 30) {
  if (!['jobs', 'skills'].includes(collectionName)) {
    throw new Error('Unsupported saved listing type.')
  }

  const safePageSize = Math.min(Math.max(Number(pageSize) || 30, 1), 50)
  const q = query(
    collection(db, USERS, uid, SAVED_LISTINGS),
    where('collectionName', '==', collectionName),
    orderBy('createdAt', 'desc'),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(safePageSize)
  )
  const bookmarkSnapshot = await getDocs(q)
  const saved = mapDocs(bookmarkSnapshot)
  const sourceCollection = collection(db, collectionName)
  const snapshots = await Promise.all(saved.map(item =>
    getDoc(doc(sourceCollection, item.listingId)).catch(() => null)
  ))

  const items = snapshots
    .filter(snapshot => snapshot?.exists()
      && snapshot.data().status === 'published'
      && snapshot.data().privacySafe === true)
    .map(snapshot => ({ id: snapshot.id, ...snapshot.data() }))
    .sort((first, second) => {
      const firstTime = first.createdAt?.toMillis?.() || first.publishedAt?.toMillis?.() || 0
      const secondTime = second.createdAt?.toMillis?.() || second.publishedAt?.toMillis?.() || 0
      return secondTime - firstTime
    })

  return {
    items,
    cursor: bookmarkSnapshot.docs.length
      ? bookmarkSnapshot.docs[bookmarkSnapshot.docs.length - 1]
      : null,
    hasMore: saved.length === safePageSize,
  }
}

export async function incrementJobViews(id) {
  await updateDoc(doc(db, JOBS, id), {
    views: increment(1),
  })
}

export async function incrementSkillViews(id) {
  await updateDoc(doc(db, SKILLS, id), {
    views: increment(1),
  })
}

function makeChatId(uid1, uid2, entityId, entityType) {
  return `${[uid1, uid2].sort().join('_')}_${entityType}_${entityId}`
}

export async function getOrCreateChat(
  entityId,
  entityTitle,
  entityType,
  senderUser,
  receiverUser
) {
  if (!senderUser?.uid || !receiverUser?.uid || senderUser.uid === receiverUser.uid) {
    throw new Error('You cannot start a conversation with yourself.')
  }

  const chatId = makeChatId(
    senderUser.uid,
    receiverUser.uid,
    entityId,
    entityType
  )

  const chatRef = doc(db, CHATS, chatId)

  await runTransaction(db, async transaction => {
    const existing = await transaction.get(chatRef)
    if (existing.exists()) return

    transaction.set(chatRef, {
      entityId,
      entityTitle,
      entityType,
      participants: [senderUser.uid, receiverUser.uid],
      participantNames: {
        [senderUser.uid]: 'Gigspot member',
        [receiverUser.uid]: receiverUser.displayName || 'User',
      },
      participantPhotos: {
        [senderUser.uid]: '',
        [receiverUser.uid]: '',
      },
      lastMessage: '',
      lastMessageId: null,
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    })
  })

  return chatId
}

export async function sendMessage(chatId, senderUid, text) {
  const cleanText = text.trim()

  if (!cleanText) {
    throw new Error('Message cannot be empty.')
  }

  await addDoc(collection(db, CHATS, chatId, 'messages'), {
    senderUid,
    text: cleanText,
    createdAt: serverTimestamp(),
  })
}

export function subscribeMessages(chatId, callback, onError) {
  const q = query(
    collection(db, CHATS, chatId, 'messages'),
    orderBy('createdAt', 'asc'),
    limitToLast(100)
  )

  return onSnapshot(
    q,
    snapshot => callback(mapDocs(snapshot)),
    error => {
      console.error('Message subscription failed:', error)
      onError?.('Unable to load messages. Please refresh and try again.')
    }
  )
}

export async function getMyChats(uid) {
  const q = query(
    collection(db, CHATS),
    where('participants', 'array-contains', uid),
    orderBy('lastMessageAt', 'desc'),
    limit(100)
  )

  return mapDocs(await getDocs(q))
}

export async function getChat(chatId) {
  const snapshot = await getDoc(doc(db, CHATS, chatId))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}
export async function getMarketplacePage(collectionName, cursor = null, pageSize = 20) {
  if (!['jobs', 'skills'].includes(collectionName)) {
    throw new Error('Unsupported marketplace listing type.')
  }

  const isSkills = collectionName === SKILLS || collectionName === 'skills'
  const reference = collection(db, isSkills ? SKILLS : JOBS)
  const safePageSize = Math.min(Math.max(Number(pageSize) || 20, 1), 50)
  const constraints = [
    where('privacySafe', '==', true),
    where('status', '==', isSkills ? SKILL_STATUS.PUBLISHED : JOB_STATUS.PUBLISHED),
    orderBy('createdAt', 'desc'),
  ]

  if (cursor) constraints.push(startAfter(cursor))
  constraints.push(limit(safePageSize))

  const snapshot = await getDocs(query(reference, ...constraints))

  return {
    items: mapDocs(snapshot),
    cursor: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null,
    hasMore: snapshot.size === safePageSize,
  }
}