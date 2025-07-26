'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, CheckCircle, UserPlus, UserMinus, MessageSquare, AtSign, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (notificationId: string) => void
  onNavigate?: () => void
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'ticket_assigned':
      return <UserPlus className="h-4 w-4 text-green-600" />
    case 'ticket_unassigned':
      return <UserMinus className="h-4 w-4 text-orange-600" />
    case 'comment_added':
      return <MessageSquare className="h-4 w-4 text-blue-600" />
    case 'mentioned_in_comment':
      return <AtSign className="h-4 w-4 text-purple-600" />
    default:
      return <Bell className="h-4 w-4 text-gray-600" />
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'ticket_assigned':
      return 'border-l-green-500'
    case 'ticket_unassigned':
      return 'border-l-orange-500'
    case 'comment_added':
      return 'border-l-blue-500'
    default:
      return 'border-l-gray-500'
  }
}

export default function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onNavigate 
}: NotificationItemProps) {
  const router = useRouter()
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false)

  const handleClick = () => {
    // Mark as read if not already read
    if (!notification.isRead && onMarkAsRead) {
      handleMarkAsRead()
    }

    // Navigate to ticket
    if (notification.ticketId) {
      router.push(`/dashboard/tickets/${notification.ticketId}`)
      onNavigate?.()
    }
  }

  const handleMarkAsRead = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }

    if (notification.isRead || !onMarkAsRead) return

    setIsMarkingAsRead(true)
    try {
      await onMarkAsRead(notification.id)
    } finally {
      setIsMarkingAsRead(false)
    }
  }

  const getDisplayTicketNumber = () => {
    if (notification.ticket?.ticketNumber) {
      return notification.ticket.ticketNumber
    }
    if (notification.ticketId) {
      return `#${notification.ticketId.slice(-6).toUpperCase()}`
    }
    return null
  }

  return (
    <div
      className={cn(
        "p-4 border-l-4 hover:bg-muted/50 cursor-pointer transition-colors",
        getNotificationColor(notification.type),
        !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn(
              "text-sm font-medium truncate",
              !notification.isRead && "font-semibold"
            )}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
              {!notification.isRead && onMarkAsRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-transparent"
                  onClick={handleMarkAsRead}
                  disabled={isMarkingAsRead}
                  title="Mark as read"
                >
                  {isMarkingAsRead ? (
                    <div className="h-3 w-3 animate-spin border border-current border-t-transparent rounded-full" />
                  ) : (
                    <CheckCircle className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {notification.actor && (
                <>
                  <span>by {notification.actor.name}</span>
                  <span>•</span>
                </>
              )}
              <time dateTime={new Date(notification.createdAt).toISOString()}>
                {format(new Date(notification.createdAt), 'MMM d, HH:mm')}
              </time>
            </div>
            
            {notification.ticketId && (
              <div className="flex items-center gap-1">
                {getDisplayTicketNumber() && (
                  <Badge variant="outline" className="text-xs">
                    {getDisplayTicketNumber()}
                  </Badge>
                )}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
