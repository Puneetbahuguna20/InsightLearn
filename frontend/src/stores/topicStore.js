import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import api from '../services/api'

const useTopicStore = create(
  devtools(
    (set, get) => ({
      // State
      currentTopic: null,
      classification: null,
      content: null,
      currentStep: 0,
      isLoading: false,
      error: null,
      
      // Related topics
      similarTopics: [],
      popularTopics: [],
      
      // Search results
      searchResults: [],
      searchLoading: false,
      
      // Actions
      setTopic: (topic) => set({ currentTopic: topic }),
      
      setClassification: (classification) => set({ classification }),
      
      setContent: (content) => set({ content }),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      reset: () => set({
        currentTopic: null,
        classification: null,
        content: null,
        currentStep: 0,
        isLoading: false,
        error: null
      }),
      
      // API Actions
      classifyTopic: async (topic, userId = null) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post('/topics/classify', { topic, userId })
          const classification = response.data.data
          
          set({ 
            classification,
            isLoading: false 
          })
          
          return classification
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to classify topic'
          set({ 
            error: errorMessage,
            isLoading: false 
          })
          throw error
        }
      },
      
      createTopic: async (topicData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post('/topics', topicData)
          const topic = response.data.data
          
          set({ 
            currentTopic: topic,
            classification: topic.classification,
            isLoading: false 
          })
          
          return topic
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to create topic'
          set({ 
            error: errorMessage,
            isLoading: false 
          })
          throw error
        }
      },
      
      generateContent: async (topicId, options = {}) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.post(`/content/${topicId}/generate`, options)
          const content = response.data.data.content
          
          set({ 
            content,
            currentStep: 0,
            isLoading: false 
          })
          
          return content
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to generate content'
          set({ 
            error: errorMessage,
            isLoading: false 
          })
          throw error
        }
      },
      
      getContent: async (topicId, stepIndex = null) => {
        set({ isLoading: true, error: null })
        
        try {
          const url = stepIndex !== null 
            ? `/content/${topicId}/step/${stepIndex}`
            : `/content/${topicId}`
          
          const response = await api.get(url)
          const content = response.data.data
          
          set({ 
            content,
            currentStep: stepIndex || 0,
            isLoading: false 
          })
          
          return content
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to get content'
          set({ 
            error: errorMessage,
            isLoading: false 
          })
          throw error
        }
      },
      
      navigateStep: (direction) => {
        const { content, currentStep } = get()
        
        if (!content || !content.data.steps) return
        
        let newStep
        if (direction === 'next') {
          newStep = Math.min(currentStep + 1, content.data.steps.length - 1)
        } else if (direction === 'prev') {
          newStep = Math.max(currentStep - 1, 0)
        } else {
          return
        }
        
        set({ currentStep: newStep })
      },
      
      goToStep: (stepIndex) => {
        const { content } = get()
        
        if (!content || !content.data.steps || stepIndex < 0 || stepIndex >= content.data.steps.length) {
          return
        }
        
        set({ currentStep: stepIndex })
      },
      
      searchTopics: async (searchParams) => {
        set({ searchLoading: true, error: null })
        
        try {
          const response = await api.get('/topics', { params: searchParams })
          const searchResults = response.data.data.topics
          
          set({ 
            searchResults,
            searchLoading: false 
          })
          
          return searchResults
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to search topics'
          set({ 
            error: errorMessage,
            searchLoading: false 
          })
          throw error
        }
      },
      
      getPopularTopics: async (limit = 10) => {
        try {
          const response = await api.get('/topics/popular', { params: { limit } })
          const popularTopics = response.data.data.topics
          
          set({ popularTopics })
          
          return popularTopics
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to get popular topics'
          set({ error: errorMessage })
          throw error
        }
      },
      
      getSimilarTopics: async (topicId, limit = 5) => {
        try {
          const response = await api.get(`/topics/${topicId}/similar`, { params: { limit } })
          const similarTopics = response.data.data.similarTopics
          
          set({ similarTopics })
          
          return similarTopics
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to get similar topics'
          set({ error: errorMessage })
          throw error
        }
      },
      
      rateTopic: async (topicId, rating) => {
        try {
          const response = await api.post(`/topics/${topicId}/rate`, { rating })
          
          // Update local topic if it's the current one
          const { currentTopic } = get()
          if (currentTopic && currentTopic.topicId === topicId) {
            set({
              currentTopic: {
                ...currentTopic,
                usage: {
                  ...currentTopic.usage,
                  averageRating: response.data.data.averageRating,
                  ratingCount: response.data.data.ratingCount
                }
              }
            })
          }
          
          return response.data.data
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to rate topic'
          set({ error: errorMessage })
          throw error
        }
      }
    }),
    {
      name: 'topic-store',
    }
  )
)

export default useTopicStore
