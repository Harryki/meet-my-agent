import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import LoginModal from '../../components/LoginModal'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'

const tags = ['Product Strategy', 'B2B SaaS', 'Career Growth', 'Leadership']

const expectations = [
  'Alex shares candid insights into the day-to-day realities of working at Google as a Senior PM. Expect honest takes on stakeholder management, navigating ambiguity, and building alignment across cross-functional teams.',
  "He's particularly well-suited for conversations about product strategy in enterprise environments, the transition from IC to leadership, and what it actually takes to build influence without authority.",
  'Ideal for aspiring PMs, career switchers, and early-stage startup founders looking for a reality check before their next move.',
]


export default function ProfilePage() {
  const router = useRouter()
  const { agent_id } = router.query

  const { user, logout } = useAuth()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [loginReturnPath, setLoginReturnPath] = useState(null)
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', persona: '' })
  const [saving, setSaving] = useState(false)

  const isOwner = user?.agent?.uuid === agent_id

  const startEdit = () => {
    setEditForm({ name: agent?.name || '', persona: agent?.persona || '' })
    setIsEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await apiRequest(`/v1/agents/${agent_id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editForm.name, persona: editForm.persona })
      })
      if (res.ok) {
        const data = await res.json()
        setAgent(data)
        setIsEditing(false)
      } else {
        alert('Failed to save profile')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!agent_id) return
    const fetchAgent = async () => {
      try {
        const res = await apiRequest(`/v1/agents/${agent_id}`)
        if (res.ok) {
          const data = await res.json()
          setAgent(data)
        }
      } catch (err) {
        console.error('Failed to load agent', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAgent()
  }, [agent_id])

  useEffect(() => {
    if (!user || !agent_id) return
    const fetchHistory = async () => {
      try {
        const res = await apiRequest('/v1/chats')
        if (res.ok) {
          const data = await res.json()
          const agentChats = data.filter(c => c.agent_uuid === agent_id)
          setHistory(agentChats)
        }
      } catch (err) {
        console.error('Failed to load history', err)
      }
    }
    fetchHistory()
  }, [user, agent_id])

  const handleLogout = () => {
    logout()
  }

  const chatBasePath = agent_id ? `/profile/${agent_id}/chat` : '/profile/alex-johnson/chat'

  return (
    <>
      <Head>
        <title>MeetMyAgent.io</title>
        <meta name="description" content="MeetMyAgent.io - Alex Johnson" />
      </Head>
      <main className="min-h-screen bg-[#F5F5F5]">
        {/* Navigation */}
        <header className="sticky top-0 z-40 border-b border-gray-200/60 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
            <div className="flex items-center gap-8">
              <span className="text-base font-bold text-gray-900 sm:text-lg">MeetMyAgent.io</span>
              <nav className="hidden items-center gap-6 md:flex">
                <a href="#" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
                  Explore
                </a>
                <a href="#" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
                  How it works
                </a>
                <Link href="/provider" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
                  For Providers
                </Link>
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  로그아웃
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setLoginReturnPath(null)
                      setIsLoginOpen(true)
                    }}
                    className="text-xs font-medium text-gray-600 transition hover:text-gray-900 sm:text-sm"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => {
                      setLoginReturnPath(null)
                      setIsLoginOpen(true)
                    }}
                    className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 sm:block"
                  >
                    Get started
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="transition hover:text-gray-700">Home</Link>
            <span>/</span>
            <Link href="#" className="transition hover:text-gray-700">Explore</Link>
            <span>/</span>
            <span className="text-gray-900">{agent?.name || 'Loading...'}</span>
          </nav>
        </div>

        {/* Main content */}
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Left column - Profile card */}
            <aside className="w-full shrink-0 lg:w-80">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                {/* Avatar */}
                <div className="relative mx-auto mb-4 flex h-28 w-28 items-center justify-center">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-14 w-14"
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
                  <span className="absolute bottom-1 right-1 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    Available
                  </span>
                </div>

                {/* Name & title */}
                <div className="text-center relative">
                  {isOwner && !isEditing && (
                    <button onClick={startEdit} className="absolute right-0 top-0 p-2 text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors" title="Edit Profile">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      className="text-xl font-bold text-gray-900 border border-gray-300 rounded px-2 py-1 mb-2 w-full text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      placeholder="Agent Name"
                    />
                  ) : (
                    <h1 className="text-xl font-bold text-gray-900">{agent?.name || 'Loading...'}</h1>
                  )}
                  <p className="mt-1 text-sm text-gray-600">AI Agent</p>
                  <p className="text-sm font-medium text-gray-900">@ MeetMyAgent</p>
                  {agent_id && <p className="mt-1 text-xs text-gray-400">Agent ID: {agent_id}</p>}
                </div>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Divider */}
                <div className="my-5 border-t border-gray-100" />

                {/* Stats */}
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">128</p>
                    <p className="text-xs text-gray-500">Total Conversations</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-2xl font-bold text-gray-900">
                      4.9
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-900"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </p>
                    <p className="text-xs text-gray-500">Average Rating</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">3 years</p>
                    <p className="text-xs text-gray-500">Experience</p>
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <a
                    href="#"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    View LinkedIn Profile
                  </a>
                </div>
              </div>
            </aside>

            {/* Right column */}
            <div className="flex-1 space-y-6">
              {/* What to expect */}
              <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">What to expect (Persona)</h2>
                  {isOwner && !isEditing && (
                    <button onClick={startEdit} className="text-sm font-medium text-blue-600 hover:underline">Edit Persona</button>
                  )}
                </div>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-600">
                  {isEditing ? (
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.persona}
                      onChange={(e) => setEditForm({...editForm, persona: e.target.value})}
                      placeholder="Describe your agent's persona and what to expect..."
                    />
                  ) : (
                    agent?.persona ? (
                      <p className="whitespace-pre-wrap">{agent.persona}</p>
                    ) : (
                      expectations.map((text, index) => (
                        <p key={index}>{text}</p>
                      ))
                    )
                  )}
                </div>
                {isEditing && (
                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button onClick={handleCancel} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
                      {saving ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                )}
              </section>

              {/* Start conversation CTA */}
              <section className="rounded-2xl border-2 border-blue-600 bg-white p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Text-based conversation
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Average ~30 minutes
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Private & confidential
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      setLoginReturnPath(chatBasePath);
                      setIsLoginOpen(true);
                    } else {
                      router.push(chatBasePath);
                    }
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Start Conversation
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
                <p className="mt-3 text-center text-xs text-gray-500">
                  Free to start · No account required · Responses typically within a few seconds
                </p>
              </section>

              {/* Conversation history */}
              {user && (
                <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Conversation History</h2>
                    <Link
                      href={chatBasePath}
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                    >
                      See all
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {history.length > 0 ? (
                      history.map((item) => (
                        <Link
                          key={item.uuid}
                          href={`${chatBasePath}/${item.uuid}`}
                          className="group flex items-start justify-between gap-4 rounded-xl bg-gray-100 p-4 transition hover:bg-gray-200"
                        >
                          <div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold text-gray-900">
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">“{item.title || 'Untitled Conversation'}”</p>
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="mt-1 h-5 w-5 shrink-0 text-gray-400 transition group-hover:text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 py-4">No past conversations found. Start a new one!</p>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} returnPath={loginReturnPath} />
      </main>
    </>
  )
}
