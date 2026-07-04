import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const agentIcons = {
  research: '🔬',
  notes: '📝',
  assignment: '📋',
  quiz: '❓',
  coding: '💻',
  career: '🎯',
  revision: '📚',
  timetable: '⏰',
};

const agentColors = {
  research: 'from-blue-500 to-blue-600',
  notes: 'from-green-500 to-green-600',
  assignment: 'from-yellow-500 to-yellow-600',
  quiz: 'from-purple-500 to-purple-600',
  coding: 'from-cyan-500 to-cyan-600',
  career: 'from-orange-500 to-orange-600',
  revision: 'from-pink-500 to-pink-600',
  timetable: 'from-indigo-500 to-indigo-600',
};

const agentBg = {
  research: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  notes: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  assignment: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  quiz: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  coding: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800',
  career: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  revision: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
  timetable: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
};

export default function Agents() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/agents/list')
      .then(({ data }) => setAgents(data.agents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Agents</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Explore the specialized AI agents available to assist with your academic work.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const type = agent.type;
          const icon = agentIcons[type] || '🤖';
          const colorGrad = agentColors[type] || 'from-gray-500 to-gray-600';
          const bgClass = agentBg[type] || 'bg-gray-50 dark:bg-gray-800';

          return (
            <div
              key={type}
              className={`rounded-xl border ${bgClass} p-5 hover:shadow-md transition-all cursor-pointer`}
              onClick={() => navigate(`/chat/${type}`)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorGrad} flex items-center justify-center text-2xl shadow-sm`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{agent.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{agent.role}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {agent.goal}
              </p>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2">
                  {agent.backstory}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
