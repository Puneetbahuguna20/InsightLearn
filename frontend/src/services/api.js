import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance with default configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime
    
    // Log successful requests in development
    if (import.meta.env.DEV) {
      console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
    }
    
    return response
  },
  (error) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token')
          toast.error('Session expired. Please log in again.')
          // You might want to redirect to login page here
          break
          
        case 429:
          // Rate limit exceeded
          toast.error(data.error || 'Too many requests. Please try again later.')
          break
          
        case 500:
          // Server error
          toast.error(data.error || 'Server error. Please try again later.')
          break
          
        case 503:
          // Service unavailable
          toast.error(data.error || 'Service temporarily unavailable. Please try again later.')
          break
          
        default:
          // Other errors
          toast.error(data.error || 'An error occurred. Please try again.')
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.')
    } else {
      // Other error
      toast.error('An unexpected error occurred.')
    }
    
    return Promise.reject(error)
  }
)

// API methods
export default {
  // Topics
  getTopics: (params) => api.get('/topics', { params }),
  getTopic: (id) => api.get(`/topics/${id}`),
  createTopic: (data) => api.post('/topics', data),
  updateTopic: (id, data) => api.put(`/topics/${id}`, data),
  deleteTopic: (id) => api.delete(`/topics/${id}`),
  classifyTopic: (data) => api.post('/topics/classify', data),
  getPopularTopics: (params) => api.get('/topics/popular', { params }),
  getTopicsByType: (type, params) => api.get(`/topics/type/${type}`, { params }),
  getSimilarTopics: (id, params) => api.get(`/topics/${id}/similar`, { params }),
  rateTopic: (id, data) => api.post(`/topics/${id}/rate`, data),
  
  // Content
  getContent: (id, params) => api.get(`/content/${id}`, { params }),
  getStepContent: (id, stepIndex) => api.get(`/content/${id}/step/${stepIndex}`),
  generateContent: (id, data) => api.post(`/content/${id}/generate`, data),
  regenerateContent: (id, data) => api.post(`/content/${id}/regenerate`, data),
  updateContent: (id, data) => api.put(`/content/${id}`, data),
  deleteContent: (id) => api.delete(`/content/${id}`),
  addContentFeedback: (id, data) => api.post(`/content/${id}/feedback`, data),
  getPopularContent: (params) => api.get('/content/popular', { params }),
  getContentByType: (type, params) => api.get(`/content/type/${type}`, { params }),
  searchContent: (params) => api.get('/content/search', { params }),
  getContentStats: (id) => api.get(`/content/${id}/stats`),
  
  // Images
  getImage: (id) => api.get(`/images/${id}`),
  getImageRegions: (id) => api.get(`/images/${id}/regions`),
  generateImage: (data) => api.post('/images/generate', data),
  addImageRegion: (id, data) => api.post(`/images/${id}/regions`, data),
  updateImageRegion: (id, regionId, data) => api.put(`/images/${id}/regions/${regionId}`, data),
  removeImageRegion: (id, regionId) => api.delete(`/images/${id}/regions/${regionId}`),
  trackRegionClick: (id, data) => api.post(`/images/${id}/click`, data),
  getTopicImages: (id, params) => api.get(`/images/topic/${id}`, { params }),
  getContentImages: (id, params) => api.get(`/images/content/${id}`, { params }),
  getPopularImages: (params) => api.get('/images/popular', { params }),
  deleteImage: (id) => api.delete(`/images/${id}`),
  getImageStats: (params) => api.get('/images/stats', { params }),
  
  // Health
  getHealth: () => api.get('/health'),
  getDetailedHealth: () => api.get('/health/detailed'),

  // AI Workflow
  getLanguages: () => api.get('/languages'),
  analyzeQuery: (data) => api.post('/nlp/analyze', data),
  generateContent: (data) => api.post('/ai/generate', data),
  getComponentDetails: (data) => api.post('/diagram/component-details', data),
  learnQuery: (data) => api.post('/learn/query', data),
  saveGeneratedContent: (data) => api.post('/content/save-generated', data),
  
  // Utility methods
  get: api.get,
  post: api.post,
  put: api.put,
  delete: api.delete,
  patch: api.patch,
}
