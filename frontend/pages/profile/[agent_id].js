import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import ChatModal from '../../components/ChatModal'
import LoginModal from '../../components/LoginModal'

const careerSteps = [
  { year: '2023', title: 'AI Developer', company: 'Google', description: '검색 및 생산성 도구에 적용되는 생성형 AI 기능 개발' },
  { year: '2020', title: 'Senior AI Researcher', company: 'Meta', description: '대규모 언어 모델(LLM) 연구 및 프로덕션 모델 배포' },
  { year: '2017', title: 'Software Engineer', company: 'Microsoft', description: '엔터프라이즈 AI 솔루션 개발 및 클라우드 기반 추천 시스템 구축' },
]

export default function ProfilePage() {
  const router = useRouter()
  const { agent_id } = router.query

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleChatStart = () => {
    if (!isLoggedIn) {
      setIsLoginOpen(true)
      return
    }
    setIsChatOpen(true)
  }

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setIsChatOpen(false)
  }

  return (
    <>
      <Head>
        <title>Meet my agent</title>
        <meta name="description" content="Meet my agent - Alex Kim" />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <span className="text-lg font-bold text-blue-600">Meet my agent</span>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                로그아웃
              </button>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                로그인
              </button>
            )}
          </div>
        </header>

        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />

            <div className="relative px-6 pb-8 sm:px-10">
              <div className="-mt-16 mb-4 flex items-end justify-between">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gray-200 text-gray-400 shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <button
                  onClick={handleChatStart}
                  className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow transition hover:bg-blue-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12 2.25c-2.429 0-4.817.178-7.152.521C2.87 3.061 1.5 4.585 1.5 6.375v9c0 1.79 1.37 3.314 3.348 3.604 1.18.189 2.373.34 3.573.454.27.429.637.793 1.09 1.053a4.25 4.25 0 004.978 0c.453-.26.82-.624 1.09-1.053 1.2-.113 2.393-.265 3.573-.454 1.978-.29 3.348-1.814 3.348-3.604v-9c0-1.79-1.37-3.314-3.348-3.604A49.318 49.318 0 0012 2.25zM8.25 10.5a.75.75 0 01.75-.75h6a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zm.75 3.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5H9z" clipRule="evenodd" />
                  </svg>
                  채팅 시작
                </button>
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Alex Kim</h1>
                <p className="mt-1 text-lg font-medium text-gray-600">AI Developer at Google</p>
                {agent_id && (
                  <p className="mt-1 text-xs text-gray-400">Agent ID: {agent_id}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Machine Learning</span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Generative AI</span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Large Language Models</span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">MLOps</span>
                </div>
              </div>

              <section className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">소개</h2>
                <div className="space-y-3 text-gray-700">
                  <p>
                    Microsoft, Meta를 거쳐 Google에 이르기까지 다양한 규모의 AI 프로젝트를 경험했습니다.
                    추천 시스템부터 자연어 처리, 최신 생성형 AI 애플리케이션까지 폭넓은 도메인에서 일해왔습니다.
                  </p>
                  <p>
                    현재는 Google의 생산성 도구에 적용되는 생성형 AI 기능 개발에 집중하고 있으며,
                    모델 성능 최적화와 사용자 경험 사이의 균형을 맞추는 데 주력하고 있습니다.
                  </p>
                  <p>
                    채팅을 통해 AI 커리어, 기술 스택, 프로젝트 경험 등에 대해 자유롭게 이야기 나누고 싶습니다.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="mb-5 text-lg font-semibold text-gray-900">커리어 패스</h2>
                <div className="relative border-l-2 border-gray-200 pl-6">
                  {careerSteps.map((step, index) => (
                    <div key={index} className="relative mb-8 last:mb-0">
                      <span className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow" />
                      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
                        <span className="mb-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 sm:mb-0">
                          {step.year}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{step.title}</h3>
                          <p className="text-sm font-medium text-blue-600">{step.company}</p>
                          <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>

        <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={handleLogin} />
      </main>
    </>
  )
}
