import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AuthPage from '../components/AuthPage';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/provider/knowledge');
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <>
        <Head>
          <title>Meet my agent</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa]">
          <div className="text-gray-500">불러오는 중...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Meet my agent</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AuthPage />
    </>
  );
}
