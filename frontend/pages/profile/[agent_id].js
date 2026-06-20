import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import LoginModal from '../../components/LoginModal'

const tags = ['Product Strategy', 'B2B SaaS', 'Career Growth', 'Leadership']

const expectations = [
  'Alex shares candid insights into the day-to-day realities of working at Google as a Senior PM. Expect honest takes on stakeholder management, navigating ambiguity, and building alignment across cross-functional teams.',
  "He's particularly well-suited for conversations about product strategy in enterprise environments, the transition from IC to leadership, and what it actually takes to build influence without authority.",
  'Ideal for aspiring PMs, career switchers, and early-stage startup founders looking for a reality check before their next move.',
]

const conversationHistory = [
  {
    id: 'h1',
    date: 'Jun 12, 2025',
    duration: '32 min',
    quote:
      'We talked about making the move from engineering to PM. Alex gave concrete advice on portfolio structure and what interviewers at Google are actually looking for.',
  },
  {
    id: 'h2',
    date: 'May 28, 2025',
    duration: '24 min',
    quote:
      'Discussed how to influence roadmap decisions without direct authority — really useful mental models for early-career PMs navigating complex org structures.',
  },
  {
    id: 'h3',
    date: 'May 3, 2025',
    duration: '41 min',
    quote:
      'Deep dive on the job search strategy for PM roles at FAANG. Got clarity on resume highlights, how to approach recruiter reach-outs, and what hiring managers care about.',
  },
]

export default function ProfilePage() {
  const router = useRouter()
  const { agent_id } = router.query

  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
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
                <a href="#" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
                  For Providers
                </a>
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  로그아웃
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="text-xs font-medium text-gray-600 transition hover:text-gray-900 sm:text-sm"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setIsLoginOpen(true)}
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
            <a href="#" className="transition hover:text-gray-700">Home</a>
            <span>/</span>
            <a href="#" className="transition hover:text-gray-700">Explore</a>
            <span>/</span>
            <span className="text-gray-900">Alex Johnson</span>
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
                <div className="text-center">
                  <h1 className="text-xl font-bold text-gray-900">Alex Johnson</h1>
                  <p className="mt-1 text-sm text-gray-600">Senior Product Manager</p>
                  <p className="text-sm font-medium text-gray-900">@ Google</p>
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
                <h2 className="text-lg font-bold text-gray-900">What to expect</h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-600">
                  {expectations.map((text, index) => (
                    <p key={index}>{text}</p>
                  ))}
                </div>
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
                <Link
                  href={chatBasePath}
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
                </Link>
                <p className="mt-3 text-center text-xs text-gray-500">
                  Free to start · No account required · Responses typically within a few seconds
                </p>
              </section>

              {/* Conversation history */}
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
                  {conversationHistory.map((item) => (
                    <Link
                      key={item.id}
                      href={`${chatBasePath}/${item.id}`}
                      className="group flex items-start justify-between gap-4 rounded-xl bg-gray-100 p-4 transition hover:bg-gray-200"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-gray-900">{item.date}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500">{item.duration}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">“{item.quote}”</p>
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
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>

        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={handleLogin} />
      </main>
    </>
  )
}
