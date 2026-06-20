import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../../context/AuthContext'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { loginWithCode } = useAuth()
  const [error, setError] = useState(null)
  const calledRef = useRef(false)

  useEffect(() => {
    if (!router.isReady) return

    const code = router.query.code
    const state = router.query.state

    if (!code) {
      setError('인증 코드가 없습니다.')
      return
    }

    if (calledRef.current) return
    calledRef.current = true

    const handleCallback = async () => {
      const result = await loginWithCode(code)
      if (result.success) {
        const redirectPath = state ? decodeURIComponent(state) : '/provider/knowledge'
        router.replace(redirectPath)
      } else {
        setError(result.error || '로그인에 실패했습니다.')
      }
    }

    handleCallback()
  }, [router.isReady, router.query, loginWithCode, router])

  return (
    <>
      <Head>
        <title>로그인 처리 중... | MeetMyAgent.io</title>
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm">
          {error ? (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-gray-900">로그인 실패</h1>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                돌아가기
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900">로그인 처리 중...</h1>
              <p className="mt-2 text-sm text-gray-600">잠시만 기다려주세요.</p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
