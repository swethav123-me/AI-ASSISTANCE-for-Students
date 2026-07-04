import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const agentCards = [
  { type: 'research', icon: '🔬', color: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-600 dark:text-blue-400', name: 'Research Agent', desc: 'Research topics and explain concepts' },
  { type: 'notes', icon: '📝', color: 'bg-green-50 dark:bg-green-900/20', textColor: 'text-green-600 dark:text-green-400', name: 'Notes Generator', desc: 'Generate concise notes and summaries' },
  { type: 'assignment', icon: '📋', color: 'bg-yellow-50 dark:bg-yellow-900/20', textColor: 'text-yellow-600 dark:text-yellow-400', name: 'Assignment Generator', desc: 'Create assignments at any difficulty' },
  { type: 'quiz', icon: '❓', color: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-600 dark:text-purple-400', name: 'Quiz Generator', desc: 'Generate MCQs, true/false, and more' },
  { type: 'coding', icon: '💻', color: 'bg-cyan-50 dark:bg-cyan-900/20', textColor: 'text-cyan-600 dark:text-cyan-400', name: 'Coding Mentor', desc: 'Debug, improve, and explain code' },
  { type: 'career', icon: '🎯', color: 'bg-orange-50 dark:bg-orange-900/20', textColor: 'text-orange-600 dark:text-orange-400', name: 'Career Guidance', desc: 'Career paths, interviews, and skills' },
  { type: 'revision', icon: '📚', color: 'bg-pink-50 dark:bg-pink-900/20', textColor: 'text-pink-600 dark:text-pink-400', name: 'Revision Planner', desc: 'Plan revision and create flashcards' },
  { type: 'timetable', icon: '⏰', color: 'bg-indigo-50 dark:bg-indigo-900/20', textColor: 'text-indigo-600 dark:text-indigo-400', name: 'Study Timetable', desc: 'Personalized study schedules' },
];

const COLORS = ['#6366f1', '#22c55e', '#eab308', '#a855f7', '#06b6d4', '#f97316', '#ec4899', '#6366f1'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/stats').then(({ data }) => setStats(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'AI Agents', value: 8, icon: '🤖', color: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Total Chats', value: stats?.total_chats ?? 0, icon: '💬', color: 'text-green-600 dark:text-green-400' },
    { label: 'Messages', value: stats?.total_messages ?? 0, icon: '📨', color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Documents', value: stats?.total_documents ?? 0, icon: '📁', color: 'text-orange-600 dark:text-orange-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.full_name || user?.username}!</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Choose an AI agent to get started with your academic work.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
              <span className={`text-3xl ${s.color}`}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {!loading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activity (Last 7 Days)</h3>
            {stats.daily_activity?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.daily_activity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }}
                    labelFormatter={(v) => `Date: ${v}`}
                  />
                  <Bar dataKey="messages" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 dark:text-gray-500 text-sm">
                No activity in the last 7 days
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Chats by Agent</h3>
            {stats.per_agent?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.per_agent} dataKey="count" nameKey="agent_type" cx="50%" cy="50%" outerRadius={80} label={({ agent_type, percent }) => `${agent_type} (${(percent * 100).toFixed(0)}%)`}>
                    {stats.per_agent.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 dark:text-gray-500 text-sm">
                No chats yet
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agentCards.map((agent) => (
            <button key={agent.type} onClick={() => navigate(`/chat/${agent.type}`)}
              className={`${agent.color} rounded-xl p-5 text-left shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all text-center`}>
              <div className="text-3xl mb-3">{agent.icon}</div>
              <h3 className={`font-semibold ${agent.textColor}`}>{agent.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{agent.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
