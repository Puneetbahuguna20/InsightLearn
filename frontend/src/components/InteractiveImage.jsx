import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Maximize2, Eye, MessageSquare } from 'lucide-react'
import api from '../services/api'

const InteractiveImage = ({ imageId }) => {
  const [imageData, setImageData] = useState(null)
  const [regions, setRegions] = useState([])
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadImageData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Get image details
        const imageResponse = await api.getImage(imageId)
        setImageData(imageResponse.data.data)
        
        // Get clickable regions
        const regionsResponse = await api.getImageRegions(imageId)
        setRegions(regionsResponse.data.data.regions || [])
      } catch (err) {
        setError('Failed to load image data')
        console.error('Error loading image:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (imageId) {
      loadImageData()
    }
  }, [imageId])

  const handleRegionClick = async (region) => {
    setSelectedRegion(region.id === selectedRegion?.id ? null : region)
    
    // Track region click for analytics
    try {
      await api.trackRegionClick(imageId, {
        regionId: region.id,
        timestamp: Date.now()
      })
    } catch (err) {
      console.error('Error tracking region click:', err)
    }
  }

  const handleRegionHover = (region) => {
    // You could show a tooltip here
  }

  const handleRegionLeave = () => {
    // Hide tooltip
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full border-2 border-primary-600 border-t-transparent w-8 h-8 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading interactive image...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="text-red-600 mb-4">Error loading image</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!imageData) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="text-gray-600">No image data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative bg-white rounded-lg shadow-md overflow-hidden">
        <img
          src={imageData.urls.original}
          alt="Interactive educational diagram"
          className="w-full h-auto max-h-96 object-contain"
        />
        
        {/* Clickable Regions Overlay */}
        {regions.map((region) => (
          <button
            key={region.id}
            onClick={() => handleRegionClick(region)}
            onMouseEnter={() => handleRegionHover(region)}
            onMouseLeave={handleRegionLeave}
            className="absolute border-2 border-transparent hover:border-primary-500 hover:bg-primary-500/10 transition-all cursor-pointer"
            style={{
              left: `${region.coordinates.x}px`,
              top: `${region.coordinates.y}px`,
              width: `${region.coordinates.width}px`,
              height: `${region.coordinates.height}px`
            }}
            aria-label={`Interactive region: ${region.content}`}
          >
            {/* Visual indicator for the region */}
            <div className={`w-full h-full flex items-center justify-center ${
              selectedRegion === region.id ? 'bg-primary-500/20' : ''
            }`}>
              {selectedRegion === region.id && (
                <div className="bg-primary-500 text-white text-xs px-2 py-1 rounded">
                  {region.content}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Region Details Panel */}
      {selectedRegion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Region Details</h3>
            <button
              onClick={() => setSelectedRegion(null)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Maximize2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Content</h4>
              <p className="text-gray-700">
                {regions.find(r => r.id === selectedRegion)?.content}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Type</h4>
              <div className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full inline-block">
                {regions.find(r => r.id === selectedRegion)?.type}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Action</h4>
              <div className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full inline-block">
                {regions.find(r => r.id === selectedRegion)?.action}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Position</h4>
              <div className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                x: {regions.find(r => r.id === selectedRegion)?.coordinates?.x || 0}, 
                y: {regions.find(r => r.id === selectedRegion)?.coordinates?.y || 0}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Size</h4>
              <div className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                {regions.find(r => r.id === selectedRegion)?.coordinates?.width || 0} × 
                {regions.find(r => r.id === selectedRegion)?.coordinates?.height || 0}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Image Metadata */}
      {imageData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Eye className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Image Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Dimensions:</span>
              <div className="font-medium">
                {imageData.metadata?.width || 0} × {imageData.metadata?.height || 0}
              </div>
            </div>
            
            <div>
              <span className="text-gray-600">Format:</span>
              <div className="font-medium">
                {imageData.metadata?.format || 'Unknown'}
              </div>
            </div>
            
            <div>
              <span className="text-gray-600">File Size:</span>
              <div className="font-medium">
                {imageData.metadata?.fileSize ? `${(imageData.metadata.fileSize / 1024).toFixed(1)} KB` : 'Unknown'}
              </div>
            </div>
            
            <div>
              <span className="text-gray-600">Generated:</span>
              <div className="font-medium">
                {new Date(imageData.generation?.generatedAt).toLocaleDateString()}
              </div>
            </div>
            
            <div>
              <span className="text-gray-600">Model:</span>
              <div className="font-medium">
                {imageData.generation?.model || 'Unknown'}
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MessageSquare className="w-4 h-4" />
              <span>Total Clicks: {imageData.analytics?.clickCount || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InteractiveImage
