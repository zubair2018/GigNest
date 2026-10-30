import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getChat,
  sendMessage,
  subscribeMessages,
} from '../firebase/db'

function formatTime(timestamp) {
  if (!timestamp?.toDate) return ''

  return timestamp.toDate().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Chat() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const bottomRef = useRef(null)

  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    let active = true

    async function loadChatInfo() {
      try {
        const currentChat = await getChat(chatId)
        if (!active) return

        if (!currentChat) {
          setError('Chat not found or you do not have access to it.')
          return
        }

        setChat(currentChat)
      } catch (error) {
        console.error('Chat info load error:', error)
        if (active) setError('Unable to load chat information.')
      }
    }

    loadChatInfo()

    const unsubscribe = subscribeMessages(
      chatId,
      messages => { if (active) setMessages(messages) },
      messageError => { if (active) setError(messageError) }
    )

    return () => {
      active = false
      unsubscribe()
    }
  }, [chatId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages])

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  const otherUid = chat?.participants?.find(uid => uid !== user.uid)
  const otherName =
    chat?.participantNames?.[otherUid] || 'Gigspot member'

  const otherPhoto =
    chat?.participantPhotos?.[otherUid] || ''

  async function handleSend(event) {
    event.preventDefault()

    if (!text.trim() || sending) return

    setSending(true)
    setError('')

    try {
      await sendMessage(chatId, user.uid, text)
      setText('')
    } catch (error) {
      console.error('Message send error:', error)
      setError('Unable to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="flex flex-col h-[calc(100vh-60px)]"
      style={{ background: 'var(--cream)' }}
    >
      <header
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: 'var(--forest)' }}
      >
        <button
          onClick={() => navigate('/messages')}
          className="text-lg"
          style={{ color: 'rgba(246,233,208,0.75)' }}
        >
          ←
        </button>

        {otherPhoto ? (
          <img
            src={otherPhoto}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
            style={{
              background: 'var(--gold)',
              color: 'var(--forest)',
            }}
          >
            {otherName[0]?.toUpperCase() || '?'}
          </div>
        )}

        <div className="min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: 'var(--cream)' }}
          >
            {otherName}
          </p>

          {chat?.entityTitle && (
            <p
              className="text-[10px] truncate"
              style={{ color: 'rgba(246,233,208,0.5)' }}
            >
              re: {chat.entityTitle}
            </p>
          )}
        </div>
      </header>

      {error && (
        <div
          className="px-4 py-2 text-xs"
          style={{
            background: '#fef2f2',
            color: '#dc2626',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl">💬</p>

            <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
              Say hi to start the conversation.
            </p>
          </div>
        )}

        {messages.map(message => {
          const mine = message.senderUid === user.uid

          return (
            <div
              key={message.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[75%]">
                <div
                  className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: mine ? 'var(--forest)' : '#fff',
                    color: mine ? 'var(--cream)' : 'var(--text)',
                    border: mine
                      ? 'none'
                      : '1px solid rgba(4,50,34,0.1)',
                    borderBottomRightRadius: mine ? 4 : 16,
                    borderBottomLeftRadius: mine ? 16 : 4,
                  }}
                >
                  {message.text}
                </div>

                <p
                  className={`text-[10px] mt-1 px-1 ${
                    mine ? 'text-right' : 'text-left'
                  }`}
                  style={{ color: 'var(--muted)' }}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </main>

      <form
        onSubmit={handleSend}
        className="flex gap-2 px-4 py-3"
        style={{
          background: '#fff',
          borderTop: '1px solid rgba(4,50,34,0.1)',
        }}
      >
        <input
          className="input flex-1"
          value={text}
          onChange={event => setText(event.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
        />

        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="px-5 py-2 rounded-xl font-medium text-sm disabled:opacity-40"
          style={{
            background: 'var(--forest)',
            color: 'var(--cream)',
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}