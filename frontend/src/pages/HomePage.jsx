import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Brain, 
  Layers, 
  Clock, 
  Zap, 
  BarChart3,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Search,
  Star
} from 'lucide-react'
import { Link } from 'react-router-dom'
import useUIStore from '../stores/uiStore'
import useTopicStore from '../stores/topicStore'
import TopicInput from '../components/TopicInput'
import LoadingSpinner from '../components/LoadingSpinner'
import TopicCard from '../components/TopicCard'

const HomePage = () => {
  const [topicInput, setTopicInput] = useState('')
  const { showSuccess, showError } = useUIStore()
  const { 
    getPopularTopics, 
    popularTopics, 
    createTopic, 
    isLoading,
    classification,
    currentTopic 
  } = useTopicStore()

  useEffect(() => {
    getPopularTopics(6)
  }, [getPopularTopics])

  const handleTopicSubmit = async (topic) => {
    try {
      const result = await createTopic({ topic })
      showSuccess(`Topic "${topic}" classified as ${result.classification.type}`)
      setTopicInput('')
    } catch (error) {
      showError('Failed to create topic. Please try again.')
    }
  }

  const contentTypes = [
    {
      type: 'structure',
      title: 'Structures',
      description: 'Static labeled diagrams and components',
      icon: Layers,
      color: 'from-blue-500 to-blue-600',
      examples: ['Human heart', 'Computer architecture', 'Solar system']
    },
    {
      type: 'process',
      title: 'Processes',
      description: 'Step-by-step workflows and procedures',
      icon: Clock,
      color: 'from-green-500 to-green-600',
      examples: ['Photosynthesis', 'Digestive system', 'Water cycle']
    },
    {
      type: 'algorithm',
      title: 'Algorithms',
      description: 'Logical execution steps and code',
      icon: Zap,
      color: 'from-purple-500 to-purple-600',
      examples: ['Binary search', 'Sorting algorithms', 'Machine learning']
    },
    {
      type: 'hierarchy',
      title: 'Hierarchies',
      description: 'Tree-based structures and relationships',
      icon: BarChart3,
      color: 'from-orange-500 to-orange-600',
      examples: ['Animal classification', 'Organizational structure', 'Taxonomy']
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative max-w-7xl mx-auto px-6 text-center"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Sparkles className="w-12 h-12 text-primary-600" />
              <h1 className="text-5xl font-bold text-gray-900">
                VisualLearn
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Transform any topic into interactive educational content with AI-powered diagrams, 
              step-by-step explanations, and engaging visualizations.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-12">
            <TopicInput
              onSubmit={handleTopicSubmit}
              placeholder="Enter any topic to start learning..."
              className="max-w-2xl mx-auto"
            />
          </motion.div>

          {/* Current Classification */}
          {classification && currentTopic && (
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center space-x-3 bg-white px-6 py-3 rounded-full shadow-lg border border-gray-200"
            >
              <Brain className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-gray-900">
                Classified as: <span className="text-primary-600 font-semibold">{classification.type}</span>
              </span>
              <Link
                to={`/content/${currentTopic.topicId}`}
                className="inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <span>View Content</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Content Types Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Content Types
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI automatically classifies your topic and generates the perfect educational format
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contentTypes.map((contentType, index) => (
              <motion.div
                key={contentType.type}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative"
              >
                <div className={`h-full p-6 rounded-2xl bg-gradient-to-br ${contentType.color} text-white shadow-lg hover:shadow-xl transition-all duration-300`}>
                  <contentType.icon className="w-8 h-8 mb-4 opacity-90" />
                  <h3 className="text-xl font-bold mb-2">{contentType.title}</h3>
                  <p className="text-white/90 mb-4">{contentType.description}</p>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-white/80">Examples:</div>
                    <div className="flex flex-wrap gap-2">
                      {contentType.examples.map((example, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-white/20 px-2 py-1 rounded-full"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Topics Section */}
      {popularTopics.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center space-x-2 mb-4">
                <TrendingUp className="w-6 h-6 text-primary-600" />
                <h2 className="text-3xl font-bold text-gray-900">
                  Popular Topics
                </h2>
              </div>
              <p className="text-lg text-gray-600">
                See what others are learning about
              </p>
            </motion.div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularTopics.map((topic, index) => (
                  <motion.div
                    key={topic.topicId}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <TopicCard topic={topic} />
                  </motion.div>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <Link
                to="/search"
                className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Search className="w-5 h-5" />
                <span>Explore All Topics</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose VisualLearn?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of educational content creation
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'AI-Powered',
                description: 'Advanced classification and content generation using cutting-edge AI models'
              },
              {
                icon: Sparkles,
                title: 'Interactive',
                description: 'Clickable regions, step navigation, and engaging visualizations'
              },
              {
                icon: BookOpen,
                title: 'Educational',
                description: 'Designed specifically for learning with clear explanations and examples'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
