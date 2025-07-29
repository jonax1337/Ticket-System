'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Bell } from 'lucide-react'
import NotificationCenter from './notification-center'
import { useNotifications } from '@/components/providers/notification-provider'

export default function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount } = useNotifications()

  // Handle unread count changes from NotificationCenter
  const handleUnreadCountChange = (newCount: number) => {
    // The count is already managed by the context, so this is just for compatibility
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
