'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Bell, CheckCheck, RefreshCw, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import NotificationItem from './notification-item'
import { useNotificationStream } from '@/hooks/use-notification-stream'

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
  } | null // Can be null for external users
  ticket?: {
    id: string
    ticketNumber?: string | null
    subject: string
  } | null
}

interface NotificationCenterProps {
  onClose?: () => void
  onUnreadCountChange?: (count: number) => void
}

export default function NotificationCenter({ onClose, onUnreadCountChange }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false)
  const [showUnreadOnly, setShowUnreadOnly] = useState(() => {
    // Load filter preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notificationFilter')
      return saved === 'unread'
    }
    return false
  })

  // Set up real-time notification stream
  const { isConnected } = useNotificationStream({
    onNotificationCreated: (notification) => {
      // Add new notification to the list
      setNotifications(prev => [notification, ...prev])
      
      // Update unread count if the notification is unread
      if (!notification.isRead) {
        const newUnreadCount = unreadCount + 1
        setUnreadCount(newUnreadCount)
        if (onUnreadCountChange) {
          onUnreadCountChange(newUnreadCount)
        }
      }
    },
    onUnreadCountChanged: (count) => {
      setUnreadCount(count)
      if (onUnreadCountChange) {
        onUnreadCountChange(count)
      }
    }
  })

  // Fetch notifications
  const fetchNotifications = async (unreadOnly = false) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/notifications?unreadOnly=${unreadOnly}&limit=50`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      )
      
      const newUnreadCount = Math.max(0, unreadCount - 1)
      setUnreadCount(newUnreadCount)
      
      // Notify parent component
      if (onUnreadCountChange) {
        onUnreadCountChange(newUnreadCount)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (unreadCount === 0) return

    setIsMarkingAllAsRead(true)
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      )
      setUnreadCount(0)
      
      // Notify parent component
      if (onUnreadCountChange) {
        onUnreadCountChange(0)
      }
      
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
    } finally {
      setIsMarkingAllAsRead(false)
    }
  }

  // Refresh notifications
  const refreshNotifications = () => {
    fetchNotifications(showUnreadOnly)
  }

  // Toggle unread only filter
  const toggleUnreadOnly = () => {
    const newShowUnreadOnly = !showUnreadOnly
    setShowUnreadOnly(newShowUnreadOnly)
    fetchNotifications(newShowUnreadOnly)
    
    // Save filter preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationFilter', newShowUnreadOnly ? 'unread' : 'all')
    }
  }

  // Initial load
  useEffect(() => {
    fetchNotifications(showUnreadOnly)
  }, [])

  // Auto-refresh notifications as fallback when SSE is not connected (reduced frequency)
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(() => {
        fetchNotifications(showUnreadOnly)
      }, 60000) // Reduced to 60 seconds when SSE is available as fallback

      return () => clearInterval(interval)
    }
  }, [showUnreadOnly, isConnected])

  // Also refresh when filter changes
  useEffect(() => {
    fetchNotifications(showUnreadOnly)
  }, [showUnreadOnly])

  const displayedNotifications = showUnreadOnly 
    ? notifications.filter(n => !n.isRead)
    : notifications

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold text-base">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshNotifications}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={showUnreadOnly ? "default" : "outline"}
            size="sm"
            onClick={toggleUnreadOnly}
            disabled={isLoading}
          >
            {showUnreadOnly ? "Show All" : "Unread Only"}
          </Button>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={isMarkingAllAsRead || isLoading}
            >
              {isMarkingAllAsRead ? (
                <div className="h-4 w-4 animate-spin border border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Silent loading indicator */}
        {isLoading && displayedNotifications.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 px-4">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Updating notifications...</span>
          </div>
        )}
        
        {displayedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            {isLoading ? (
              <>
                <div className="h-6 w-6 animate-spin border-2 border-current border-t-transparent rounded-full mb-3" />
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Loading notifications...</h4>
                <p className="text-xs text-muted-foreground">Please wait while we fetch your notifications</p>
              </>
            ) : (
              <>
                <Inbox className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {showUnreadOnly 
                    ? 'All caught up! Check back later for new updates.'
                    : 'When you receive ticket updates, they\'ll appear here'
                  }
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="h-[320px] overflow-y-auto scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-500">
            <div className="divide-y">
              {displayedNotifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onNavigate={onClose}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {displayedNotifications.length > 0 && (
        <div className="border-t p-3 flex-shrink-0 bg-muted/20">
          <p className="text-xs text-muted-foreground text-center">
            Showing {displayedNotifications.length} of {notifications.length} notifications
          </p>
        </div>
      )}
    </div>
  )
}
