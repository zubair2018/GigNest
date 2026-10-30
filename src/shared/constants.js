export const CATEGORIES = [
  'Tech',
  'Design',
  'Local',
  'Content',
  'Education',
]

export const PAY_TYPES = [
  '/project',
  '/month',
  '/day',
  '/hour',
  '/job',
]

export const JOB_STATUS = {
  PUBLISHED: 'published',
  PAUSED: 'paused',
  CLOSED: 'closed',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
  // Retained only to display legacy records; new listings are free.
  PENDING_PAYMENT: 'pending_payment',
}

export const SKILL_STATUS = {
  PENDING_REVIEW: 'pending_review',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  PAUSED: 'paused',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
  // Retained only to identify legacy records; new services use moderation.
  ACTIVE: 'active',
}

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
}
