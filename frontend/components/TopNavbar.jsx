import Link from 'next/link';

export default function TopNavbar({ userName = 'User', agentUuid, onLogout }) {
  const profileLink = agentUuid ? `/profile/${agentUuid}` : `/profile/alex-johnson`;

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-200 shrink-0">
      <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
        MeetMyAgent.io
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        <Link
          href={profileLink}
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Profile
        </Link>
        <span className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
          Explore
        </span>
        <Link href="/provider" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          Dashboard
        </Link>
        <span className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
          Sessions
        </span>
      </nav>

      <button
        onClick={onLogout}
        className="flex items-center gap-2.5 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
        title="로그아웃"
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
          {userName.charAt(0)}
        </div>
        <span className="text-sm font-medium text-gray-700">{userName}</span>
      </button>
    </header>
  );
}
