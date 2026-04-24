import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Menu, X, Settings, HelpCircle, Sparkles, LogOut, User } from 'lucide-react'
import useUIStore from '../stores/uiStore'
import useTopicStore from '../stores/topicStore'
import LoadingSpinner from './LoadingSpinner'

const Navbar = ({ onLogout }) => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const { 
    sidebarOpen, 
    toggleSidebar, 
    openSettingsModal, 
    openHelpModal,
    showSuccess,
    showError
  } = useUIStore()
  
  const { searchTopics, isLoading } = useTopicStore()

  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    
    try {
      await searchTopics({ query: searchQuery, limit: 20 })
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      showSuccess('Search completed')
    } catch (error) {
      showError('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40 glass-effect">
      <div className="flex items-center justify-between">
        {/* Left section - Menu and Logo */}
        <div className="flex items-center space-x-4">
          {/* Menu toggle */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
          
          {/* Logo */}
          <motion.button
            onClick={handleLogoClick}
            className="flex items-center space-x-2 font-bold text-xl text-primary-600 hover:text-primary-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-6 h-6" />
            <span>VisualLearn</span>
          </motion.button>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 max-w-2xl mx-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for topics, content, or explore..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                disabled={isLoading || isSearching}
              />
              {(isLoading || isSearching) && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Settings button */}
          <motion.button
            onClick={() => setTimeout(openSettingsModal, 100)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Settings"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </motion.button>

          {/* Help button */}
          <motion.button
            onClick={() => setTimeout(openHelpModal, 100)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Help"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </motion.button>

          {/* User menu */}
          <div className="ml-2 pl-2 border-l border-gray-200 relative">
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <User className="w-4 h-4" />
            </motion.button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              >
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    openSettingsModal()
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <hr className="my-2 border-gray-100" />
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    onLogout()
                  }}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Search suggestions dropdown - could be implemented later */}
      {searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        >
          {/* Search suggestions would go here */}
        </motion.div>
      )}
    </nav>
  )
}

export default Navbar
