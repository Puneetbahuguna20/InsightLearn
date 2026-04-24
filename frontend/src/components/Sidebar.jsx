import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Search, 
  TrendingUp, 
  BookOpen, 
  Layers, 
  Zap, 
  Settings, 
  HelpCircle,
  BarChart3,
  Clock
} from 'lucide-react'
import useUIStore from '../stores/uiStore'
import useTopicStore from '../stores/topicStore'

const sidebarVariants = {
  open: { x: 0 },
  closed: { x: -256 }
}

const Sidebar = () => {
  const navigate = useNavigate()
  const { sidebarOpen } = useUIStore()
  const { popularTopics } = useTopicStore()

  const navigationItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      description: 'Get started with AI-powered learning'
    },
    {
      name: 'Explore',
      href: '/search',
      icon: Search,
      description: 'Discover educational content'
    },
    {
      name: 'Trending',
      href: '/trending',
      icon: TrendingUp,
      description: 'See what\'s popular'
    },
    {
      name: 'My Library',
      href: '/library',
      icon: BookOpen,
      description: 'Your saved content'
    }
  ]

  const contentTypes = [
    {
      name: 'Structures',
      href: '/type/structure',
      icon: Layers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Processes',
      href: '/type/process',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Algorithms',
      href: '/type/algorithm',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Hierarchies',
      href: '/type/hierarchy',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  const handleQuickTopic = (topicId) => {
    navigate(`/content/${topicId}`)
  }

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial="closed"
          animate="open"
          exit="closed"
          variants={sidebarVariants}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-30 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">VisualLearn</h2>
            <p className="text-sm text-gray-600 mt-1">AI-Powered Learning</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </NavLink>
              ))}
            </div>

            {/* Content Types Section */}
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Content Types
              </h3>
              <div className="space-y-2">
                {contentTypes.map((type) => (
                  <NavLink
                    key={type.name}
                    to={type.href}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? `${type.bgColor} ${type.color}`
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <type.icon className="w-5 h-5" />
                    <span className="font-medium">{type.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>

          {/* Popular Topics */}
          {popularTopics.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Popular Topics
              </h3>
              <div className="space-y-2">
                {popularTopics.slice(0, 3).map((topic) => (
                  <button
                    key={topic.topicId}
                    onClick={() => handleQuickTopic(topic.topicId)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="font-medium truncate">{topic.originalText}</div>
                    <div className="text-xs text-gray-500">
                      {topic.classification.type}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Help & Support</span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

export default Sidebar
