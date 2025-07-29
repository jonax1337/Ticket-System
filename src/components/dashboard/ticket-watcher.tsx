'use client'

import { useState, useEffect } from 'react'
import { Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { UserAvatar } from '@/components/ui/user-avatar'
import { toast } from 'sonner'

interface Watcher {
  id: string
  userId: string
  createdAt: Date
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
  }
}

interface TicketWatcherProps {
  ticketId: string
  initialWatchers: Watcher[]
  currentUserId: string
  currentUserRole: string
}

export default function TicketWatcher({ 
  ticketId, 
  initialWatchers, 
  currentUserId, 
  currentUserRole 
}: TicketWatcherProps) {
  const [watchers, setWatchers] = useState<Watcher[]>(initialWatchers)
  const [isLoading, setIsLoading] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  // Refresh watchers every 30 seconds when popover is open
  useEffect(() => {
    if (!isPopoverOpen) return

    const refreshWatchers = async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}/watchers`)
        if (response.ok) {
          const updatedWatchers = await response.json()
          setWatchers(updatedWatchers)
        }
      } catch (error) {
        console.error('Error refreshing watchers:', error)
      }
    }

    const interval = setInterval(refreshWatchers, 30000) // 30 seconds
    return () => clearInterval(interval)
  }, [isPopoverOpen, ticketId])

  const isWatching = watchers.some(w => w.user.id === currentUserId)

  const handleToggleWatch = async () => {
    setIsLoading(true)
    try {
      if (isWatching) {
        // Remove current user from watchers
        const response = await fetch(`/api/tickets/${ticketId}/watchers/${currentUserId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          setWatchers(prev => prev.filter(w => w.user.id !== currentUserId))
          toast.success('Stopped watching ticket')
        } else {
          throw new Error('Failed to unwatch ticket')
        }
      } else {
        // Add current user as watcher
        const response = await fetch(`/api/tickets/${ticketId}/watchers`, {
          method: 'POST'
        })
        
        if (response.ok) {
          const newWatcher = await response.json()
          setWatchers(prev => [...prev, newWatcher])
          toast.success('Now watching ticket')
        } else {
          throw new Error('Failed to watch ticket')
        }
      }
    } catch (error) {
      console.error('Error toggling watch status:', error)
      toast.error('Failed to update watch status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveWatcher = async (watcherUserId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/watchers/${watcherUserId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setWatchers(prev => prev.filter(w => w.user.id !== watcherUserId))
        toast.success('Watcher removed')
      } else {
        throw new Error('Failed to remove watcher')
      }
    } catch (error) {
      console.error('Error removing watcher:', error)
      toast.error('Failed to remove watcher')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleWatch}
          disabled={isLoading}
          className="relative"
          onMouseEnter={() => setIsPopoverOpen(true)}
          onMouseLeave={() => {
            // Add a small delay to allow moving mouse to popover
            setTimeout(() => {
              const isPopoverHovered = document.querySelector('[data-radix-popover-content]:hover')
              if (!isPopoverHovered) {
                setIsPopoverOpen(false)
              }
            }, 100)
          }}
        >
          <Eye className={`h-4 w-4 ${isWatching ? 'fill-current' : ''}`} />
          {watchers.length > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {watchers.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-3"
        onMouseEnter={() => setIsPopoverOpen(true)}
        onMouseLeave={() => setIsPopoverOpen(false)}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Watchers ({watchers.length})</h4>
          </div>
          
          {watchers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No watchers yet</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {watchers.map((watcher) => (
                <div
                  key={watcher.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      user={{
                        name: watcher.user.name,
                        email: watcher.user.email,
                        avatarUrl: watcher.user.avatarUrl
                      }}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium">{watcher.user.name}</p>
                      <p className="text-xs text-muted-foreground">{watcher.user.email}</p>
                    </div>
                  </div>
                  
                  {/* Show X button if current user can remove this watcher */}
                  {(currentUserId === watcher.user.id || currentUserRole === 'ADMIN') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveWatcher(watcher.user.id)
                      }}
                      disabled={isLoading}
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="pt-2 border-t text-xs text-muted-foreground">
            Click the eye to {isWatching ? 'stop watching' : 'watch'} this ticket
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}