const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { defineSecret } = require('firebase-functions/params')
const { logger } = require('firebase-functions')
const admin = require('firebase-admin')
const Razorpay = require('razorpay')
const crypto = require('crypto')

admin.initializeApp()

const db = admin.firestore()
const REGION = 'asia-south1'

exports.updateChatSummary = onDocumentCreated(
  {
    document: 'chats/{chatId}/messages/{messageId}',
    region: REGION,
  },
  async event => {
    const message = event.data?.data()
    if (!message?.senderUid || typeof message.text !== 'string') return

    const chatRef = db.collection('chats').doc(event.params.chatId)

    await db.runTransaction(async transaction => {
      const chatSnapshot = await transaction.get(chatRef)
      if (!chatSnapshot.exists) return

      const chat = chatSnapshot.data()
      if (!chat.participants?.includes(message.senderUid)) return

      const currentTime = chat.lastMessageAt?.toMillis?.() || 0
      const messageTime = message.createdAt?.toMillis?.() || 0
      if (
        currentTime > messageTime ||
        (currentTime === messageTime && chat.lastMessageId >= event.params.messageId)
      ) return

      transaction.update(chatRef, {
        lastMessage: message.text.slice(0, 2000),
        lastMessageId: event.params.messageId,
        lastMessageAt: message.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      })
    })
  }
)

const RAZORPAY_KEY_ID = defineSecret('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET')
const RAZORPAY_WEBHOOK_SECRET = defineSecret('RAZORPAY_WEBHOOK_SECRET')

const PLANS = {
  job_publish: {
    purpose: 'job_publish',
    amount: 9900,
    currency: 'INR',
    label: 'Job publication',
  },

  skill_weekly: {
    purpose: 'skill_verification',
    amount: 9900,
    currency: 'INR',
    label: 'Weekly verification',
    days: 7,
  },

  skill_monthly: {
    purpose: 'skill_verification',
    amount: 29900,
    currency: 'INR',
    label: 'Monthly verification',
    days: 30,
  },

  skill_yearly: {
    purpose: 'skill_verification',
    amount: 199900,
    currency: 'INR',
    label: 'Yearly verification',
    days: 365,
  },
}

function requireAuthenticatedUser(request) {
  if (!request.auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'You must sign in before making this request.'
    )
  }

  return request.auth.uid
}

function requireAdmin(request) {
  requireAuthenticatedUser(request)

  if (request.auth.token.role !== 'admin') {
    throw new HttpsError(
      'permission-denied',
      'Administrator permission is required.'
    )
  }
}

function getPlan(planId, purpose) {
  const plan = PLANS[planId]

  if (!plan || plan.purpose !== purpose) {
    throw new HttpsError(
      'invalid-argument',
      'Invalid payment plan.'
    )
  }

  return plan
}

function getCollectionName(purpose) {
  return purpose === 'job_publish' ? 'jobs' : 'skills'
}

function serializeSnapshot(snapshot) {
  return snapshot.docs.map(document => serializeAdminValue({
    id: document.id,
    ...document.data(),
  }))
}

function serializeAdminValue(value) {
  if (value?.toDate && typeof value.toDate === 'function') {
    return value.toDate().toISOString()
  }

  if (Array.isArray(value)) {
    return value.map(serializeAdminValue)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeAdminValue(item)])
    )
  }

  return value
}

function safePageSize(value) {
  return Math.min(Math.max(Number(value) || 50, 1), 50)
}

function applyAdminCursor(queryRef, cursor) {
  if (!cursor) return queryRef

  if (
    typeof cursor.id !== 'string' ||
    typeof cursor.createdAt !== 'string' ||
    Number.isNaN(Date.parse(cursor.createdAt))
  ) {
    throw new HttpsError('invalid-argument', 'Invalid page cursor.')
  }

  return queryRef.startAfter(
    admin.firestore.Timestamp.fromDate(new Date(cursor.createdAt)),
    cursor.id
  )
}

function getNextAdminCursor(snapshot, pageSize) {
  const lastDocument = snapshot.docs[snapshot.docs.length - 1]
  const createdAt = lastDocument?.data()?.createdAt

  if (snapshot.size !== pageSize || !createdAt?.toDate) return null

  return {
    createdAt: createdAt.toDate().toISOString(),
    id: lastDocument.id,
  }
}

