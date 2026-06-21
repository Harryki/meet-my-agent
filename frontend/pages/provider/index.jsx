import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  BarChart3, 
  MessageSquare, 
  Eye, 
  Activity,
  User,
  Settings,
  Database,
  Clock,
  FileText,
  Users,
  AlertTriangle
} from 'lucide-react';
import TopNavbar from '../../components/TopNavbar';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';

export default function ProviderDashboard() {
  const { user, logout, token } = useAuth();
  const [missingInfo, setMissingInfo] = useState([]);

  useEffect(() => {
    if (user?.agent?.uuid) {
      apiRequest(`/v1/agents/${user.agent.uuid}/missing-info`)
        .then(res => res.json())
        .then(data => setMissingInfo(data))
        .catch(err => console.error("Failed to fetch missing info", err));
    }
  }, [user?.agent?.uuid, token]);

  // Mock Data
  const stats = [
    { name: 'Sessions Today', value: '142', icon: MessageSquare, change: '+12%', changeType: 'positive' },
    { name: 'Average Rating', value: '4.8', icon: BarChart3, change: '+0.2', changeType: 'positive' },
    { name: 'Profile Views', value: '1,245', icon: Eye, change: '-3%', changeType: 'negative' },
    { name: 'Active Chats', value: '18', icon: Activity, change: '+4', changeType: 'positive' },
  ];

  const recentSessions = [
    { id: 1, name: 'Alice Smith', email: 'alice.s@example.com', dialogs: 24, duration: '12m', time: '10 mins ago', status: 'Active' },
    { id: 2, name: 'Bob Johnson', email: 'b.johnson@tech.co', dialogs: 8, duration: '4m', time: '1 hour ago', status: 'Completed' },
    { id: 3, name: 'Charlie Lee', email: 'charlie99@gmail.com', dialogs: 45, duration: '28m', time: '3 hours ago', status: 'Completed' },
    { id: 4, name: 'Diana Prince', email: 'diana.p@startup.io', dialogs: 12, duration: '7m', time: '5 hours ago', status: 'Completed' },
    { id: 5, name: 'Evan Wright', email: 'evan.w@example.com', dialogs: 32, duration: '19m', time: 'Yesterday', status: 'Completed' },
  ];

  const profileLink = user?.agent?.uuid ? `/profile/${user.agent.uuid}` : `/profile/alex-johnson`;

  return (
    <>
      <Head>
        <title>Provider Dashboard | MeetMyAgent.io</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        <TopNavbar userName={user?.name || 'Alex Johnson'} agentUuid={user?.agent?.uuid} onLogout={logout} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Overview of your AI Agent's performance and knowledge base.</p>
            </div>
            <Link 
              href={profileLink}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center justify-center"
            >
              View Public Profile
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <stat.icon size={20} />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-sm text-gray-500 font-medium">{stat.name}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Profile & KB */}
            <div className="lg:col-span-1 space-y-8">
              
              {/* Profile Detail Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <User size={18} className="text-gray-500" />
                    Agent Profile
                  </h2>
                  <button className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Settings size={18} />
                  </button>
                </div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-md mb-3">
                      <span className="text-2xl font-bold text-blue-600">
                        {(user?.name || 'A')[0]}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{user?.name || 'Alex Johnson'}</h3>
                    <p className="text-sm text-blue-600 font-medium">Senior Product Manager</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Persona Focus</h4>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                        Expert in B2B SaaS product strategy. Direct, analytical, and supportive. Provides actionable frameworks rather than generic advice.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Target Audience</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">Junior PMs</span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">Founders</span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">Career Switchers</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Knowledge Base Status Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Database size={18} className="text-gray-500" />
                    Knowledge Base
                  </h2>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-md border border-emerald-100">
                    Synced
                  </span>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <FileText size={16} />
                        <span className="text-xs font-medium uppercase tracking-wider">Documents</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">42</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Activity size={16} />
                        <span className="text-xs font-medium uppercase tracking-wider">Storage</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">8.4<span className="text-sm font-medium text-gray-500 ml-1">MB</span></p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2"><Clock size={14} /> Last Updated</span>
                      <span className="font-medium text-gray-900">Today, 09:42 AM</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2"><FileText size={14} /> Most Indexed</span>
                      <span className="font-medium text-gray-900 truncate max-w-[120px]">Q3_Roadmap.md</span>
                    </div>
                  </div>
                  
                  <Link href="/provider/knowledge" className="flex justify-center w-full mt-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                    Manage Documents
                  </Link>
                </div>
              </div>

              {/* Missing Info Alerts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-amber-50/50 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-amber-900 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    Unanswered Questions
                  </h2>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-md">
                    {missingInfo.length} New
                  </span>
                </div>
                <div className="p-0">
                  {missingInfo.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-sm text-gray-500">No missing info reported yet.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {missingInfo.slice(0, 5).map(info => (
                        <li key={info.uuid} className="p-4 hover:bg-gray-50 transition-colors">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">"{info.question}"</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">{new Date(info.created_at).toLocaleDateString()}</span>
                            <button className="text-xs font-medium text-blue-600 hover:text-blue-700">Add Answer</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {missingInfo.length > 5 && (
                    <div className="p-3 border-t border-gray-100 text-center">
                      <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Recent Sessions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
                <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Users size={18} className="text-gray-500" />
                    Recent Sessions
                  </h2>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-white">
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dialogs</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {recentSessions.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                                {session.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{session.name}</p>
                                <p className="text-xs text-gray-500">{session.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                              session.status === 'Active' 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                              {session.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>}
                              {session.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900 font-medium">{session.dialogs}</span>
                            <span className="text-xs text-gray-500 ml-1">msgs</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {session.duration}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 text-right">
                            {session.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {recentSessions.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-500">No recent sessions found.</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </>
  );
}
