import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Profile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    username: user?.username || '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      await api.put('/auth/me', form);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setEditing(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile' });
    }
  };

  const roleColor = user?.role === 'teacher'
    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
            {(user?.full_name || user?.username || '?')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.full_name || user?.username}</h2>
            <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${roleColor}`}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
          </div>
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg text-sm mb-4 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            {[
              { label: 'Full Name', key: 'full_name', type: 'text' },
              { label: 'Username', key: 'username', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                Save Changes
              </button>
              <button type="button" onClick={() => setEditing(false)} className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase">Full Name</label>
                <p className="text-gray-900 dark:text-white mt-1">{user?.full_name || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase">Username</label>
                <p className="text-gray-900 dark:text-white mt-1">{user?.username}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase">Email</label>
                <p className="text-gray-900 dark:text-white mt-1">{user?.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase">Role</label>
                <p className="text-gray-900 dark:text-white mt-1 capitalize">{user?.role}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase">Member Since</label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase">Verified</label>
                <p className="text-gray-900 dark:text-white mt-1">{user?.is_verified ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