async function countCollection(collectionName) {
  const snapshot = await db.collection(collectionName).count().get()
  return snapshot.data().count
}

async function countWhere(collectionName, field, operator, value) {
  const snapshot = await db
    .collection(collectionName)
    .where(field, operator, value)
    .count()
    .get()

  return snapshot.data().count
}

// ── RAZORPAY ORDER CREATION ─────────────────────────────────

exports.createRazorpayOrder = onCall(
  {
    region: REGION,
    secrets: [
      RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET,
    ],
  },
  async request => {
    const uid = requireAuthenticatedUser(request)

    const {
      purpose,
      entityId,
      planId,
    } = request.data || {}

    if (!purpose || !entityId || !planId) {
      throw new HttpsError(
        'invalid-argument',
        'purpose, entityId, and planId are required.'
      )
    }

    if (
      purpose !== 'job_publish' &&
      purpose !== 'skill_verification'
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Unsupported payment purpose.'
      )
    }

    const plan = getPlan(planId, purpose)
    const collectionName = getCollectionName(purpose)

    const entityRef = db.collection(collectionName).doc(entityId)
    const entitySnapshot = await entityRef.get()

    if (!entitySnapshot.exists) {
      throw new HttpsError(
        'not-found',
        'Listing was not found.'
      )
    }

    const entity = entitySnapshot.data()

    if (entity.postedBy?.uid !== uid) {
      throw new HttpsError(
        'permission-denied',
        'You can only pay for your own listing.'
      )
    }

    if (
      purpose === 'job_publish' &&
      entity.status !== 'pending_payment'
    ) {
      throw new HttpsError(
        'failed-precondition',
        'This job is not eligible for publication payment.'
      )
    }

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID.value(),
      key_secret: RAZORPAY_KEY_SECRET.value(),
    })

    const receipt = `gignest_${entityId}_${Date.now()}`.slice(0, 40)

    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: plan.currency,
      receipt,
      notes: {
        userId: uid,
        entityId,
        collectionName,
        purpose,
        planId,
      },
    })

    await db.collection('payments').doc(order.id).set({
      razorpayOrderId: order.id,
      entityId,
      collectionName,
      purpose,
      planId,
      amount: plan.amount,
      currency: plan.currency,
      userId: uid,
      status: 'created',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    await entityRef.update({
      paymentOrderId: order.id,
      paymentStatus: 'created',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return {
      keyId: RAZORPAY_KEY_ID.value(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      purpose,
      entityId,
      planId,
    }
  }
)

// ── RAZORPAY PAYMENT PROCESSING ─────────────────────────────

async function applySuccessfulPayment({
  razorpayOrderId,
  razorpayPaymentId,
  source,
}) {
  const paymentRef = db.collection('payments').doc(razorpayOrderId)
  const paymentSnapshot = await paymentRef.get()

  if (!paymentSnapshot.exists) {
    throw new HttpsError(
      'not-found',
      'Payment record was not found.'
    )
  }

  const payment = paymentSnapshot.data()

  if (payment.status === 'paid') {
    return {
      alreadyProcessed: true,
      entityId: payment.entityId,
      purpose: payment.purpose,
    }
  }

  const entityRef = db
    .collection(payment.collectionName)
    .doc(payment.entityId)

  const now = admin.firestore.Timestamp.now()

  if (payment.purpose === 'job_publish') {
    await entityRef.update({
      status: 'published',
      paymentStatus: 'paid',
      paymentId: razorpayPaymentId,
      paymentOrderId: razorpayOrderId,
      publishedAt: now,
      updatedAt: now,
    })
  }

  if (payment.purpose === 'skill_verification') {
    const plan = getPlan(
      payment.planId,
      'skill_verification'
    )

    const skillSnapshot = await entityRef.get()

    if (!skillSnapshot.exists) {
      throw new HttpsError(
        'not-found',
        'Skill profile was not found.'
      )
    }

    const skill = skillSnapshot.data()
    const oldVerifiedUntil = skill.verifiedUntil?.toDate?.()

    const baseDate =
      oldVerifiedUntil && oldVerifiedUntil > new Date()
        ? oldVerifiedUntil
        : new Date()

    const verifiedUntil = new Date(baseDate)
    verifiedUntil.setDate(verifiedUntil.getDate() + plan.days)

    await entityRef.update({
      isVerified: true,
      verifiedUntil: admin.firestore.Timestamp.fromDate(verifiedUntil),
      verificationPlan: payment.planId,
      verificationPaymentId: razorpayPaymentId,
      updatedAt: now,
    })
  }

  await paymentRef.update({
    status: 'paid',
    razorpayPaymentId,
    source,
    paidAt: now,
    updatedAt: now,
  })

  return {
    alreadyProcessed: false,
    entityId: payment.entityId,
    purpose: payment.purpose,
  }
}

exports.verifyRazorpayPayment = onCall(
  {
    region: REGION,
    secrets: [RAZORPAY_KEY_SECRET],
  },
  async request => {
    const uid = requireAuthenticatedUser(request)

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = request.data || {}

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Missing Razorpay payment verification data.'
      )
    }

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET.value())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      throw new HttpsError(
        'permission-denied',
        'Payment signature validation failed.'
      )
    }

    const paymentSnapshot = await db
      .collection('payments')
      .doc(razorpay_order_id)
      .get()

    if (!paymentSnapshot.exists) {
      throw new HttpsError(
        'not-found',
        'Payment record was not found.'
      )
    }

    if (paymentSnapshot.data().userId !== uid) {
      throw new HttpsError(
        'permission-denied',
        'This payment does not belong to the signed-in user.'
      )
    }

    return applySuccessfulPayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      source: 'checkout_callback',
    })
  }
)

