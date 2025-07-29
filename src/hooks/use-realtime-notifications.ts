'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { RealtimeNotificationEvent } from '@/lib/notification-realtime'

interface UseRealtimeNotificationsOptions {
  onNotification?: (notification: Record<string, unknown>) => void
  onUnreadCountUpdate?: (count: number) => void
  onConnectionStatusChange?: (connected: boolean) => void
  enablePollingFallback?: boolean
  pollingInterval?: number
}

export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [usePolling, setUsePolling] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const lastHeartbeatRef = useRef<number>(Date.now())
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const maxReconnectAttempts = 5
  const heartbeatTimeout = 60000 // 60 seconds

  const { 
    onNotification, 
    onUnreadCountUpdate, 
    onConnectionStatusChange,
    enablePollingFallback = true,
    pollingInterval = 30000 // 30 seconds
  } = options

  // Health check for SSE connection
  const startHealthCheck = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current)
    }
    
    healthCheckIntervalRef.current = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current
      if (timeSinceLastHeartbeat > heartbeatTimeout && isConnected) {
        console.log('[SSE CLIENT DEBUG] Heartbeat timeout detected, connection may be stale')
        setConnectionError('Connection timeout - switching to polling')
        if (enablePollingFallback) {
          setUsePolling(true)
          setIsConnected(false)
          onConnectionStatusChange?.(false)
        }
      }
    }, 30000) // Check every 30 seconds
  }, [isConnected, enablePollingFallback, onConnectionStatusChange])

  // Polling fallback
  const startPolling = useCallback(() => {
    if (!enablePollingFallback || pollingTimeoutRef.current) return
    
    console.log('[SSE CLIENT DEBUG] Starting polling fallback')
    const poll = async () => {
      try {
        const response = await fetch('/api/notifications?limit=5')
        if (response.ok) {
          const data = await response.json()
          if (data.unreadCount !== undefined) {
            onUnreadCountUpdate?.(data.unreadCount)
          }
        }
      } catch (error) {
        console.error('[SSE CLIENT DEBUG] Polling error:', error)
      }
      
      if (usePolling) {
        pollingTimeoutRef.current = setTimeout(poll, pollingInterval)
      }
    }
    
    poll()
  }, [usePolling, enablePollingFallback, pollingInterval, onUnreadCountUpdate])

  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
      console.log('[SSE CLIENT DEBUG] Stopped polling fallback')
    }
  }, [])

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log('[SSE CLIENT DEBUG] Connection already open, skipping connect')
      return // Already connected
    }

    // Stop polling if we're trying SSE again
    if (usePolling) {
      stopPolling()
      setUsePolling(false)
    }

    try {
      console.log('[SSE CLIENT DEBUG] Creating new EventSource connection')
      const eventSource = new EventSource('/api/notifications/stream')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('[SSE CLIENT DEBUG] EventSource connection opened')
        setIsConnected(true)
        setConnectionError(null)
        setUsePolling(false)
        reconnectAttemptsRef.current = 0
        lastHeartbeatRef.current = Date.now()
        onConnectionStatusChange?.(true)
        startHealthCheck()
      }

      eventSource.onmessage = (event) => {
        try {
          const data: RealtimeNotificationEvent = JSON.parse(event.data)
          console.log('[SSE CLIENT DEBUG] Received SSE event:', data.type, data)
          
          switch (data.type) {
            case 'connected':
              console.log('[SSE CLIENT DEBUG] SSE connected at:', data.timestamp)
              lastHeartbeatRef.current = Date.now()
              break
            case 'heartbeat':
              console.log('[SSE CLIENT DEBUG] Received heartbeat at:', data.timestamp)
              lastHeartbeatRef.current = Date.now()
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
            console.log('[SSE CLIENT DEBUG] Max reconnect attempts reached, switching to polling')
            setConnectionError('SSE failed. Using polling fallback.')
            if (enablePollingFallback) {
              setUsePolling(true)
              startPolling()
            }
          }
        }
      }
    } catch (error) {
      console.error('[SSE CLIENT DEBUG] Error creating SSE connection:', error)
      setConnectionError('Failed to establish real-time connection')
      if (enablePollingFallback) {
        console.log('[SSE CLIENT DEBUG] Falling back to polling due to SSE creation error')
        setUsePolling(true)
        startPolling()
      }
    }
  }, [onNotification, onUnreadCountUpdate, onConnectionStatusChange, usePolling, stopPolling, startHealthCheck, enablePollingFallback, startPolling])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current)
      healthCheckIntervalRef.current = null
    }
    stopPolling()
    setIsConnected(false)
    setUsePolling(false)
    onConnectionStatusChange?.(false)
  }, [onConnectionStatusChange, stopPolling])

  // Connect on mount
  useEffect(() => {
    connect()
    
    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Start polling if needed
  useEffect(() => {
    if (usePolling) {
      startPolling()
    } else {
      stopPolling()
    }
  }, [usePolling, startPolling, stopPolling])

  // Handle page visibility changes to manage connections
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, don't disconnect but reduce activity
      } else {
        // Page is visible, ensure connection is active
        if (!isConnected && !usePolling && reconnectAttemptsRef.current < maxReconnectAttempts) {
          connect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isConnected, usePolling, connect])

  return {
    isConnected: isConnected || usePolling, // Show as connected if either SSE or polling is active
    connectionError: usePolling ? 'Using polling fallback' : connectionError,
    connect,
    disconnect,
    usePolling,
  }
}