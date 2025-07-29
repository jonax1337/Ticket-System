'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Bell } from 'lucide-react'
import NotificationCenter from './notification-center'
import { useNotificationStream } from '@/hooks/use-notification-stream'

export default function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch initial unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  // Set up real-time notification stream
  const { isConnected } = useNotificationStream({
    onUnreadCountChanged: (count) => {
      setUnreadCount(count)
    },
    onConnectionStatusChange: (connected) => {
      console.log('Notification stream connection status:', connected)
    }
  })

  // Fetch unread count on mount and when popover opens
  useEffect(() => {
    fetchUnreadCount()
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchUnreadCount()
    }
  }, [isOpen])

  // Fallback polling when SSE is not connected (every 30 seconds)
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

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
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
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