// ── RAZORPAY WEBHOOK ────────────────────────────────────────

exports.razorpayWebhook = onRequest(
  {
    region: REGION,
    secrets: [RAZORPAY_WEBHOOK_SECRET],
  },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed')
      return
    }

    try {
      const signature =
        request.header('x-razorpay-signature') || ''

      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET.value())
        .update(request.rawBody)
        .digest('hex')

      if (signature !== expectedSignature) {
        logger.warn('Razorpay webhook signature did not match')
        response.status(400).send('Invalid signature')
        return
      }

      const event = request.body?.event

      if (
        event !== 'payment.captured' &&
        event !== 'order.paid'
      ) {
        response.status(200).send('Ignored event')
        return
      }

      const paymentEntity = request.body?.payload?.payment?.entity
      const orderEntity = request.body?.payload?.order?.entity

      const razorpayOrderId =
        paymentEntity?.order_id || orderEntity?.id

      const razorpayPaymentId = paymentEntity?.id

      if (!razorpayOrderId || !razorpayPaymentId) {
        response.status(200).send('No payment information')
        return
      }

      await applySuccessfulPayment({
        razorpayOrderId,
        razorpayPaymentId,
        source: 'razorpay_webhook',
      })

      response.status(200).send('OK')
    } catch (error) {
      logger.error(
        'Razorpay webhook processing error:',
        error
      )

      response.status(500).send('Webhook processing failed')
    }
  }
)

// ── ADMIN FUNCTIONS ─────────────────────────────────────────

exports.getAdminDashboard = onCall(
  {
    region: REGION,
  },
  async request => {
    requireAdmin(request)

    const [
      totalJobs,
      publishedJobs,
      pendingServices,
      publishedServices,
      rejectedServices,
      totalUsers,
      suspendedJobs,
      suspendedServices,
    ] = await Promise.all([
      countCollection('jobs'),
      countWhere('jobs', 'status', '==', 'published'),
      countWhere('skills', 'status', '==', 'pending_review'),
      countWhere('skills', 'status', '==', 'published'),
      countWhere('skills', 'status', '==', 'rejected'),
      countCollection('users'),
      countWhere('jobs', 'status', '==', 'suspended'),
      countWhere('skills', 'status', '==', 'suspended'),
    ])

    return {
      jobs: {
        total: totalJobs,
        published: publishedJobs,
      },
      services: {
        pendingReview: pendingServices,
        published: publishedServices,
        rejected: rejectedServices,
      },
      users: {
        total: totalUsers,
      },
      suspendedListings: suspendedJobs + suspendedServices,
    }
  }
)

