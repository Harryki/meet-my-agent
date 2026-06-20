import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

const initialConversations = [
  {
    id: 'c1',
    title: 'AI 커리어 상담',
    updatedAt: '2024.06.18',
    messages: [
      { id: 1, sender: 'other', text: '안녕하세요! 궁금한 점이 있으면 편하게 물어보세요.' },
      { id: 2, sender: 'me', text: 'Google AI 개발자가 되려면 어떤 준비가 필요할까요?' },
      { id: 3, sender: 'other', text: '딥러닝 기초와 프로덕션 ML 경험이 중요합니다.' },
    ]
  },
  {
    id: 'c2',
    title: '프로젝트 문의',
    updatedAt: '2024.06.15',
    messages: [
      { id: 1, sender: 'other', text: '안녕하세요! 궁금한 점이 있으면 편하게 물어보세요.' },
    ]
  },
  {
    id: 'c3',
    title: '기술 스택 질문',
    updatedAt: '2024.06.10',
    messages: [
      { id: 1, sender: 'other', text: '안녕하세요! 궁금한 점이 있으면 편하게 물어보세요.' },
      { id: 2, sender: 'me', text: '주로 어떤 프레임워크를 사용하시나요?' },
    ]
  },
]

export default function ChatScreen({ agentName = 'Alex Johnson', agentRole = 'Senior Product Manager @ Google' }) {
  const router = useRouter()
  const { agent_id, chat_id } = router.query

  const [conversations, setConversations] = useState(initialConversations)
  const [activeId, setActiveId] = useState(chat_id || initialConversations[0].id)
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  const activeConversation = conversations.find(c => c.id === activeId) || conversations[0]

  useEffect(() => {
    if (chat_id && conversations.some(c => c.id === chat_id)) {
      setActiveId(chat_id)
    }
  }, [chat_id, conversations])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeConversation.messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const userMessage = { id: Date.now(), sender: 'me', text: trimmed }

    setConversations(prev =>
      prev.map(conv =>
        conv.id === activeId
          ? { ...conv, messages: [...conv.messages, userMessage], updatedAt: '방금' }
          : conv
      )
    )
    setInput('')

    setTimeout(() => {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === activeId
            ? { ...conv, messages: [...conv.messages, { id: Date.now() + 1, sender: 'other', text: '메시지를 확인했습니다. 곧 답변드릴게요!' }] }
            : conv
        )
      )
    }, 800)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = () => {
    const newId = `c${Date.now()}`
    const newConversation = {
      id: newId,
      title: '새로운 채팅',
      updatedAt: '방금',
      messages: [
        { id: 1, sender: 'other', text: '안녕하세요! 궁금한 점이 있으면 편하게 물어보세요.' }
      ]
    }
    setConversations(prev => [newConversation, ...prev])
    setActiveId(newId)
    router.push(`/profile/${agent_id}/chat/${newId}`, undefined, { shallow: true })
  }

  const handleSelectConversation = (id) => {
    router.push(`/profile/${agent_id}/chat/${id}`, undefined, { shallow: true })
  }

  return (
    <>
      <Head>
        <title>Chat with {agentName} | MeetMyAgent.io</title>
      </Head>
      <div className="flex h-screen flex-col bg-gray-50">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${agent_id}`}
              className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100"
              aria-label="프로필로 돌아가기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{agentName}</p>
              <p className="text-xs text-green-600">{agentRole}</p>
            </div>
          </div>
          <Link
            href={`/profile/${agent_id}`}
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            프로필로 돌아가기
          </Link>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* 좌측 채팅 히스토리 */}
          <div className="hidden w-64 flex-col border-r border-gray-200 bg-white sm:flex">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="font-semibold text-gray-900">채팅 목록</p>
              <button
                onClick={handleNewChat}
                className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="새 채팅"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5H12.75v6.75a.75.75 0 01-1.5 0V12.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
                      conv.id === activeId
                        ? 'bg-blue-100 text-blue-900'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <p className="truncate text-sm font-medium">{conv.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{conv.updatedAt}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 우측 채팅 영역 */}
          <div className="flex flex-1 flex-col">
            {/* 모바일 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 sm:hidden">
              <p className="text-sm font-semibold text-gray-900">{activeConversation.title}</p>
              <button
                onClick={handleNewChat}
                className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100"
                aria-label="새 채팅"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5H12.75v6.75a.75.75 0 01-1.5 0V12.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* 메시지 영역 */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
              <div className="space-y-3">
                {activeConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        msg.sender === 'me'
                          ? 'rounded-br-none bg-blue-600 text-white'
                          : 'rounded-bl-none bg-white text-gray-800 shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 입력 영역 */}
            <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:bg-gray-300"
                  aria-label="전송"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
