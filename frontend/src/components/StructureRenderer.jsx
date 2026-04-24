import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Layers, Maximize2, Eye } from 'lucide-react'
import InteractiveImage from './InteractiveImage'

const StructureRenderer = ({ content }) => {
  const [selectedLabel, setSelectedLabel] = useState(null)
  const [hoveredLabel, setHoveredLabel] = useState(null)
  
  if (!content?.data?.labels || content.data.labels.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="text-gray-600">No structure components available</div>
      </div>
    )
  }

  const handleLabelClick = (label) => {
    setSelectedLabel(label.id === selectedLabel?.id ? null : label)
  }

  const handleLabelHover = (label) => {
    setHoveredLabel(label)
  }

  const handleLabelLeave = () => {
    setHoveredLabel(null)
  }

  return (
    <div className="space-y-6">
      {/* Main Image */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Structure Diagram</h3>
          
          {/* Placeholder for the main structure image */}
          {content.data.imagePrompt && (
            <div className="relative bg-gray-50 rounded-lg p-4 min-h-96 flex items-center justify-center">
              <div className="text-center">
                <Layers className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-gray-600">Structure diagram will appear here</p>
                <p className="text-sm text-gray-500">Prompt: {content.data.imagePrompt}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Labels */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Interactive Components</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.data.labels.map((label, index) => (
            <motion.div
              key={label.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => handleLabelClick(label)}
                onMouseEnter={() => handleLabelHover(label)}
                onMouseLeave={handleLabelLeave}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedLabel?.id === label.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">{label.text}</h4>
                  {label.description && (
                    <p className="text-sm text-gray-600 mb-3">{label.description}</p>
                  )}
                  
                  {/* Connections */}
                  {label.connections && label.connections.length > 0 && (
                    <div className="text-xs text-gray-500 mb-3">
                      Connected to: {label.connections.join(', ')}
                    </div>
                  )}
                  
                  {/* Importance indicator */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Importance:</span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      label.importance === 'high' ? 'bg-red-100 text-red-800' :
                      label.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {label.importance || 'medium'}
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Selected Label Details */}
      {selectedLabel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Component Details</h3>
            <button
              onClick={() => setSelectedLabel(null)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Maximize2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{selectedLabel.text}</h4>
              {selectedLabel.description && (
                <p className="text-gray-700">{selectedLabel.description}</p>
              )}
            </div>
            
            {selectedLabel.connections && selectedLabel.connections.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Connections</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedLabel.connections.map((connId, index) => {
                    const connectedLabel = content.data.labels.find(l => l.id === connId)
                    return connectedLabel ? (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                      >
                        {connectedLabel.text}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>Position: ({selectedLabel.position?.x || 0}, {selectedLabel.position?.y || 0})</span>
              </div>
              <div className="flex items-center space-x-1">
                <Layers className="w-4 h-4" />
                <span>Importance: {selectedLabel.importance || 'medium'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hovered Label Tooltip */}
      {hoveredLabel && !selectedLabel && (
        <div className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-xs">
          <div className="font-medium">{hoveredLabel.text}</div>
          {hoveredLabel.description && (
            <div className="text-sm mt-1">{hoveredLabel.description}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default StructureRenderer
