import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Code, Play, CheckCircle, Clock } from 'lucide-react'
import InteractiveImage from './InteractiveImage'

const AlgorithmRenderer = ({ content }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCode, setShowCode] = useState(false)
  
  if (!content?.data?.steps || content.data.steps.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="text-gray-600">No algorithm steps available</div>
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
      }, 5000) // 5 seconds per step for algorithms
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
          <h3 className="text-lg font-semibold text-gray-900">Algorithm Progress</h3>
          <div className="text-sm text-gray-600">
            Step {currentStepIndex + 1} of {content.data.steps.length}
          </div>
        </div>
        
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-purple-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div 
            className="absolute top-0 left-0 bg-purple-600 h-3 rounded-full flex items-center justify-end pr-2"
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
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Code className="w-6 h-6" />
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
                  <div className="w-5 h-5 text-white">⏸</div>
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
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-purple-900 mb-3">Key Points</h4>
                <ul className="space-y-2">
                  {currentStep.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="text-purple-800">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Image */}
            {currentStep.imageId && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Visualization</h4>
                <InteractiveImage imageId={currentStep.imageId} />
              </div>
            )}

            {/* Code Section */}
            {currentStep.code && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">Implementation</h4>
                  <motion.button
                    onClick={() => setShowCode(!showCode)}
                    className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Code className="w-4 h-4" />
                    <span>{showCode ? 'Hide Code' : 'Show Code'}</span>
                  </motion.button>
                </div>
                <div>
                  {showCode && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden"
                    >
                      <pre className="p-6 overflow-x-auto">
                        <code className="text-sm font-mono">
                          {currentStep.code}
                        </code>
                      </pre>
                    </motion.div>
                  )}
                </div>
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
                  ? 'bg-purple-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentStepIndex >= content.data.steps.length - 1}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>Next</span>
        </button>
      </div>

      {/* Algorithm Complexity Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Complexity Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {content.data.steps.map((step, index) => (
            <div key={index} className="space-y-2">
              <div className="font-medium text-gray-900">Step {index + 1}</div>
              <div className="text-sm text-gray-600">{step.title}</div>
              {step.complexity && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {step.complexity}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default AlgorithmRenderer
