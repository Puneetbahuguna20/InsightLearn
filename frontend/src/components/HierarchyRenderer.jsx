import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, ChevronDown, ChevronRight, Eye } from 'lucide-react'
import InteractiveImage from './InteractiveImage'

const HierarchyRenderer = ({ content }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [selectedNode, setSelectedNode] = useState(null)
  const [viewMode, setViewMode] = useState('tree') // tree, radial, compact

  if (!content?.data?.nodes || content.data.nodes.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="text-gray-600">No hierarchy data available</div>
      </div>
    )
  }

  const toggleNodeExpansion = (nodeId) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const handleNodeClick = (node) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node)
  }

  const renderTreeNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedNode?.id === node.id
    const hasChildren = node.children && node.children.length > 0
    const childNodes = content.data.nodes.filter(n => node.children.includes(n.id))

    return (
      <div key={node.id} className="relative">
        <div
          className={`flex items-center py-2 px-3 rounded-lg border transition-all cursor-pointer ${
            isSelected
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
          }`}
          onClick={() => handleNodeClick(node)}
          style={{ marginLeft: `${level * 24}px` }}
        >
          <div className="flex items-center space-x-3">
            {hasChildren && (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </motion.div>
            )}
            
            <div className="flex-1">
              <div className="font-medium text-gray-900">{node.label}</div>
              {node.description && (
                <div className="text-sm text-gray-600 mt-1">{node.description}</div>
              )}
            </div>
          </div>
        </div>

        {/* Child nodes */}
        {hasChildren && isExpanded && (
          <div className="ml-6 mt-2">
            {childNodes.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderRadialView = () => {
    return (
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Radial View</h3>
        
        <div className="relative h-96 flex items-center justify-center">
          {/* Central node */}
          {content.data.rootNodes && content.data.rootNodes.length > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {content.data.rootNodes.map(rootId => {
                const rootNode = content.data.nodes.find(n => n.id === rootId)
                return (
                  <div
                    key={rootId}
                    className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:bg-orange-600 transition-colors"
                    onClick={() => handleNodeClick(rootNode)}
                  >
                    {rootNode.label.charAt(0)}
                  </div>
                )
              })}
            </div>
          )}

          {/* Child nodes in circle */}
          {content.data.nodes.map((node, index) => {
            if (content.data.rootNodes.includes(node.id)) return null
            
            const angle = (index * 360) / content.data.nodes.length
            const radius = 120
            const x = Math.cos(angle * Math.PI / 180) * radius
            const y = Math.sin(angle * Math.PI / 180) * radius
            
            return (
              <div
                key={node.id}
                className="absolute w-12 h-12 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center shadow-md hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer"
                style={{
                  left: `calc(50% + ${x}px - 24px)`,
                  top: `calc(50% + ${y}px - 24px)`,
                  transform: `translate(-50%, -50%)`
                }}
                onClick={() => handleNodeClick(node)}
              >
                <div className="text-xs font-medium text-center">
                  {node.label.substring(0, 2)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderCompactView = () => {
    return (
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Compact View</h3>
        
        <div className="space-y-3">
          {content.data.nodes.map((node, index) => (
            <div
              key={node.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedNode?.id === node.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
              }`}
              onClick={() => handleNodeClick(node)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{node.label}</div>
                  {node.description && (
                    <div className="text-sm text-gray-600 mt-1">{node.description}</div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Eye className="w-4 h-4" />
                  <span>Level {node.level}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Image */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Hierarchy Diagram</h3>
          
          {/* Placeholder for the hierarchy image */}
          {content.data.imagePrompt && (
            <div className="relative bg-orange-50 rounded-lg p-4 min-h-96 flex items-center justify-center">
              <div className="text-center">
                <GitBranch className="w-12 h-12 text-orange-600 mb-2" />
                <p className="text-gray-600">Hierarchy diagram will appear here</p>
                <p className="text-sm text-gray-500">Prompt: {content.data.imagePrompt}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">View Mode</h3>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'tree'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tree View
            </button>
            
            <button
              onClick={() => setViewMode('radial')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'radial'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Radial View
            </button>
            
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'compact'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Compact View
            </button>
          </div>
        </div>

        {/* View Content */}
        {viewMode === 'tree' && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-4">Tree Structure</h4>
            <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto">
              {content.data.rootNodes.map(rootId => {
                const rootNode = content.data.nodes.find(n => n.id === rootId)
                return renderTreeNode(rootNode)
              })}
            </div>
          </div>
        )}

        {viewMode === 'radial' && renderRadialView()}
        {viewMode === 'compact' && renderCompactView()}
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Node Details</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronDown className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{selectedNode.label}</h4>
              {selectedNode.description && (
                <p className="text-gray-700">{selectedNode.description}</p>
              )}
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Properties</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Level:</span>
                  <span className="font-medium">{selectedNode.level}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Children:</span>
                  <span className="font-medium">{selectedNode.children?.length || 0}</span>
                </div>
                
                {selectedNode.parentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parent:</span>
                    <span className="font-medium">
                      {content.data.nodes.find(n => n.id === selectedNode.parentId)?.label || 'None'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default HierarchyRenderer
