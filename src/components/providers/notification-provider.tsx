'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  ticketId?: string | null
  commentId?: string | null
  isRead: boolean
  createdAt: Date | string
  actor: {
    id: string
    name: string
    email: string
  } | null
  ticket?: {
    id: string
    ticketNumber?: string | null
    subject: string
  } | null
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isConnected: boolean
  connectionError: string | null
  usePolling: boolean
  refreshNotifications: () => Promise<void>
  markNotificationAsRead: (notificationId: string) => Promise<void>
  markAllNotificationsAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    // Only fetch on client side
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      const response = await fetch('/api/notifications?limit=50')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [])

  // Handle new notification from real-time stream
  const handleNewNotification = useCallback((notificationData: Record<string, unknown>) => {
    // Cast to the expected Notification type since we know the structure
    const notification = notificationData as unknown as Notification
    setNotifications(prev => {
      return [notification, ...prev]
    })
    setUnreadCount(prev => {
      const newCount = prev + 1
      return newCount
    })
    
    // Show toast notification if it's unread and not from the current user
    if (!notification.isRead) {
      toast(notification.title, {
        description: notification.message,
        action: notification.ticketId ? {
          label: 'View Ticket',
          onClick: () => {
            window.location.href = `/dashboard/tickets/${notification.ticketId}`
          }
        } : undefined,
        duration: 5000,
      })
    }
  }, [])

  // Handle unread count updates from real-time stream
  const handleUnreadCountUpdate = useCallback((count: number) => {
    setUnreadCount(count)
  }, [])

  // Handle connection status changes
  const handleConnectionStatusChange = useCallback((connected: boolean) => {
    if (connected) {
      // Refresh notifications when connection is established
      fetchNotifications()
    }
  }, [fetchNotifications])

  // Setup real-time notifications
  const { isConnected, connectionError, usePolling } = useRealtimeNotifications({
    onNotification: handleNewNotification,
    onUnreadCountUpdate: handleUnreadCountUpdate,
    onConnectionStatusChange: handleConnectionStatusChange,
    enablePollingFallback: true,
    pollingInterval: 30000,
  })

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    // Only execute on client side
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }, [])

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    // Only execute on client side
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }, [])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    connectionError,
    usePolling,
    refreshNotifications: fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}