import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  RefreshCw,
  MessageCircle,
  BarChart3,
  User,
  LogOut,
  GraduationCap,
  X,
  History as HistoryIcon,
  ChevronRight,
  Search,
  Trash2,
  Clock
} from 'lucide-react';
import { useInsightStore } from '../../stores/insightStore';
import api from '../../services/api';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BookOpen, label: 'Learn Concept', path: '/learn' },
  { icon: Brain, label: 'Quiz', path: '/quiz' },
  { icon: RefreshCw, label: 'Revision Mode', path: '/revision' },
  { icon: MessageCircle, label: 'Doubt Solver', path: '/doubt-solver' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar, logout, historyRefreshTrigger } = useInsightStore();
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await api.get('/search/history');
      if (response.data.success) {
        // Filter out any duplicates based on topic title (case-insensitive)
        // to handle existing messy data in the database
        const uniqueHistory = [];
        const seenTopics = new Set();
        
        response.data.data.forEach(item => {
          const normalizedTopic = (item.topic || item.query).toLowerCase().trim();
          if (!seenTopics.has(normalizedTopic)) {
            seenTopics.add(normalizedTopic);
            uniqueHistory.push(item);
          }
        });
        
        setHistory(uniqueHistory);
      }
    } catch (error) {
      console.error('Failed to fetch search history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [location.pathname, location.search, historyRefreshTrigger]);

  const clearHistory = async () => {
    if (window.confirm('Clear all search history?')) {
      try {
        await api.delete('/search/history');
        setHistory([]);
      } catch (error) {
        console.error('Failed to clear history:', error);
      }
    }
  };

  const deleteHistoryItem = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/search/history/${id}`);
      setHistory(prev => prev.filter(item => item._id !== id));
    } catch (error) {
      console.error('Failed to delete history item:', error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">InsightLearn</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered Learning</p>
            </div>
            <button
              onClick={toggleSidebar}
              className="ml-auto lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            <h2 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Main Menu</h2>
            {sidebarItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                <ChevronRight className="ml-auto w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            ))}
          </div>

          {/* Search History Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-slate-400" />
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recents</h2>
              </div>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-slate-400 hover:text-red-500 transition-colors"
                  title="Clear All"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {isLoadingHistory && history.length === 0 ? (
                  <div className="px-4 py-2 space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-full" />
                    ))}
                  </div>
                ) : history.length > 0 ? (
                  history.map((item) => (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <NavLink
                        to={`/learn?topic=${encodeURIComponent(item.query)}`}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                            isActive
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                          }`
                        }
                      >
                        <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        <span className="truncate flex-1">{item.topic || item.query}</span>
                        <button
                          onClick={(e) => deleteHistoryItem(e, item._id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-all"
                        >
                          <X className="w-3 h-3 text-slate-400" />
                        </button>
                      </NavLink>
                    </motion.div>
                  ))
                ) : (
                  <div className="px-6 py-4 text-center">
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Search className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      No recent searches yet
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </motion.aside>
    </>
  );
};
