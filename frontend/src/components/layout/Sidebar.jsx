import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/agents', label: 'AI Agents', icon: '🤖' },
  { to: '/documents', label: 'Documents', icon: '📁' },
];

export default function Sidebar({ open, onToggle }) {
  const { user } = useAuth();

  return (
    <aside className={`${open ? 'w-64' : 'w-0'} transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 truncate">AI Academic Assistant</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase">Agents</p>
        </div>
        {Object.entries(agentIcons).map(([type, icon]) => (
          <NavLink
            key={type}
            to={`/chat/${type}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`
            }
          >
            <span>{icon}</span>
            <span className="capitalize">{type} Agent</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <NavLink to="/profile" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span className="truncate">{user?.username || 'User'}</span>
        </NavLink>
      </div>
    </aside>
  );
}
