import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useInsightStore = create(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      // Language Selection (Step 2)
      language: 'en',
      languages: [
        { code: 'en', name: 'English', flag: '🇺🇸', active: true },
        { code: 'hi', name: 'Hindi', flag: '🇮🇳', active: true },
        { code: 'es', name: 'Spanish', flag: '🇪🇸', active: true },
        { code: 'fr', name: 'French', flag: '🇫🇷', active: true },
        { code: 'de', name: 'German', flag: '🇩🇪', active: true },
        { code: 'zh', name: 'Chinese', flag: '🇨🇳', active: true },
        { code: 'ja', name: 'Japanese', flag: '🇯🇵', active: true },
        { code: 'ar', name: 'Arabic', flag: '🇸🇦', active: true }
      ],
      setLanguage: (code) => set({ language: code }),

      // AI Workflow State
      currentQuery: null,
      aiResult: null,
      isProcessing: false,
      setCurrentQuery: (query) => set({ currentQuery: query }),
      setAIResult: (result) => set({ aiResult: result }),
      setIsProcessing: (processing) => set({ isProcessing: processing }),

      // User
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),

      // Navigation
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      currentPage: 'dashboard',
      setCurrentPage: (page) => set({ currentPage: page }),
      historyRefreshTrigger: 0,
      triggerHistoryRefresh: () => set((state) => ({ historyRefreshTrigger: state.historyRefreshTrigger + 1 })),

      // Learning
      currentTopic: null,
      learningProgress: {},
      setCurrentTopic: (topic) => set({ currentTopic: topic }),
      updateProgress: (topicId, progress) => set((state) => ({
        learningProgress: { ...state.learningProgress, [topicId]: progress }
      })),

      // Quiz
      quizHistory: [],
      addQuizResult: (result) => set((state) => ({
        quizHistory: [result, ...state.quizHistory]
      })),

      // Chat
      chatHistory: [],
      addMessage: (message) => set((state) => ({
        chatHistory: [...state.chatHistory, message]
      })),
      clearChat: () => set({ chatHistory: [] }),

      // Revision
      flashcards: [],
      currentCardIndex: 0,
      setFlashcards: (cards) => set({ flashcards: cards, currentCardIndex: 0 }),
      nextCard: () => set((state) => ({
        currentCardIndex: (state.currentCardIndex + 1) % state.flashcards.length
      })),
      prevCard: () => set((state) => ({
        currentCardIndex: state.currentCardIndex === 0 
          ? state.flashcards.length - 1 
          : state.currentCardIndex - 1
      })),

      // Notifications
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [{ id: Date.now(), ...notification }, ...state.notifications]
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      })),
    }),
    {
      name: 'insight-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        learningProgress: state.learningProgress,
        quizHistory: state.quizHistory,
      }),
    }
  )
)
