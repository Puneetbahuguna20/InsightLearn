import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import useUIStore from '../stores/uiStore'

const notificationIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const notificationColors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
}

const NotificationContainer = ({ notifications }) => {
  const { removeNotification } = useUIStore()

  useEffect(() => {
    // Auto-remove notifications with duration
    notifications.forEach(notification => {
      if (notification.duration) {
        setTimeout(() => {
          removeNotification(notification.id)
        }, notification.duration)
      }
    })
  }, [notifications, removeNotification])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = notificationIcons[notification.type] || Info
          const colorClass = notificationColors[notification.type] || notificationColors.info
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`
                flex items-start space-x-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
                ${colorClass}
                ${notification.className || ''}
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              
              <div className="flex-1 min-w-0">
                {notification.title && (
                  <h4 className="font-semibold text-sm mb-1">
                    {notification.title}
                  </h4>
                )}
                <p className="text-sm leading-relaxed">
                  {notification.message}
                </p>
                {notification.actions && (
                  <div className="mt-2 flex space-x-2">
                    {notification.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.onClick}
                        className="text-xs font-medium underline hover:no-underline focus:outline-none"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Close button */}
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default NotificationContainer
