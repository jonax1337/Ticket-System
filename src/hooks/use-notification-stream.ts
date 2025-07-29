'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface NotificationStreamData {
  type: 'connected' | 'ping' | 'notification_created' | 'notification_read' | 'unread_count_changed'
  data?: object
  timestamp: string
}

interface UseNotificationStreamOptions {
  onNotificationCreated?: (notification: Notification) => void
  onNotificationRead?: (notificationId: string) => void
  onUnreadCountChanged?: (count: number) => void
  onConnectionStatusChange?: (connected: boolean) => void
}

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

export function useNotificationStream(options: UseNotificationStreamOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastPing, setLastPing] = useState<Date | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000 // 1 second

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    // Don't create multiple connections
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return
    }

    cleanup()

    try {
      const eventSource = new EventSource('/api/notifications/stream')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('SSE connection opened')
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        options.onConnectionStatusChange?.(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data: NotificationStreamData = JSON.parse(event.data)
          
          switch (data.type) {
            case 'connected':
              console.log('SSE connected:', data)
              break
            case 'ping':
              setLastPing(new Date())
              break
            case 'notification_created':
              if (data.data && typeof data.data === 'object' && 'notification' in data.data) {
                options.onNotificationCreated?.(data.data.notification as Notification)
              }
              break
            case 'notification_read':
              if (data.data && typeof data.data === 'object' && 'notificationId' in data.data) {
                options.onNotificationRead?.(data.data.notificationId as string)
              }
              break
            case 'unread_count_changed':
              if (data.data && typeof data.data === 'object' && 'unreadCount' in data.data) {
                options.onUnreadCountChanged?.(data.data.unreadCount as number)
              }
              break
            default:
              console.log('Unknown SSE message type:', data.type)
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        setIsConnected(false)
        options.onConnectionStatusChange?.(false)
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current)
          console.log(`Attempting to reconnect SSE in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        } else {
          console.log('Max reconnection attempts reached, giving up SSE connection')
        }
      }
    } catch (error) {
      console.error('Error creating SSE connection:', error)
      setIsConnected(false)
      options.onConnectionStatusChange?.(false)
    }
  }, [cleanup, options])

  const disconnect = useCallback(() => {
    cleanup()
    setIsConnected(false)
    setLastPing(null)
    options.onConnectionStatusChange?.(false)
  }, [cleanup, options])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  // Auto-connect on mount and cleanup on unmount
  useEffect(() => {
    connect()
    return cleanup
  }, [connect, cleanup])

  // Detect if connection is stale (no ping for 60 seconds)
  useEffect(() => {
    if (!isConnected || !lastPing) return

    const staleCheckInterval = setInterval(() => {
      const now = new Date()
      const timeSinceLastPing = now.getTime() - lastPing.getTime()
      
      // If no ping for 60 seconds, consider connection stale
      if (timeSinceLastPing > 60000) {
        console.log('SSE connection appears stale, reconnecting...')
        reconnect()
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(staleCheckInterval)
  }, [isConnected, lastPing, reconnect])

  return {
    isConnected,
    lastPing,
    connect,
    disconnect,
    reconnect,
  }
}