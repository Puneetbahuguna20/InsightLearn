import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { useInsightStore } from '../../stores/insightStore';

export const Navbar = () => {
  const { sidebarOpen, toggleSidebar, toggleTheme, theme, logout, user } = useInsightStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  // Fallback user data if no user is logged in
  const currentUser = user || {
    name: 'Guest',
    email: 'guest@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search topics, concepts..."
              className="pl-10 pr-4 py-2 w-80 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            ) : (
              <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                </div>
                <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                  No new notifications
                </div>
              </motion.div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500"
              />
              <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300">
                {currentUser.name}
              </span>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50"
              >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="font-semibold text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <hr className="my-2 border-slate-100 dark:border-slate-700" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 w-full text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
