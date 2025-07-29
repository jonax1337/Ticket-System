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
      console.log('[SSE CLIENT DEBUG] Connection already open, skipping connect')
      return // Already connected
    }

    try {
      console.log('[SSE CLIENT DEBUG] Creating new EventSource connection')
      const eventSource = new EventSource('/api/notifications/stream')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('[SSE CLIENT DEBUG] EventSource connection opened')
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttemptsRef.current = 0
        onConnectionStatusChange?.(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data: RealtimeNotificationEvent = JSON.parse(event.data)
          console.log('[SSE CLIENT DEBUG] Received SSE event:', data.type, data)
          
          switch (data.type) {
            case 'connected':
              console.log('[SSE CLIENT DEBUG] SSE connected at:', data.timestamp)
              break
            case 'heartbeat':
              console.log('[SSE CLIENT DEBUG] Received heartbeat at:', data.timestamp)
              // Keep connection alive
              break
            case 'notification':
              console.log('[SSE CLIENT DEBUG] Received notification:', data.data)
              if (data.data) {
                onNotification?.(data.data)
              }
              break
            case 'unread_count':
              console.log('[SSE CLIENT DEBUG] Received unread count update:', data.data)
              if (data.data && typeof data.data === 'object' && 'count' in data.data) {
                onUnreadCountUpdate?.(data.data.count as number)
              }
              break
            default:
              console.log('[SSE CLIENT DEBUG] Unknown SSE event type:', data.type)
          }
        } catch (error) {
          console.error('[SSE CLIENT DEBUG] Error parsing SSE data:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('[SSE CLIENT DEBUG] SSE connection error:', error)
        console.log('[SSE CLIENT DEBUG] EventSource readyState:', eventSource.readyState)
        setIsConnected(false)
        onConnectionStatusChange?.(false)
        
        if (eventSource.readyState === EventSource.CLOSED) {
          // Connection lost, attempt to reconnect
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000) // Exponential backoff
            console.log(`[SSE CLIENT DEBUG] Attempting reconnect ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts} in ${delay}ms`)
            setConnectionError(`Connection lost. Reconnecting in ${Math.ceil(delay / 1000)}s...`)
            
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++
              connect()
            }, delay)
          } else {
            console.log('[SSE CLIENT DEBUG] Max reconnect attempts reached')
            setConnectionError('Failed to connect after multiple attempts. Please refresh the page.')
          }
        }
      }
    } catch (error) {
      console.error('[SSE CLIENT DEBUG] Error creating SSE connection:', error)
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