exports.getAdminListings = onCall(
  {
    region: REGION,
  },
  async request => {
    requireAdmin(request)

    const {
      collectionName,
      status = 'all',
      limitCount = 50,
      cursor = null,
    } = request.data || {}

    if (
      collectionName !== 'jobs' &&
      collectionName !== 'skills'
    ) {
      throw new HttpsError(
        'invalid-argument',
        'collectionName must be jobs or skills.'
      )
    }

    const safeLimit = safePageSize(limitCount)

    const allowedStatuses = collectionName === 'jobs'
      ? ['pending_payment', 'published', 'paused', 'closed', 'suspended', 'deleted']
      : ['pending_review', 'published', 'rejected', 'paused', 'suspended', 'deleted', 'active']

    if (status !== 'all' && !allowedStatuses.includes(status)) {
      throw new HttpsError('invalid-argument', 'Unsupported listing status.')
    }

    let queryRef = db
      .collection(collectionName)
      .orderBy('createdAt', 'desc')
      .orderBy(admin.firestore.FieldPath.documentId(), 'desc')

    if (status !== 'all') {
      queryRef = db
        .collection(collectionName)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .orderBy(admin.firestore.FieldPath.documentId(), 'desc')
    }

    queryRef = applyAdminCursor(queryRef, cursor)
    queryRef = queryRef.limit(safeLimit)

    const snapshot = await queryRef.get()

    return {
      listings: serializeSnapshot(snapshot),
      nextCursor: getNextAdminCursor(snapshot, safeLimit),
    }
  }
)

exports.getAdminPayments = onCall(
  {
    region: REGION,
  },
  async request => {
    requireAdmin(request)

    const {
      status = 'all',
      limitCount = 50,
      cursor = null,
    } = request.data || {}

    const safeLimit = safePageSize(limitCount)

    if (!['all', 'created', 'paid', 'failed'].includes(status)) {
      throw new HttpsError('invalid-argument', 'Unsupported payment status.')
    }

    let queryRef = db
      .collection('payments')
      .orderBy('createdAt', 'desc')
      .orderBy(admin.firestore.FieldPath.documentId(), 'desc')

    if (status !== 'all') {
      queryRef = db
        .collection('payments')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .orderBy(admin.firestore.FieldPath.documentId(), 'desc')
    }

    queryRef = applyAdminCursor(queryRef, cursor).limit(safeLimit)
    const snapshot = await queryRef.get()

    return {
      payments: serializeSnapshot(snapshot),
      nextCursor: getNextAdminCursor(snapshot, safeLimit),
    }
  }
)

exports.getAdminUsers = onCall(
  {
    region: REGION,
  },
  async request => {
    requireAdmin(request)

    const {
      limitCount = 50,
      cursor = null,
    } = request.data || {}

    const safeLimit = safePageSize(limitCount)

    let queryRef = db
      .collection('users')
      .orderBy('createdAt', 'desc')
      .orderBy(admin.firestore.FieldPath.documentId(), 'desc')

    queryRef = applyAdminCursor(queryRef, cursor).limit(safeLimit)
    const snapshot = await queryRef.get()

    return {
      users: serializeSnapshot(snapshot),
      nextCursor: getNextAdminCursor(snapshot, safeLimit),
    }
  }
)

exports.reviewService = onCall(
  {
    region: REGION,
  },
  async request => {
    requireAdmin(request)

    const { listingId, decision, reason = '' } = request.data || {}
    const cleanReason = typeof reason === 'string' ? reason.trim() : ''

    if (typeof listingId !== 'string' || !listingId || listingId.length > 150) {
      throw new HttpsError('invalid-argument', 'A valid service ID is required.')
    }

    if (!['approve', 'reject'].includes(decision)) {
      throw new HttpsError('invalid-argument', 'Decision must be approve or reject.')
    }

    if (decision === 'reject' && (!cleanReason || cleanReason.length > 500)) {
      throw new HttpsError('invalid-argument', 'A rejection reason of 1 to 500 characters is required.')
    }

    const serviceRef = db.collection('skills').doc(listingId)
    const auditRef = db.collection('adminAudit').doc()
    const adminUid = request.auth.uid

    return db.runTransaction(async transaction => {
      const snapshot = await transaction.get(serviceRef)
      if (!snapshot.exists) {
        throw new HttpsError('not-found', 'Service was not found.')
      }

      const service = snapshot.data()
      if (service.postedBy?.uid === adminUid) {
        throw new HttpsError('permission-denied', 'Administrators cannot review their own service.')
      }

      if (Object.prototype.hasOwnProperty.call(service, 'phone')) {
        throw new HttpsError('failed-precondition', 'This service still contains a legacy public contact field. The owner must edit it before review.')
      }

      if (!['pending_review', 'rejected', 'active'].includes(service.status)) {
        throw new HttpsError('failed-precondition', 'This service is not eligible for review.')
      }

      const status = decision === 'approve' ? 'published' : 'rejected'
      const now = admin.firestore.FieldValue.serverTimestamp()

      transaction.update(serviceRef, {
        status,
        privacySafe: true,
        rejectionReason: decision === 'reject' ? cleanReason : '',
        moderatedBy: adminUid,
        moderatedAt: now,
        updatedAt: now,
      })

      transaction.set(auditRef, {
        action: decision === 'approve' ? 'service_approved' : 'service_rejected',
        collectionName: 'skills',
        listingId,
        actorUid: adminUid,
        reason: decision === 'reject' ? cleanReason : '',
        previousStatus: service.status,
        newStatus: status,
        createdAt: now,
      })

      return { listingId, status }
    })
  }
)

