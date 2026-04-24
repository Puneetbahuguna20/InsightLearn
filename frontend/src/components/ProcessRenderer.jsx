import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, Play, Pause } from 'lucide-react'
import InteractiveImage from './InteractiveImage'
import LoadingSpinner from './LoadingSpinner'

const ProcessRenderer = ({ content }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  
  if (!content?.data?.steps || content.data.steps.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="text-gray-600">No steps available for this process</div>
      </div>
    )
  }

  const currentStep = content.data.steps[currentStepIndex]
  const progress = ((currentStepIndex + 1) / content.data.steps.length) * 100

  const handleNext = () => {
    if (currentStepIndex < content.data.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const handleStepClick = (index) => {
    setCurrentStepIndex(index)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleAutoPlay = () => {
    if (isPlaying && currentStepIndex < content.data.steps.length - 1) {
      setTimeout(() => {
        handleNext()
      }, 3000) // 3 seconds per step
    } else {
      setIsPlaying(false)
    }
  }

  React.useEffect(() => {
    handleAutoPlay()
  }, [currentStepIndex, isPlaying])

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
          <div className="text-sm text-gray-600">
            Step {currentStepIndex + 1} of {content.data.steps.length}
          </div>
        </div>
        
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-primary-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div 
            className="absolute top-0 left-0 bg-primary-600 h-3 rounded-full flex items-center justify-end pr-2"
            style={{ width: `${progress}%` }}
          >
            <span className="text-xs text-white font-medium">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Step Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Step {currentStepIndex + 1}</h2>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={togglePlayPause}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-8">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900">
              {currentStep.title}
            </h3>

            {/* Description */}
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Key Points */}
            {currentStep.keyPoints && currentStep.keyPoints.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">Key Points</h4>
                <ul className="space-y-2">
                  {currentStep.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-blue-800">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Image */}
            {currentStep.imageId && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Visual Diagram</h4>
                <InteractiveImage imageId={currentStep.imageId} />
              </div>
            )}

            {/* Code (for algorithms) */}
            {currentStep.code && (
              <div className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-x-auto">
                <h4 className="text-lg font-semibold mb-4">Code Example</h4>
                <pre className="text-sm">
                  <code>{currentStep.code}</code>
                </pre>
              </div>
            )}

            {/* Complexity */}
            {currentStep.complexity && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Time Complexity:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {currentStep.complexity}
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-50 px-8 py-4 flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>Previous</span>
        </button>

        {/* Step Indicators */}
        <div className="flex items-center space-x-2">
          {content.data.steps.map((_, index) => (
            <button
              key={index}
              onClick={() => handleStepClick(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentStepIndex
                  ? 'bg-primary-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentStepIndex >= content.data.steps.length - 1}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>Next</span>
        </button>
      </div>
    </div>
  )
}

export default ProcessRenderer
