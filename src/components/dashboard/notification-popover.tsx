'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Bell, Loader2 } from 'lucide-react'
import NotificationCenter from './notification-center'
import { useNotificationStream } from '@/hooks/use-notification-stream'

export default function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Fetch initial unread count with retry mechanism
  const fetchUnreadCount = async (retryCount = 0) => {
    try {
      console.log('Fetching unread count... (attempt', retryCount + 1, ')')
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        const count = data.count || 0
        console.log('Fetched unread count:', count)
        setUnreadCount(count)
        setIsInitialLoading(false)
      } else {
        console.error('Failed to fetch unread count:', response.status, response.statusText)
        
        // Retry up to 3 times with increasing delay
        if (retryCount < 3) {
          const delay = (retryCount + 1) * 1000 // 1s, 2s, 3s
          console.log(`Retrying in ${delay}ms...`)
          setTimeout(() => fetchUnreadCount(retryCount + 1), delay)
        } else {
          setIsInitialLoading(false)
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
      
      // Retry up to 3 times with increasing delay
      if (retryCount < 3) {
        const delay = (retryCount + 1) * 1000 // 1s, 2s, 3s
        console.log(`Retrying in ${delay}ms...`)
        setTimeout(() => fetchUnreadCount(retryCount + 1), delay)
      } else {
        setIsInitialLoading(false)
      }
    }
  }

  // Set up real-time notification stream
  const { isConnected } = useNotificationStream({
    onUnreadCountChanged: (count) => {
      console.log('SSE: Unread count changed to:', count)
      setUnreadCount(count)
    },
    onConnectionStatusChange: (connected) => {
      console.log('Notification stream connection status:', connected)
      // If SSE just connected and we haven't loaded initial count yet, fetch it
      if (connected && isInitialLoading) {
        console.log('SSE connected during initial loading, fetching unread count')
        fetchUnreadCount(0)
      }
    }
  })

  // Fetch unread count on mount
  useEffect(() => {
    console.log('NotificationPopover mounted, fetching initial unread count')
    fetchUnreadCount(0)
  }, [])

  // Also fetch when popover opens (force refresh)
  useEffect(() => {
    if (isOpen) {
      console.log('Popover opened, refreshing unread count')
      fetchUnreadCount(0)
    }
  }, [isOpen])

  // Fallback polling when SSE is not connected (every 30 seconds)
  useEffect(() => {
    if (!isConnected) {
      console.log('SSE not connected, setting up fallback polling')
      const interval = setInterval(() => {
        console.log('Fallback polling: fetching unread count')
        fetchUnreadCount(0)
      }, 30000)
      return () => {
        console.log('Clearing fallback polling interval')
        clearInterval(interval)
      }
    }
  }, [isConnected])

  // Additional polling as a safety net (every 60 seconds regardless of SSE status)
  useEffect(() => {
    const safetyInterval = setInterval(() => {
      console.log('Safety polling: fetching unread count')
      fetchUnreadCount(0)
    }, 60000)
    
    return () => clearInterval(safetyInterval)
  }, [])

  // Handle unread count changes from NotificationCenter
  const handleUnreadCountChange = (newCount: number) => {
    setUnreadCount(newCount)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative hover:bg-muted rounded-md h-9 w-9 p-0"
        >
          {isInitialLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && !isInitialLoading && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 max-h-[80vh] overflow-hidden" align="end" side="bottom" sideOffset={8}>
        <NotificationCenter 
          onClose={() => setIsOpen(false)} 
          onUnreadCountChange={handleUnreadCountChange}
        />
      </PopoverContent>
    </Popover>
  )
}