exports.moderateListing = onCall(
  {
    region: REGION,
  },
  async request => {
    requireAdmin(request)

    const {
      collectionName,
      listingId,
      action,
      reason = '',
    } = request.data || {}

    if (
      collectionName !== 'jobs' &&
      collectionName !== 'skills'
    ) {
      throw new HttpsError(
        'invalid-argument',
        'collectionName must be jobs or skills.'
      )
    }

    if (!listingId) {
      throw new HttpsError(
        'invalid-argument',
        'listingId is required.'
      )
    }

    if (
      action !== 'suspend' &&
      action !== 'restore'
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Action must be suspend or restore.'
      )
    }

    const listingRef = db.collection(collectionName).doc(listingId)
    const auditRef = db.collection('adminAudit').doc()
    const adminUid = request.auth.uid
    const cleanReason = typeof reason === 'string' ? reason.trim().slice(0, 500) : ''

    return db.runTransaction(async transaction => {
      const snapshot = await transaction.get(listingRef)
      if (!snapshot.exists) {
        throw new HttpsError('not-found', 'Listing was not found.')
      }

      const listing = snapshot.data()
      const now = admin.firestore.FieldValue.serverTimestamp()

      if (action === 'suspend') {
        if (listing.status === 'suspended' || listing.status === 'deleted') {
          throw new HttpsError('failed-precondition', 'This listing cannot be suspended from its current status.')
        }

        transaction.update(listingRef, {
          status: 'suspended',
          statusBeforeSuspension: listing.status,
          moderationReason: cleanReason,
          moderatedBy: adminUid,
          moderatedAt: now,
          updatedAt: now,
        })
        transaction.set(auditRef, {
          action: 'listing_suspended',
          collectionName,
          listingId,
          actorUid: adminUid,
          reason: cleanReason,
          previousStatus: listing.status,
          newStatus: 'suspended',
          createdAt: now,
        })
        return { success: true, action: 'suspended' }
      }

      if (listing.status !== 'suspended' || !listing.statusBeforeSuspension) {
        throw new HttpsError('failed-precondition', 'This suspended listing has no safe restore status.')
      }

      let restoreStatus = listing.statusBeforeSuspension
      if (collectionName === 'skills' && restoreStatus === 'active') {
        restoreStatus = 'pending_review'
      }

      const allowedStatuses = collectionName === 'jobs'
        ? ['published', 'paused', 'closed', 'pending_payment']
        : ['published', 'paused', 'pending_review', 'rejected']

      if (!allowedStatuses.includes(restoreStatus)) {
        throw new HttpsError('failed-precondition', 'The previous listing status cannot be restored safely.')
      }

      transaction.update(listingRef, {
        status: restoreStatus,
        statusBeforeSuspension: admin.firestore.FieldValue.delete(),
        moderationReason: admin.firestore.FieldValue.delete(),
        moderatedBy: adminUid,
        moderatedAt: now,
        updatedAt: now,
      })
      transaction.set(auditRef, {
        action: 'listing_restored',
        collectionName,
        listingId,
        actorUid: adminUid,
        reason: '',
        previousStatus: 'suspended',
        newStatus: restoreStatus,
        createdAt: now,
      })

      return { success: true, action: 'restored', status: restoreStatus }
    })
  }
)