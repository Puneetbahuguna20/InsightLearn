import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  Star, 
  Share2, 
  Download,
  Eye,
  Heart,
  MessageSquare
} from 'lucide-react'
import useUIStore from '../stores/uiStore'
import useTopicStore from '../stores/topicStore'
import LoadingSpinner from '../components/LoadingSpinner'
import ProcessRenderer from '../components/ProcessRenderer'
import StructureRenderer from '../components/StructureRenderer'
import AlgorithmRenderer from '../components/AlgorithmRenderer'
import HierarchyRenderer from '../components/HierarchyRenderer'
import ComparisonRenderer from '../components/ComparisonRenderer'
import InteractiveImage from '../components/InteractiveImage'

const ContentPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  
  const { 
    showSuccess, 
    showError, 
    showInfo 
  } = useUIStore()
  
  const { 
    content, 
    currentStep, 
    isLoading, 
    error,
    getContent,
    generateContent,
    regenerateContent,
    navigateStep,
    goToStep,
    rateTopic
  } = useTopicStore()

  useEffect(() => {
    if (id) {
      getContent(id)
    }
  }, [id, getContent])

  const handleRegenerate = async () => {
    try {
      await regenerateContent(id, {
        improvements: {
          focus: 'more detailed explanations',
          complexity: 'intermediate'
        }
      })
      showSuccess('Content regenerated successfully')
    } catch (error) {
      showError('Failed to regenerate content')
    }
  }

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
        title: content?.data?.summary || 'Check out this educational content',
        text: `Learn about ${content?.topicId} on VisualLearn`,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      showInfo('Link copied to clipboard!')
    }
  }

  const handleDownload = () => {
    // Implement download functionality
    showInfo('Download feature coming soon!')
  }

  const renderContent = () => {
    if (!content) return null

    switch (content.type) {
      case 'process':
        return <ProcessRenderer content={content} />
      case 'structure':
        return <StructureRenderer content={content} />
      case 'algorithm':
        return <AlgorithmRenderer content={content} />
      case 'hierarchy':
        return <HierarchyRenderer content={content} />
      case 'comparison':
        return <ComparisonRenderer content={content} />
      default:
        return <div>Unsupported content type</div>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Generating educational content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error loading content</div>
          <button
            onClick={() => getContent(id)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Content not found</div>
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
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {content.data?.summary || 'Educational Content'}
              </h1>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <div className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                  {content.type}
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Eye className="w-4 h-4" />
                  <span>{content.interactions?.viewCount || 0} views</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={handleRegenerate}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Regenerate content"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </motion.button>
              
              <motion.button
                onClick={handleShare}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Share content"
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Area */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>

              {/* Navigation for process/algorithm types */}
              {(content.type === 'process' || content.type === 'algorithm') && content.data?.steps && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 flex items-center justify-between bg-white rounded-lg p-4 shadow-md"
                >
                  <button
                    onClick={() => navigateStep('prev')}
                    disabled={currentStep === 0}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="text-center">
                    <div className="text-sm text-gray-600">Step</div>
                    <div className="text-lg font-semibold">
                      {currentStep + 1} / {content.data.steps.length}
                    </div>
                  </div>

                  <button
                    onClick={() => navigateStep('next')}
                    disabled={currentStep >= content.data.steps.length - 1}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg p-6 shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate this content</h3>
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
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg p-6 shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Views</span>
                  <span className="font-medium">{content.interactions?.viewCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-medium">
                    {content.interactions?.completionRate || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Average Rating</span>
                  <span className="font-medium">
                    {content.interactions?.feedback?.length > 0
                      ? (content.interactions.feedback.reduce((sum, f) => sum + f.rating, 0) / content.interactions.feedback.length).toFixed(1)
                      : 'No ratings'
                    }
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Learning Objectives */}
            {content.data?.learningObjectives && content.data.learningObjectives.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg p-6 shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Objectives</h3>
                <ul className="space-y-2">
                  {content.data.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{objective}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ContentPage
