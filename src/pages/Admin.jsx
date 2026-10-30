import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getAdminDashboard,
  getAdminListings,
  getAdminPayments,
  getAdminUsers,
  moderateListing,
  reviewService,
} from '../admin/adminService'

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'jobs', label: 'Jobs', icon: '📋' },
  { id: 'skills', label: 'Services', icon: '🙋' },
  { id: 'payments', label: 'Payments', icon: '💳' },
  { id: 'users', label: 'Users', icon: '👥' },
]

export default function Admin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [dashboard, setDashboard] = useState(null)
  const [jobs, setJobs] = useState([])
  const [skills, setSkills] = useState([])
  const [payments, setPayments] = useState([])
  const [users, setUsers] = useState([])
  const [nextCursors, setNextCursors] = useState({ jobs: null, skills: null, payments: null, users: null })

  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  const [jobStatus, setJobStatus] = useState('all')
  const [skillStatus, setSkillStatus] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdminAndLoad() {
      if (!user) {
        navigate('/signin?returnTo=%2F')
        return
      }

      setLoading(true)
      setError('')

      try {
        const tokenResult = await user.getIdTokenResult(true)
        const role = tokenResult.claims.role

        if (role !== 'admin') {
          setIsAdmin(false)
          setError(
            'Access denied. Your account does not have administrator permission.'
          )
          return
        }

        setIsAdmin(true)

        const data = await getAdminDashboard()
        setDashboard(data)
      } catch (err) {
        console.error('Admin dashboard error:', err)
        setError(
          err.message ||
            'Unable to load admin dashboard. Check your admin custom claim and Cloud Functions deployment.'
        )
      } finally {
        setLoading(false)
      }
    }

    checkAdminAndLoad()
  }, [user, navigate])

  useEffect(() => {
    if (!isAdmin) return

    if (activeTab === 'jobs') {
      loadJobs()
    }

    if (activeTab === 'skills') {
      loadSkills()
    }

    if (activeTab === 'payments') {
      loadPayments()
    }

    if (activeTab === 'users') {
      loadUsers()
    }
  }, [
    activeTab,
    isAdmin,
    jobStatus,
    skillStatus,
    paymentStatus,
  ])

  async function loadDashboard() {
    if (!isAdmin) return

    try {
      const data = await getAdminDashboard()
      setDashboard(data)
    } catch (err) {
      console.error('Dashboard refresh error:', err)
      setError('Unable to refresh dashboard data.')
    }
  }

  async function loadJobs(cursor = null, append = false) {
    setTabLoading(true)
    setError('')

    try {
      const data = await getAdminListings({
        collectionName: 'jobs',
        status: jobStatus,
        limitCount: 50,
        cursor,
      })

      setJobs(current => append ? [...current, ...(data.listings || [])] : (data.listings || []))
      setNextCursors(current => ({ ...current, jobs: data.nextCursor || null }))
    } catch (err) {
      console.error('Admin jobs load error:', err)
      setError('Unable to load jobs.')
    } finally {
      setTabLoading(false)
    }
  }

  async function loadSkills(cursor = null, append = false) {
    setTabLoading(true)
    setError('')

    try {
      const data = await getAdminListings({
        collectionName: 'skills',
        status: skillStatus,
        limitCount: 50,
        cursor,
      })

      setSkills(current => append ? [...current, ...(data.listings || [])] : (data.listings || []))
      setNextCursors(current => ({ ...current, skills: data.nextCursor || null }))
    } catch (err) {
      console.error('Admin skills load error:', err)
      setError('Unable to load skills.')
    } finally {
      setTabLoading(false)
    }
  }

  async function loadPayments(cursor = null, append = false) {
    setTabLoading(true)
    setError('')

    try {
      const data = await getAdminPayments({
        status: paymentStatus,
        limitCount: 50,
        cursor,
      })

      setPayments(current => append ? [...current, ...(data.payments || [])] : (data.payments || []))
      setNextCursors(current => ({ ...current, payments: data.nextCursor || null }))
    } catch (err) {
      console.error('Admin payments load error:', err)
      setError('Unable to load payments.')
    } finally {
      setTabLoading(false)
    }
  }

  async function loadUsers(cursor = null, append = false) {
    setTabLoading(true)
    setError('')

    try {
      const data = await getAdminUsers({
        limitCount: 50,
        cursor,
      })

      setUsers(current => append ? [...current, ...(data.users || [])] : (data.users || []))
      setNextCursors(current => ({ ...current, users: data.nextCursor || null }))
    } catch (err) {
      console.error('Admin users load error:', err)
      setError('Unable to load users.')
    } finally {
      setTabLoading(false)
    }
  }

  async function handleModeration(
    collectionName,
    listing,
    action
  ) {
    const label =
      collectionName === 'jobs' ? 'job' : 'skill profile'

    const actionLabel =
      action === 'suspend' ? 'suspend' : 'restore'

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} this ${label}?\n\n${listing.title}`
    )

    if (!confirmed) return

    const reason =
      action === 'suspend'
        ? window.prompt(
            'Optional moderation reason. Leave empty if not needed.'
          ) || ''
        : ''

    setActionLoading(`${collectionName}-${listing.id}`)
    setError('')

    try {
      await moderateListing({
        collectionName,
        listingId: listing.id,
        action,
        reason,
      })

      await loadDashboard()

      if (collectionName === 'jobs') {
        await loadJobs()
      } else {
        await loadSkills()
      }
    } catch (err) {
      console.error('Moderation error:', err)
      setError(
        err.message ||
          `Unable to ${actionLabel} this listing.`
      )
    } finally {
      setActionLoading('')
    }
  }

  async function handleReview(listing, decision) {
    const reason = decision === 'reject'
      ? window.prompt('Explain what the freelancer should change (up to 500 characters).')
      : ''

    if (decision === 'reject' && !reason?.trim()) return

    setActionLoading(`skills-${listing.id}`)
    setError('')
    try {
      await reviewService({ listingId: listing.id, decision, reason: reason.trim() })
      await loadDashboard()
      await loadSkills()
    } catch (reviewError) {
      console.error('Service review error:', reviewError)
      setError(reviewError.message || 'Unable to review this service.')
    } finally {
      setActionLoading('')
    }
  }

  const currentListings = useMemo(() => {
    return activeTab === 'jobs' ? jobs : skills
  }, [activeTab, jobs, skills])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--cream)' }}
      >
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: 'var(--forest)',
            borderTopColor: 'transparent',
          }}
        />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--cream)' }}
      >
        <div
          className="max-w-md w-full rounded-2xl p-8 text-center"
          style={{
            background: '#fff',
            border: '1px solid rgba(4,50,34,0.1)',
          }}
        >
          <p className="text-5xl">🔒</p>

          <h1
            className="font-black text-2xl mt-4"
            style={{
              fontFamily: '"Playfair Display", serif',
              color: 'var(--forest)',
            }}
          >
            Admin access required
          </h1>

          <p
            className="text-sm mt-3"
            style={{ color: 'var(--muted)' }}
          >
            {error ||
              'This page is available only to authorised Gigspot administrators.'}
          </p>

          <button
            onClick={async () => {
              try {
                await logout()
                navigate('/signin?returnTo=%2F', { replace: true })
              } catch {
                setError('Could not sign out. Please try again.')
              }
            }}
            className="btn-primary mt-6"
          >
            Switch account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ background: 'var(--cream)' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-7">
          <div>
            <p
              className="text-[10px] uppercase tracking-widest font-bold"
              style={{ color: 'var(--gold)' }}
            >
              Protected area
            </p>

            <h1
              className="font-black text-3xl mt-1"
              style={{
                fontFamily: '"Playfair Display", serif',
                color: 'var(--forest)',
              }}
            >
              Gigspot Internal Console
            </h1>

            <p
              className="text-sm mt-1"
              style={{ color: 'var(--muted)' }}
            >
              Review service submissions and moderate listings. Historical payment data is read-only.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="btn-outline"
          >
            ↻ Refresh Dashboard
          </button>
        </div>

        {error && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-4"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
            }}
          >
            <span>⚠️ {error}</span>

            <button
              onClick={() => setError('')}
              className="font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="text-xs px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all"
              style={{
                background:
                  activeTab === tab.id
                    ? 'var(--forest)'
                    : 'rgba(4,50,34,0.08)',
                color:
                  activeTab === tab.id
                    ? 'var(--cream)'
                    : 'var(--forest)',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <AdminOverview dashboard={dashboard} />
        )}

        {activeTab === 'jobs' && (
          <AdminListingsTab
            title="Job Moderation"
            collectionName="jobs"
            listings={currentListings}
            loading={tabLoading}
            status={jobStatus}
            setStatus={setJobStatus}
            actionLoading={actionLoading}
            onModerate={handleModeration}
            onReview={handleReview}
            nextCursor={nextCursors.jobs}
            onLoadMore={() => loadJobs(nextCursors.jobs, true)}
          />
        )}

        {activeTab === 'skills' && (
          <AdminListingsTab
            title="Service Review and Moderation"
            collectionName="skills"
            listings={currentListings}
            loading={tabLoading}
            status={skillStatus}
            setStatus={setSkillStatus}
            actionLoading={actionLoading}
            onModerate={handleModeration}
            onReview={handleReview}
            nextCursor={nextCursors.skills}
            onLoadMore={() => loadSkills(nextCursors.skills, true)}
          />
        )}

        {activeTab === 'payments' && (
          <AdminPaymentsTab
            payments={payments}
            loading={tabLoading}
            status={paymentStatus}
            setStatus={setPaymentStatus}
            nextCursor={nextCursors.payments}
            onLoadMore={() => loadPayments(nextCursors.payments, true)}
          />
        )}

        {activeTab === 'users' && (
          <AdminUsersTab
            users={users}
            loading={tabLoading}
            nextCursor={nextCursors.users}
            onLoadMore={() => loadUsers(nextCursors.users, true)}
          />
        )}
      </div>
    </div>
  )
}

function AdminOverview({ dashboard }) {
  const stats = [
    {
      icon: '📋',
      label: 'Total Jobs',
      value: dashboard?.jobs?.total || 0,
      background: '#eff6ff',
      color: '#1d4ed8',
    },
    {
      icon: '⏳',
      label: 'Services pending review',
      value: dashboard?.services?.pendingReview || 0,
      background: '#fff7ed',
      color: '#c2410c',
    },
    {
      icon: '✅',
      label: 'Published Jobs',
      value: dashboard?.jobs?.published || 0,
      background: '#ecfdf5',
      color: '#047857',
    },
    {
      icon: '🙋',
      label: 'Published services',
      value: dashboard?.services?.published || 0,
      background: '#f5f3ff',
      color: '#366a28',
    },
    {
      icon: '👥',
      label: 'Users',
      value: dashboard?.users?.total || 0,
      background: '#f0fdfa',
      color: '#0f766e',
    },
    {
      icon: '🚫',
      label: 'Suspended Listings',
      value: dashboard?.suspendedListings || 0,
      background: '#fef2f2',
      color: '#b91c1c',
    },
  ]

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <article
            key={stat.label}
            className="rounded-2xl p-5"
            style={{
              background: stat.background,
              border: `1px solid ${stat.color}22`,
            }}
          >
            <p className="text-2xl">{stat.icon}</p>

            <p
              className="font-black text-3xl mt-3"
              style={{
                fontFamily: '"Playfair Display", serif',
                color: stat.color,
              }}
            >
              {stat.value}
            </p>

            <p className="text-xs mt-1" style={{ color: '#5a4a30' }}>
              {stat.label}
            </p>
          </article>
        ))}
      </div>

      <div
        className="rounded-2xl p-6 mt-6"
        style={{
          background: '#fff',
          border: '1px solid rgba(4,50,34,0.08)',
        }}
      >
        <h2
          className="font-black text-xl"
          style={{
            fontFamily: '"Playfair Display", serif',
            color: 'var(--forest)',
          }}
        >
          Admin safety rules
        </h2>

        <div
          className="text-sm leading-relaxed mt-3 space-y-2"
          style={{ color: 'var(--muted)' }}
        >
          <p>
            • New hiring requests are free and published immediately; reported requests can be suspended.
          </p>

          <p>
            • Freelancer services are published only after an administrator approves them.
          </p>

          <p>
            • Admin actions require a server-assigned Firebase admin claim and are written to a private audit log.
          </p>

          <p>
            • All admin actions are checked by Firebase custom claims inside
            Cloud Functions.
          </p>
        </div>
      </div>
    </div>
  )
}

function AdminListingsTab({
  title,
  collectionName,
  listings,
  loading,
  status,
  setStatus,
  actionLoading,
  onModerate,
  onReview,
  nextCursor,
  onLoadMore,
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h2
            className="font-black text-2xl"
            style={{
              fontFamily: '"Playfair Display", serif',
              color: 'var(--forest)',
            }}
          >
            {title}
          </h2>

          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Review, suspend, or restore listings.
          </p>
        </div>

        <select
          className="input w-auto cursor-pointer"
          value={status}
          onChange={event => setStatus(event.target.value)}
        >
          <option value="all">All statuses</option>
          {collectionName === 'skills' && <option value="pending_review">Pending review</option>}
          {collectionName === 'skills' && <option value="rejected">Changes requested</option>}
          {collectionName === 'skills' && <option value="active">Legacy active (private)</option>}
          <option value="published">Published</option>
          {collectionName === 'jobs' && <option value="pending_payment">Legacy pending payment</option>}
          {collectionName === 'jobs' && <option value="closed">Closed</option>}
          {collectionName === 'skills' && <option value="paused">Paused</option>}
          <option value="suspended">Suspended</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {loading ? (
        <AdminLoadingCards />
      ) : listings.length === 0 ? (
        <AdminEmptyState text="No listings found for this filter." />
      ) : (
        <div className="space-y-3">
          {listings.map(listing => {
            const suspended = listing.status === 'suspended'
            const actionKey = `${collectionName}-${listing.id}`

            return (
              <article
                key={listing.id}
                className="rounded-2xl p-4"
                style={{
                  background: '#fff',
                  border: '1px solid rgba(4,50,34,0.08)',
                }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex gap-2 flex-wrap mb-2">
                      <AdminStatusBadge status={listing.status} />

                    </div>

                    <h3
                      className="font-bold text-base"
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        color: 'var(--forest)',
                      }}
                    >
                      {listing.title}
                    </h3>

                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--muted)' }}
                    >
                      {listing.category} · {listing.location} · ₹
                      {Number(listing.payMin).toLocaleString()}–₹
                      {Number(listing.payMax).toLocaleString()}
                    </p>

                    <p
                      className="text-xs mt-2 truncate"
                      style={{ color: 'var(--muted)' }}
                    >
                      Posted by: {listing.postedBy?.name || 'Unknown'} ·{' '}
                      {listing.postedBy?.uid || ''}
                    </p>

                    {listing.moderationReason && (
                      <p
                        className="text-xs mt-2"
                        style={{ color: '#b91c1c' }}
                      >
                        Moderation reason: {listing.moderationReason}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {collectionName === 'skills' && ['pending_review', 'rejected', 'active'].includes(listing.status) && (
                      <>
                        <button
                          onClick={() => onReview(listing, 'approve')}
                          disabled={actionLoading === actionKey}
                          className="text-xs px-3 py-2 rounded-lg font-medium disabled:opacity-50"
                          style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                        >Approve</button>
                        <button
                          onClick={() => onReview(listing, 'reject')}
                          disabled={actionLoading === actionKey}
                          className="text-xs px-3 py-2 rounded-lg font-medium disabled:opacity-50"
                          style={{ background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' }}
                        >Request changes</button>
                      </>
                    )}
                    <button
                      onClick={() =>
                        onModerate(
                          collectionName,
                          listing,
                          suspended ? 'restore' : 'suspend'
                        )
                      }
                      disabled={actionLoading === actionKey}
                      className="text-xs px-3 py-2 rounded-lg font-medium disabled:opacity-50"
                      style={{
                        background: suspended
                          ? '#ecfdf5'
                          : '#fef2f2',
                        color: suspended
                          ? '#047857'
                          : '#b91c1c',
                        border: suspended
                          ? '1px solid #a7f3d0'
                          : '1px solid #fecaca',
                      }}
                    >
                      {actionLoading === actionKey
                        ? 'Working...'
                        : suspended
                          ? 'Restore'
                          : 'Suspend'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {!loading && nextCursor && (
        <button
          type="button"
          className="btn-outline mt-4"
          onClick={onLoadMore}
        >
          Load next 50
        </button>
      )}
    </section>
  )
}

function AdminPaymentsTab({
  payments,
  loading,
  status,
  setStatus,
  nextCursor,
  onLoadMore,
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h2
            className="font-black text-2xl"
            style={{
              fontFamily: '"Playfair Display", serif',
              color: 'var(--forest)',
            }}
          >
            Legacy Payment Records
          </h2>

          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Historical payment records are read-only. The public Gigspot app does not offer checkout or paid verification.
          </p>
        </div>

        <select
          className="input w-auto cursor-pointer"
          value={status}
          onChange={event => setStatus(event.target.value)}
        >
          <option value="all">All payment statuses</option>
          <option value="created">Created</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? (
        <AdminLoadingCards />
      ) : payments.length === 0 ? (
        <AdminEmptyState text="No payment records found." />
      ) : (
        <div className="space-y-3">
          {payments.map(payment => (
            <article
              key={payment.id}
              className="rounded-2xl p-4"
              style={{
                background: '#fff',
                border: '1px solid rgba(4,50,34,0.08)',
              }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex gap-2 flex-wrap mb-2">
                    <AdminStatusBadge status={payment.status} />

                    <span
                      className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide"
                      style={{
                        background: 'rgba(4,50,34,0.07)',
                        color: 'var(--forest)',
                      }}
                    >
                      {payment.purpose}
                    </span>
                  </div>

                  <p
                    className="font-bold text-sm"
                    style={{ color: 'var(--forest)' }}
                  >
                    ₹{Number(payment.amount || 0) / 100} {payment.currency}
                  </p>

                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--muted)' }}
                  >
                    User: {payment.userId}
                  </p>

                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--muted)' }}
                  >
                    Order: {payment.razorpayOrderId}
                  </p>

                  {payment.razorpayPaymentId && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--muted)' }}
                    >
                      Payment: {payment.razorpayPaymentId}
                    </p>
                  )}
                </div>

                <p
                  className="text-xs"
                  style={{ color: 'var(--muted)' }}
                >
                  {formatDate(payment.createdAt)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && nextCursor && (
        <button type="button" className="btn-outline mt-4" onClick={onLoadMore}>
          Load next 50
        </button>
      )}
    </section>
  )
}

function AdminUsersTab({
  users,
  loading,
  nextCursor,
  onLoadMore,
}) {
  return (
    <section>
      <div className="mb-5">
        <h2
          className="font-black text-2xl"
          style={{
            fontFamily: '"Playfair Display", serif',
            color: 'var(--forest)',
          }}
        >
          Users
        </h2>

        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Latest registered GigNest accounts.
        </p>
      </div>

      {loading ? (
        <AdminLoadingCards />
      ) : users.length === 0 ? (
        <AdminEmptyState text="No user records found." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {users.map(user => (
            <article
              key={user.uid}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{
                background: '#fff',
                border: '1px solid rgba(4,50,34,0.08)',
              }}
            >
              {user.photo ? (
                <img
                  src={user.photo}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                  style={{
                    background: 'var(--forest)',
                    color: 'var(--cream)',
                  }}
                >
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}

              <div className="min-w-0">
                <p
                  className="text-sm font-bold truncate"
                  style={{ color: 'var(--forest)' }}
                >
                  {user.name || 'Gigspot member'}
                </p>

                <p
                  className="text-xs truncate"
                  style={{ color: 'var(--muted)' }}
                >
                  {user.email || 'No email'}
                </p>

                <p
                  className="text-[10px] mt-1"
                  style={{ color: 'var(--muted)' }}
                >
                  Joined {formatDate(user.createdAt)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && nextCursor && (
        <button type="button" className="btn-outline mt-4" onClick={onLoadMore}>
          Load next 50
        </button>
      )}
    </section>
  )
}

function AdminStatusBadge({ status }) {
  const map = {
    pending_payment: {
      label: 'Pending payment',
      background: '#fff7ed',
      color: '#c2410c',
    },
    published: {
      label: 'Published',
      background: '#ecfdf5',
      color: '#047857',
    },
    pending_review: {
      label: 'Pending review',
      background: '#fff7ed',
      color: '#c2410c',
    },
    rejected: {
      label: 'Changes requested',
      background: '#fff7ed',
      color: '#9a3412',
    },
    paused: {
      label: 'Paused',
      background: '#ecfdf5',
      color: '#385a3b',
    },
    suspended: {
      label: 'Suspended',
      background: '#fef2f2',
      color: '#b91c1c',
    },
    deleted: {
      label: 'Deleted',
      background: '#f3f4f6',
      color: '#4b5563',
    },
    created: {
      label: 'Created',
      background: '#eff6ff',
      color: '#1d4ed8',
    },
    paid: {
      label: 'Paid',
      background: '#ecfdf5',
      color: '#047857',
    },
    failed: {
      label: 'Failed',
      background: '#fef2f2',
      color: '#b91c1c',
    },
  }

  const item = map[status] || {
    label: status || 'Unknown',
    background: '#f3f4f6',
    color: '#4b5563',
  }

  return (
    <span
      className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide"
      style={{
        background: item.background,
        color: item.color,
      }}
    >
      {item.label}
    </span>
  )
}

function AdminLoadingCards() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(item => (
        <div
          key={item}
          className="h-28 rounded-2xl animate-pulse"
          style={{ background: '#fff' }}
        />
      ))}
    </div>
  )
}

function AdminEmptyState({ text }) {
  return (
    <div
      className="rounded-2xl px-5 py-10 text-center text-sm"
      style={{
        background: '#fff',
        border: '1px solid rgba(4,50,34,0.08)',
        color: 'var(--muted)',
      }}
    >
      {text}
    </div>
  )
}

function formatDate(timestamp) {
  const date = typeof timestamp?.toDate === 'function'
    ? timestamp.toDate()
    : typeof timestamp === 'string' || typeof timestamp === 'number'
      ? new Date(timestamp)
      : null

  if (!date || Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}