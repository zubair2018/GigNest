import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyChats } from '../firebase/db'

function timeAgo(timestamp) {
  if (!timestamp?.toDate) return ''

  const hours = Math.floor(
    (Date.now() - timestamp.toDate().getTime()) / 3600000
  )

  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`

  return `${Math.floor(hours / 24)}d ago`
}

export default function Messages() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadChats() {
      if (!user) return

      setLoading(true)
      setError('')

      try {
        const result = await getMyChats(user.uid)
        if (active) setChats(result)
      } catch (error) {
        console.error('Chats load error:', error)
        if (active) setError('Unable to load conversations.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadChats()
    return () => { active = false }
  }, [user])

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{ background: 'var(--cream)' }}
    >
      <div className="max-w-2xl mx-auto">
        <h1
          className="font-black text-3xl"
          style={{
            fontFamily: '"Playfair Display", serif',
            color: 'var(--forest)',
          }}
        >
          Messages
        </h1>

        <p className="text-sm mt-1 mb-7" style={{ color: 'var(--muted)' }}>
          {chats.length} conversation{chats.length !== 1 ? 's' : ''}
        </p>

        {error && (
          <div
            className="mb-5 rounded-xl px-4 py-3 text-sm"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Loading conversations...
          </p>
        ) : chats.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl">💬</p>

            <h2
              className="font-black text-xl mt-4"
              style={{
                fontFamily: '"Playfair Display", serif',
                color: 'var(--forest)',
              }}
            >
              No messages yet
            </h2>

            <p
              className="text-sm mt-2 mb-6"
              style={{ color: 'var(--muted)' }}
            >
              When you message someone about a job or skill, the conversation
              will appear here.
            </p>

            <button onClick={() => navigate('/')} className="btn-primary">
              Browse Gigs →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map(chat => {
              const otherUid = chat.participants?.find(
                uid => uid !== user.uid
              )

              const otherName =
                chat.participantNames?.[otherUid] || 'Gigspot member'

              const otherPhoto =
                chat.participantPhotos?.[otherUid] || ''

              return (
                <button
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl text-left hover:-translate-y-0.5 hover:shadow-sm transition-all"
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(4,50,34,0.08)',
                  }}
                >
                  {otherPhoto ? (
                    <img
                      src={otherPhoto}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold"
                      style={{
                        background: 'var(--forest)',
                        color: 'var(--cream)',
                      }}
                    >
                      {otherName[0]?.toUpperCase() || '?'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className="font-medium text-sm truncate"
                        style={{ color: 'var(--forest)' }}
                      >
                        {otherName}
                      </p>

                      <p
                        className="text-[10px] whitespace-nowrap"
                        style={{ color: 'var(--muted)' }}
                      >
                        {timeAgo(chat.lastMessageAt)}
                      </p>
                    </div>

                    <p
                      className="text-xs truncate mt-1"
                      style={{ color: 'var(--muted)' }}
                    >
                      {chat.lastMessage || `re: ${chat.entityTitle}`}
                    </p>
                  </div>

                  <span style={{ color: 'var(--muted)' }}>›</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}