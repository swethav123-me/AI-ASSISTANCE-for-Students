import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const agentInfo = {
  research: { icon: '🔬', name: 'Research Agent', color: 'blue' },
  notes: { icon: '📝', name: 'Notes Generator', color: 'green' },
  assignment: { icon: '📋', name: 'Assignment Generator', color: 'yellow' },
  quiz: { icon: '❓', name: 'Quiz Generator', color: 'purple' },
  coding: { icon: '💻', name: 'Coding Mentor', color: 'cyan' },
  career: { icon: '🎯', name: 'Career Guidance', color: 'orange' },
  revision: { icon: '📚', name: 'Revision Planner', color: 'pink' },
  timetable: { icon: '⏰', name: 'Study Timetable', color: 'indigo' },
};

export default function ChatPage() {
  const { agentType } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastFailedMessage, setLastFailedMessage] = useState('');

  const info = agentInfo[agentType] || { icon: '🤖', name: 'AI Agent', color: 'gray' };

  useEffect(() => {
    if (!agentInfo[agentType]) {
      navigate('/agents');
      return;
    }
    loadChats();
  }, [agentType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    setInitialLoading(true);
    try {
      const { data } = await api.get('/agents/history');
      const filtered = (data.chats || []).filter((c) => c.agent_type === agentType);
      setChats(filtered);
      if (filtered.length > 0) {
        setActiveChatId(filtered[0].id);
        loadMessages(filtered[0].id);
      } else {
        setMessages([]);
        setActiveChatId(null);
      }
    } catch {
      setError('Failed to load chats');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const { data } = await api.get(`/agents/history/${chatId}`);
      setMessages(data.messages || []);
    } catch {
      setError('Failed to load messages');
    }
  };

  const switchChat = (chatId) => {
    setActiveChatId(chatId);
    setMessages([]);
    setError('');
    loadMessages(chatId);
  };

  const doSend = async (text, chatId) => {
    const { data } = await api.post('/agents/chat', {
      message: text,
      agent_type: agentType,
      chat_id: chatId,
    });
    const assistantMessage = { role: 'assistant', content: data.response };
    setMessages((prev) => [...prev, assistantMessage]);
    if (!chatId) {
      setActiveChatId(data.chat_id);
      setChats((prev) => [
        { id: data.chat_id, title: text.slice(0, 50), agent_type: agentType },
        ...prev,
      ]);
    }
    setError('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError('');
    setLastFailedMessage('');

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);
    try {
      await doSend(text, activeChatId);
    } catch (err) {
      let msg = err.response?.data?.detail || err.message || 'Failed to send message';
      if (!err.response) {
        msg = `No response from server. Check if https://ai-assistance-for-students-2.onrender.com is reachable. (${err.message})`;
      }
      setError(msg);
      setMessages((prev) => prev.slice(0, -1));
      setLastFailedMessage(text);
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setError('');
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{info.icon}</span>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{info.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{agentType} assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {activeChatId ? `Chat #${activeChatId}` : 'New chat'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500">
              <span className="text-6xl mb-4">{info.icon}</span>
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">{info.name}</h3>
              <p className="max-w-md text-sm">
                Ask me anything about {agentType === 'research' ? 'research topics and concepts' :
                  agentType === 'notes' ? 'generating notes and summaries' :
                  agentType === 'assignment' ? 'creating assignments' :
                  agentType === 'quiz' ? 'generating quiz questions' :
                  agentType === 'coding' ? 'programming and debugging' :
                  agentType === 'career' ? 'career guidance and interviews' :
                  agentType === 'revision' ? 'revision planning and flashcards' :
                  'study schedules and timetables'}.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'}`}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm px-5 py-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
              <p>{error}</p>
              <div className="mt-2 flex gap-2 justify-center">
                {lastFailedMessage && (
                  <button
                    onClick={() => {
                      setLoading(false);
                      setInput(lastFailedMessage);
                      setTimeout(() => handleSend({ preventDefault: () => {} }), 0);
                    }}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Retry
                  </button>
                )}
                <button
                  onClick={async () => {
                    try {
                      const resp = await fetch('https://ai-assistance-for-students-2.onrender.com/health');
                      const ok = resp.ok ? 'OK' : 'FAIL';
                      alert(`Backend reachable: ${ok} (status ${resp.status})`);
                    } catch(e) {
                      alert(`Cannot reach backend: ${e.message}`);
                    }
                  }}
                  className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Test Connection
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>

      {chats.length > 0 && (
        <div className="w-72 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hidden lg:flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chat History</h3>
            <button
              onClick={startNewChat}
              className="text-xs px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
            >
              + New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => switchChat(chat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeChatId === chat.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <p className="truncate font-medium">{chat.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(chat.created_at || Date.now()).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
