import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Scale, CheckCircle, XCircle, ArrowRight, Info } from 'lucide-react'

const ComparisonRenderer = ({ content }) => {
  const [selectedView, setSelectedView] = useState('side-by-side')
  const [selectedItem, setSelectedItem] = useState(null)

  if (!content?.data?.items || content.data.items.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="text-gray-600">No comparison items available</div>
      </div>
    )
  }

  const { items, criteria } = content.data
  const title = content.title || 'Comparison'

  const renderSideBySide = () => (
    <div className="grid md:grid-cols-2 gap-6">
      {items.map((item, index) => (
        <motion.div
          key={item.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-indigo-300 transition-colors"
        >
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white">{item.name}</h3>
          </div>
          <div className="p-6 space-y-4">
            {item.features?.map((feature, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
            {item.description && (
              <p className="text-gray-600 text-sm mt-4">{item.description}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )

  const renderComparisonTable = () => (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <th className="px-6 py-4 text-left font-semibold">Criteria</th>
              {items.map((item, index) => (
                <th key={index} className="px-6 py-4 text-center font-semibold">
                  {item.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(criteria || []).map((criterion, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-6 py-4 font-medium text-gray-900">{criterion}</td>
                {items.map((item, index) => {
                  const value = item.comparison?.[criterion] || '-'
                  const isPositive = value === true || (typeof value === 'string' && value.toLowerCase().includes('yes'))
                  return (
                    <td key={index} className="px-6 py-4 text-center">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )
                      ) : (
                        <span className={`${isPositive ? 'text-green-600 font-medium' : 'text-gray-700'}`}>
                          {value}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderDifferences = () => (
    <div className="space-y-4">
      {items.map((item, index) => (
        <motion.div
          key={item.id || index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all ${
            selectedItem === index ? 'border-indigo-500 shadow-lg' : 'border-gray-200 hover:border-indigo-300'
          }`}
          onClick={() => setSelectedItem(selectedItem === index ? null : index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
            </div>
            <ArrowRight className={`w-5 h-5 text-gray-400 transition-transform ${
              selectedItem === index ? 'rotate-90' : ''
            }`} />
          </div>
          
          {selectedItem === index && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-600 mb-2 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Pros</span>
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {item.pros?.map((pro, idx) => (
                      <li key={idx}>• {pro}</li>
                    )) || <li>No specific pros listed</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-600 mb-2 flex items-center space-x-2">
                    <XCircle className="w-4 h-4" />
                    <span>Cons</span>
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {item.cons?.map((con, idx) => (
                      <li key={idx}>• {con}</li>
                    )) || <li>No specific cons listed</li>}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
        {content.description && (
          <p className="text-gray-600">{content.description}</p>
        )}
      </div>

      {/* View Selector */}
      <div className="flex justify-center space-x-2">
        {['side-by-side', 'table', 'differences'].map((view) => (
          <button
            key={view}
            onClick={() => setSelectedView(view)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === view
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={selectedView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {selectedView === 'side-by-side' && renderSideBySide()}
        {selectedView === 'table' && renderComparisonTable()}
        {selectedView === 'differences' && renderDifferences()}
      </motion.div>

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          Click on different view modes above to see the comparison from different perspectives. 
          In the &quot;Differences&quot; view, click on items to see detailed pros and cons.
        </p>
      </div>
    </div>
  )
}

export default ComparisonRenderer
