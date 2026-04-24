import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Star, 
  Eye, 
  TrendingUp, 
  Share2, 
  Download,
  RefreshCw,
  Heart,
  MessageSquare
} from 'lucide-react'
import useUIStore from '../stores/uiStore'
import useTopicStore from '../stores/topicStore'
import LoadingSpinner from '../components/LoadingSpinner'

const TopicPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  
  const { 
    showSuccess, 
    showError 
  } = useUIStore()
  
  const { 
    getTopic, 
    getSimilarTopics, 
    similarTopics,
    rateTopic,
    generateContent,
    currentTopic,
    classification,
    content,
    isLoading
  } = useTopicStore()

  useEffect(() => {
    if (id) {
      getTopic(id)
      getSimilarTopics(id, 5)
    }
  }, [id, getTopic, getSimilarTopics])

  const handleRating = async (newRating) => {
    try {
      await rateTopic(id, newRating)
      setRating(newRating)
      showSuccess('Thank you for rating!')
    } catch (error) {
      showError('Failed to submit rating')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentTopic?.originalText || 'Check out this topic',
        text: `Learn about ${currentTopic?.originalText} on VisualLearn`,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      showSuccess('Link copied to clipboard!')
    }
  }

  const handleDownload = () => {
    showSuccess('Download feature coming soon!')
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    showSuccess(isFollowing ? 'Unfollowed topic' : 'Following topic')
  }

  const handleGenerateContent = async () => {
    if (!currentTopic) return
    
    try {
      await generateContent(currentTopic.topicId)
      navigate(`/content/${currentTopic.topicId}`)
    } catch (error) {
      showError('Failed to generate content')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading topic details...</p>
        </div>
      </div>
    )
  }

  if (!currentTopic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Topic not found</div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back button */}
            <motion.button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </motion.button>

            {/* Title */}
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {currentTopic.originalText}
              </h1>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  classification?.type === 'structure' ? 'bg-blue-100 text-blue-800' :
                  classification?.type === 'process' ? 'bg-green-100 text-green-800' :
                  classification?.type === 'algorithm' ? 'bg-purple-100 text-purple-800' :
                  classification?.type === 'hierarchy' ? 'bg-orange-100 text-orange-800' :
                  classification?.type === 'comparison' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {classification?.type || 'unknown'}
                </div>
                <div className="text-sm text-gray-600">
                  Confidence: {Math.round((classification?.confidence || 0) * 100)}%
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={handleGenerateContent}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Generate content"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </motion.button>
              
              <motion.button
                onClick={handleShare}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Share topic"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </motion.button>
              
              <motion.button
                onClick={handleDownload}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Download content"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Download className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Topic Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Classification Details */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Topic Analysis</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Classification</h3>
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      classification?.type === 'structure' ? 'bg-blue-100 text-blue-800' :
                      classification?.type === 'process' ? 'bg-green-100 text-green-800' :
                      classification?.type === 'algorithm' ? 'bg-purple-100 text-purple-800' :
                      classification?.type === 'hierarchy' ? 'bg-orange-100 text-orange-800' :
                      classification?.type === 'comparison' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {classification?.type || 'unknown'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Confidence: {Math.round((classification?.confidence || 0) * 100)}%
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Reasoning</h3>
                  <p className="text-gray-700 text-sm">
                    {classification?.reasoning || 'No reasoning provided'}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Generated With</h3>
                  <div className="text-sm text-gray-600">
                    Model: {classification?.model || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <span>{currentTopic.usage?.requestCount || 0} views</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span>Popularity: {currentTopic.usage?.popularity || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Status */}
            {content && (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Status</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Generated Content</span>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      content ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {content ? 'Available' : 'Not Generated'}
                    </div>
                  </div>
                  
                  {content && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Type</span>
                      <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {content.type}
                      </div>
                    </div>
                  )}
                </div>

                {content && (
                  <button
                    onClick={() => navigate(`/content/${currentTopic.topicId}`)}
                    className="w-full mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    View Content
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* Interaction Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Rating */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate This Topic</h3>
              
              <div className="flex items-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    onClick={() => handleRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-colors"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (hoveredRating || rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
              
              {rating > 0 && (
                <div className="text-sm text-green-600 font-medium">
                  Thank you for rating!
                </div>
              )}
            </div>

            {/* Follow */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow Topic</h3>
              
              <motion.button
                onClick={handleFollow}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${
                  isFollowing 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className={`w-5 h-5 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                {isFollowing ? 'Following' : 'Follow'}
              </motion.button>
            </div>

            {/* Feedback */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Feedback</h3>
              
              <textarea
                placeholder="Share your thoughts about this topic..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={4}
              />
              
              <motion.button
                className="w-full mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Send Feedback
              </motion.button>
            </div>
          </motion.div>

          {/* Similar Topics */}
          {similarTopics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-lg p-6 shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Topics</h3>
              
              <div className="space-y-3">
                {similarTopics.map((topic) => (
                  <div
                    key={topic.topicId}
                    onClick={() => navigate(`/topic/${topic.topicId}`)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-gray-900">{topic.originalText}</div>
                    <div className="text-sm text-gray-600">{topic.classification.type}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TopicPage
