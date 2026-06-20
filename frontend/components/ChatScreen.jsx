import { useState, useRef, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import { apiRequest, getApiBaseUrl } from '../lib/api'

const tips = [
  'Be specific about your situation',
  'Ask follow-up questions freely',
  'Take notes on key insights',
]

export default function ChatScreen({ defaultAgentName = 'Agent', defaultAgentRole = 'AI Agent' }) {
  const router = useRouter()
  const { agent_id, chat_id } = router.query
  const { user, logout } = useAuth()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [agentDetails, setAgentDetails] = useState({ name: defaultAgentName, persona: defaultAgentRole })
  const [isInitializing, setIsInitializing] = useState(true)
  const [isWaiting, setIsWaiting] = useState(false)
  
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (!agent_id) return
    const fetchAgent = async () => {
      try {
        const res = await apiRequest(`/v1/agents/${agent_id}`)
        if (res.ok) {
          const data = await res.json()
          setAgentDetails(data)
        }
      } catch (err) {
        console.error('Failed to load agent', err)
      }
    }
    fetchAgent()
  }, [agent_id])

  useEffect(() => {
    if (!agent_id) return

    const initChat = async () => {
      if (!chat_id) {
        try {
          const res = await apiRequest('/v1/chats', {
            method: 'POST',
            body: JSON.stringify({ agent_uuid: agent_id })
          })
          if (res.ok) {
            const data = await res.json()
            router.replace(`/profile/${agent_id}/chat/${data.uuid}`)
          }
        } catch (err) {
          console.error('Failed to create chat', err)
        }
      } else {
        try {
          const res = await apiRequest(`/v1/chats/${chat_id}`)
          if (res.ok) {
            const data = await res.json()
            setMessages(data.map(m => ({
              id: m.uuid,
              sender: m.role === 'assistant' ? 'agent' : 'user',
              text: m.content || '',
              status: m.status
            })))
          }
        } catch (err) {
          console.error('Failed to load messages', err)
        } finally {
          setIsInitializing(false)
        }
      }
    }
    initChat()
  }, [agent_id, chat_id, router])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || !chat_id || isWaiting) return

    const tempId = Date.now().toString()
    setMessages((prev) => [...prev, { id: tempId, sender: 'user', text: trimmed, status: 'completed' }])
    setInput('')
    setIsWaiting(true)

    try {
      const res = await apiRequest(`/v1/chats/${chat_id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: trimmed })
      })
      if (!res.ok) throw new Error('Failed to send message')
      const data = await res.json()
      const message_uuid = data.message_uuid

      setMessages((prev) => [
        ...prev,
        { id: message_uuid, sender: 'agent', text: '', status: 'pending' }
      ])

      const baseUrl = getApiBaseUrl()
      const token = localStorage.getItem('access_token')
      const url = new URL(`${baseUrl}/v1/chats/${chat_id}/messages/${message_uuid}/stream`)
      
      // using EventSource requires sending token somehow, or using fetch for streaming
      // fetch approach for SSE
      const sseRes = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const reader = sseRes.body.getReader()
      const decoder = new TextDecoder()
      let currentText = ''
      let buffer = ''
      
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // Keep incomplete line in buffer
        
        for (let line of lines) {
          line = line.replace(/\r$/, '')
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            if (!dataStr) continue
            try {
              const evtData = JSON.parse(dataStr)
              if (evtData.type === 'token') {
                currentText += evtData.token
                setMessages((prev) => prev.map(m => m.id === message_uuid ? { ...m, text: currentText } : m))
              } else if (evtData.type === 'tool_call') {
                setMessages((prev) => prev.map(m => {
                  if (m.id !== message_uuid) return m;
                  const newTools = [...(m.tools || [])];
                  newTools.push({ name: evtData.tool, args: evtData.arguments, status: 'searching' });
                  return { ...m, tools: newTools };
                }))
              } else if (evtData.type === 'tool_result') {
                setMessages((prev) => prev.map(m => {
                  if (m.id !== message_uuid) return m;
                  const newTools = [...(m.tools || [])];
                  if (newTools.length > 0) {
                    newTools[newTools.length - 1] = { 
                      ...newTools[newTools.length - 1], 
                      status: 'done',
                      result: evtData.chunks_count > 0 
                        ? `Found ${evtData.chunks_count} relevant chunks in ${evtData.files.join(', ')}`
                        : 'No relevant info found'
                    };
                  }
                  return { ...m, tools: newTools };
                }))
              } else if (evtData.type === 'done') {
                setMessages((prev) => prev.map(m => m.id === message_uuid ? { ...m, status: 'completed' } : m))
                setIsWaiting(false)
                break
              }
            } catch (e) {
              console.error('SSE parse error:', e, 'Data:', dataStr)
            }
          }
        }
      }
    } catch (err) {
      console.error(err)
      setIsWaiting(false)
    }
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
        <title>{`Conversation with ${agentDetails.name} | MeetMyAgent.io`}</title>
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
                    <h2 className="text-base font-bold text-gray-900">{agentDetails.name}</h2>
                    <p className="text-sm text-gray-500">AI Agent</p>
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
                    Conversation with {agentDetails.name}
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
                  {isInitializing ? (
                    <div className="flex justify-center p-8 text-gray-400">Loading chat history...</div>
                  ) : messages.length === 0 ? (
                    <div className="flex justify-center p-8 text-gray-400">No messages yet. Say hello!</div>
                  ) : messages.map((msg) => (
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
                          <p className="mb-1 text-xs font-medium text-gray-500">{agentDetails.name}</p>
                        )}
                        {msg.sender === 'user' && (
                          <p className="mb-1 text-right text-xs font-medium text-gray-500">You</p>
                        )}
                        {msg.tools && msg.tools.length > 0 && (
                          <div className="mb-2 flex flex-col gap-1.5">
                            {msg.tools.map((tool, idx) => (
                              <div key={idx} className="flex flex-col gap-1 rounded-xl bg-gray-100/80 px-3.5 py-2.5 text-xs text-gray-600 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2">
                                  {tool.status === 'searching' ? (
                                    <svg className="h-3.5 w-3.5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  <span className="font-semibold text-gray-700">
                                    {tool.name === 'search_knowledge_base' ? 'Searching knowledge base...' : `Using ${tool.name}...`}
                                  </span>
                                </div>
                                {tool.status === 'done' && (
                                  <span className="pl-5 text-[11px] text-gray-500">{tool.result}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            msg.sender === 'user'
                              ? 'rounded-br-none bg-blue-600 text-white'
                              : 'rounded-bl-none border border-gray-100 bg-white text-gray-800 shadow-sm whitespace-pre-wrap'
                          }`}
                        >
                          {msg.text || (msg.status === 'pending' ? <span className="animate-pulse">...</span> : '')}
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
                    disabled={!input.trim() || isWaiting || !chat_id}
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
