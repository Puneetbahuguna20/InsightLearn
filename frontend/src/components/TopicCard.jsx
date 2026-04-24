import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Clock, 
  Layers, 
  Zap, 
  BarChart3, 
  Star, 
  TrendingUp,
  Eye,
  ArrowRight
} from 'lucide-react'
import useUIStore from '../stores/uiStore'

const TopicCard = ({ topic, className = "" }) => {
  const { showSuccess } = useUIStore()

  const getTypeIcon = (type) => {
    const icons = {
      structure: Layers,
      process: Clock,
      algorithm: Zap,
      hierarchy: BarChart3
    }
    return icons[type] || Layers
  }

  const getTypeColor = (type) => {
    const colors = {
      structure: 'from-blue-500 to-blue-600',
      process: 'from-green-500 to-green-600',
      algorithm: 'from-purple-500 to-purple-600',
      hierarchy: 'from-orange-500 to-orange-600'
    }
    return colors[type] || 'from-gray-500 to-gray-600'
  }

  const getTypeBadgeColor = (type) => {
    const colors = {
      structure: 'bg-blue-100 text-blue-800',
      process: 'bg-green-100 text-green-800',
      algorithm: 'bg-purple-100 text-purple-800',
      hierarchy: 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const icon = getTypeIcon(topic.classification.type)
  const color = getTypeColor(topic.classification.type)
  const badgeColor = getTypeBadgeColor(topic.classification.type)

  return (
    <motion.div
      whileHover={{ y: -5, shadow: "0 10px 25px rgba(0,0,0,0.1)" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 overflow-hidden ${className}`}
    >
      <Link to={`/content/${topic.topicId}`} className="block h-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${color} text-white`}>
              <icon className="w-6 h-6" />
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
              {topic.classification.type}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {topic.originalText}
          </h3>

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{topic.usage?.requestCount || 0}</span>
            </div>
            {topic.usage?.averageRating && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{topic.usage.averageRating.toFixed(1)}</span>
              </div>
            )}
            {topic.usage?.popularity > 50 && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>Trending</span>
              </div>
            )}
          </div>

          {/* Description */}
          {topic.metadata?.domain && (
            <div className="text-sm text-gray-600 mb-4">
              Domain: <span className="font-medium">{topic.metadata.domain}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Confidence: {Math.round((topic.classification.confidence || 0) * 100)}%
            </div>
            <div className="flex items-center space-x-2 text-primary-600 font-medium text-sm">
              <span>View Content</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default TopicCard
