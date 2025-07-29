'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { RealtimeNotificationEvent } from '@/lib/notification-realtime'

interface UseRealtimeNotificationsOptions {
  onNotification?: (notification: Record<string, unknown>) => void
  onUnreadCountUpdate?: (count: number) => void
  onConnectionStatusChange?: (connected: boolean) => void
}

export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const { onNotification, onUnreadCountUpdate, onConnectionStatusChange } = options

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return // Already connected
    }

    try {
      const eventSource = new EventSource('/api/notifications/stream')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttemptsRef.current = 0
        onConnectionStatusChange?.(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data: RealtimeNotificationEvent = JSON.parse(event.data)
          
          switch (data.type) {
            case 'connected':
              console.log('SSE connected at:', data.timestamp)
              break
            case 'heartbeat':
              // Keep connection alive
              break
            case 'notification':
              if (data.data) {
                onNotification?.(data.data)
              }
              break
            case 'unread_count':
              if (data.data && typeof data.data === 'object' && 'count' in data.data) {
                onUnreadCountUpdate?.(data.data.count as number)
              }
              break
            default:
              console.log('Unknown SSE event type:', data.type)
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        setIsConnected(false)
        onConnectionStatusChange?.(false)
        
        if (eventSource.readyState === EventSource.CLOSED) {
          // Connection lost, attempt to reconnect
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000) // Exponential backoff
            setConnectionError(`Connection lost. Reconnecting in ${Math.ceil(delay / 1000)}s...`)
            
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++
              connect()
            }, delay)
          } else {
            setConnectionError('Failed to connect after multiple attempts. Please refresh the page.')
          }
        }
      }
    } catch (error) {
      console.error('Error creating SSE connection:', error)
      setConnectionError('Failed to establish real-time connection')
    }
  }, [onNotification, onUnreadCountUpdate, onConnectionStatusChange])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setIsConnected(false)
    onConnectionStatusChange?.(false)
  }, [onConnectionStatusChange])

  // Connect on mount
  useEffect(() => {
    connect()
    
    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Handle page visibility changes to manage connections
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, don't disconnect but reduce activity
      } else {
        // Page is visible, ensure connection is active
        if (!isConnected && reconnectAttemptsRef.current < maxReconnectAttempts) {
          connect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isConnected, connect])

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
  }
}