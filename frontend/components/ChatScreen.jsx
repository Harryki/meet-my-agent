import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'

const initialMessages = [
  {
    id: 1,
    sender: 'agent',
    text: "Hi! I'm Alex. Great to connect with you here. What's on your mind today — feel free to share as much or as little context as you'd like to start.",
  },
  {
    id: 2,
    sender: 'user',
    text: "Hey Alex! Thanks for making time. I'm currently an engineer at a Series B startup and I've been thinking seriously about transitioning into a PM role. I'm not sure where to start.",
  },
  {
    id: 3,
    sender: 'agent',
    text: "That's a really common and exciting transition to think about. Engineers often make great PMs because of the technical credibility. Can I ask — what's drawing you toward the PM side? Is it the product strategy, the customer interaction, or something else?",
  },
  {
    id: 4,
    sender: 'user',
    text: "Honestly, I think it's the strategy part. I find myself constantly thinking about why we're building certain features, not just how. I want more say in that direction.",
  },
  {
    id: 5,
    sender: 'agent',
    text: "That's a strong signal. The 'why' instinct is core to good PM thinking. A few practical questions: have you had any informal PM-like responsibilities in your current role? Things like writing specs, talking to customers, or driving prioritization discussions?",
  },
  {
    id: 6,
    sender: 'user',
    text: "A bit — I've written a couple of technical specs and sat in on user interviews. But nothing formal.",
  },
]

const tips = [
  'Be specific about your situation',
  'Ask follow-up questions freely',
  'Take notes on key insights',
]

export default function ChatScreen({ agentName = 'Alex Johnson', agentRole = 'Senior PM @ Google' }) {
  const router = useRouter()
  const { agent_id } = router.query
  const { user, logout } = useAuth()

  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const userMessage = { id: Date.now(), sender: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInput('')

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'agent', text: 'Thanks for sharing that. Let me think about the best way to help you with this.' },
      ])
    }, 800)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEndConversation = () => {
    router.push(`/profile/${agent_id}`)
  }

  return (
    <>
      <Head>
        <title>{`Conversation with ${agentName} | MeetMyAgent.io`}</title>
      </Head>
      <div className="flex min-h-screen flex-col bg-[#F5F5F5]">
        {/* Top navigation */}
        <header className="sticky top-0 z-40 border-b border-gray-200/60 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-base font-bold text-gray-900 sm:text-lg">
                MeetMyAgent.io
              </Link>
              <nav className="hidden items-center gap-6 md:flex">
                <a href="#" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
                  Explore
                </a>
                <a href="#" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
                  Sessions
                </a>
                <a href="#" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
                  Saved Agents
                </a>
              </nav>
            </div>
            <button
              onClick={logout}
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Left sidebar - Agent info */}
            <aside className="w-full shrink-0 lg:w-80">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                {/* Agent profile */}
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{agentName}</h2>
                    <p className="text-sm text-gray-500">{agentRole}</p>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Available
                    </span>
                  </div>
                </div>

                {/* Session info */}
                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 text-sm">
                  <div>
                    <span className="block text-gray-500">Session</span>
                    <span className="font-medium text-gray-900">In progress</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Duration</span>
                    <span className="font-medium text-gray-900">0:12</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Type</span>
                    <span className="font-medium text-gray-900">Text-based</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Privacy</span>
                    <span className="font-medium text-gray-900">Private</span>
                  </div>
                </div>

                {/* Tips */}
                <div className="mt-6 border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-semibold text-gray-900">Tips for this conversation</h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    {tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* End conversation */}
                <button
                  onClick={handleEndConversation}
                  className="mt-6 w-full rounded-lg bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  End Conversation
                </button>
              </div>
            </aside>

            {/* Right chat area */}
            <div className="flex min-h-[600px] flex-1 flex-col rounded-2xl bg-white shadow-sm">
              {/* Chat header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div>
                  <h1 className="text-base font-bold text-gray-900">
                    Conversation with {agentName}
                  </h1>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="font-medium text-emerald-600">Active now</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
                <div className="space-y-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'agent' && (
                        <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="max-w-[75%]">
                        {msg.sender === 'agent' && (
                          <p className="mb-1 text-xs font-medium text-gray-500">{agentName}</p>
                        )}
                        {msg.sender === 'user' && (
                          <p className="mb-1 text-right text-xs font-medium text-gray-500">You</p>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            msg.sender === 'user'
                              ? 'rounded-br-none bg-blue-600 text-white'
                              : 'rounded-bl-none border border-gray-100 bg-white text-gray-800 shadow-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input area */}
              <div className="border-t border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message here..."
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Send
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
