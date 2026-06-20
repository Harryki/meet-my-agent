import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Workspace from '../../components/Workspace';
import { useAuth } from '../../context/AuthContext';

export default function KnowledgePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <>
        <Head>
          <title>Meet my agent</title>
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
      </Head>
      <Workspace />
    </>
  );
}
