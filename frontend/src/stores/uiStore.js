import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const useUIStore = create(
  devtools(
    persist(
      (set, get) => ({
        // Theme
        theme: 'light',
        
        // Sidebar
        sidebarOpen: true,
        
        // Modal states
        topicModalOpen: false,
        settingsModalOpen: false,
        helpModalOpen: false,
        
        // Loading states
        globalLoading: false,
        
        // Notifications
        notifications: [],
        
        // View preferences
        viewMode: 'grid', // grid, list
        itemsPerPage: 12,
        
        // Content preferences
        autoGenerateContent: true,
        showStepNumbers: true,
        enableAnimations: true,
        
        // Actions
        setTheme: (theme) => set({ theme }),
        
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        
        openTopicModal: () => set({ topicModalOpen: true }),
        
        closeTopicModal: () => set({ topicModalOpen: false }),
        
        openSettingsModal: () => set({ settingsModalOpen: true }),
        
        closeSettingsModal: () => set({ settingsModalOpen: false }),
        
        openHelpModal: () => set({ helpModalOpen: true }),
        
        closeHelpModal: () => set({ helpModalOpen: false }),
        
        setGlobalLoading: (loading) => set({ globalLoading: loading }),
        
        addNotification: (notification) => {
          const id = Date.now().toString()
          const newNotification = { ...notification, id }
          
          set((state) => ({
            notifications: [...state.notifications, newNotification]
          }))
          
          // Auto-remove notification after duration
          if (notification.autoRemove !== false) {
            setTimeout(() => {
              get().removeNotification(id)
            }, notification.duration || 5000)
          }
          
          return id
        },
        
        removeNotification: (id) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }))
        },
        
        clearNotifications: () => set({ notifications: [] }),
        
        setViewMode: (mode) => set({ viewMode: mode }),
        
        setItemsPerPage: (count) => set({ itemsPerPage: count }),
        
        setAutoGenerateContent: (enabled) => set({ autoGenerateContent: enabled }),
        
        setShowStepNumbers: (show) => set({ showStepNumbers: show }),
        
        setEnableAnimations: (enabled) => set({ enableAnimations: enabled }),
        
        // Utility actions
        showSuccess: (message, options = {}) => {
          return get().addNotification({
            type: 'success',
            message,
            ...options
          })
        },
        
        showError: (message, options = {}) => {
          return get().addNotification({
            type: 'error',
            message,
            ...options
          })
        },
        
        showInfo: (message, options = {}) => {
          return get().addNotification({
            type: 'info',
            message,
            ...options
          })
        },
        
        showWarning: (message, options = {}) => {
          return get().addNotification({
            type: 'warning',
            message,
            ...options
          })
        }
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          viewMode: state.viewMode,
          itemsPerPage: state.itemsPerPage,
          autoGenerateContent: state.autoGenerateContent,
          showStepNumbers: state.showStepNumbers,
          enableAnimations: state.enableAnimations
        })
      }
    ),
    {
      name: 'ui-store',
    }
  )
)

export default useUIStore
