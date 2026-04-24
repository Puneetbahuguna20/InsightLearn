import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, Grid, List, BookOpen, TrendingUp } from 'lucide-react'
import useUIStore from '../stores/uiStore'
import useTopicStore from '../stores/topicStore'
import TopicCard from '../components/TopicCard'
import LoadingSpinner from '../components/LoadingSpinner'

const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [filters, setFilters] = useState({
    type: '',
    domain: '',
    complexity: '',
    sortBy: 'popularity',
    sortOrder: 'desc'
  })
  
  const { 
    viewMode, 
    setViewMode, 
    itemsPerPage 
  } = useUIStore()
  
  const { 
    searchTopics, 
    searchResults, 
    searchLoading,
    getPopularTopics,
    popularTopics 
  } = useTopicStore()

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '')
  }, [searchParams])

  useEffect(() => {
    if (searchQuery) {
      handleSearch()
    }
  }, [searchQuery])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    try {
      await searchTopics({
        query: searchQuery,
        type: filters.type,
        domain: filters.domain,
        complexity: filters.complexity,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        limit: itemsPerPage
      })
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    handleSearch()
  }

  const contentTypes = [
    { value: '', label: 'All Types' },
    { value: 'structure', label: 'Structures' },
    { value: 'process', label: 'Processes' },
    { value: 'algorithm', label: 'Algorithms' },
    { value: 'hierarchy', label: 'Hierarchies' },
    { value: 'comparison', label: 'Comparisons' }
  ]

  const complexities = [
    { value: '', label: 'All Levels' },
    { value: 'basic', label: 'Basic' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ]

  const sortOptions = [
    { value: 'popularity', label: 'Most Popular' },
    { value: 'recent', label: 'Recently Added' },
    { value: 'rating', label: 'Highest Rated' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-5 h-5 text-gray-400" />
              <form onSubmit={handleSearchSubmit} className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics, content, or explore..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </form>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {viewMode === 'grid' ? (
                <List className="w-5 h-5 text-gray-600" />
              ) : (
                <Grid className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-900">Filters</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Content Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {contentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Complexity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Complexity</label>
              <select
                value={filters.complexity}
                onChange={(e) => handleFilterChange('complexity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {complexities.map(comp => (
                  <option key={comp.value} value={comp.value}>
                    {comp.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Search Results for "{searchQuery}"
            </h2>
            
            {searchLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {searchResults.map((topic, index) => (
                  <motion.div
                    key={topic.topicId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <TopicCard topic={topic} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-600 mb-4">No results found for "{searchQuery}"</div>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}

        {/* Popular Topics */}
        {!searchQuery && (
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Popular Topics</h2>
            </div>
            
            {popularTopics.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {popularTopics.map((topic, index) => (
                  <motion.div
                    key={topic.topicId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <TopicCard topic={topic} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-600 mb-4">No popular topics available</div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-4 bg-white rounded-lg shadow-md p-6">
            <BookOpen className="w-6 h-6 text-primary-600" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Can't find what you're looking for?</h3>
              <p className="text-gray-600">Try searching for popular topics or explore our content types</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchPage
