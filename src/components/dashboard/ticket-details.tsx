'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Clock, Mail, AlertTriangle, AlertCircle, CheckCircle2, Timer, ArrowRight, Search, MessageSquare, FileText, Zap, TrendingUp, Paperclip, Download, Calendar, RefreshCw, Bell, Inbox, Folder, Circle } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-system'
import { useRouter } from 'next/navigation'
import TicketComments from '@/components/dashboard/ticket-comments'
import TicketParticipants from '@/components/dashboard/ticket-participants'
import { UserAvatar } from '@/components/ui/user-avatar'
import { DatePicker } from '@/components/ui/date-picker'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { normalizeDateToMidnight } from '@/lib/date-utils'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/shadcn-io/combobox'
import { useCache } from '@/lib/cache-context'

interface User {
  id: string
  name: string
  email: string
}

interface Ticket {
  id: string
  ticketNumber?: string | null
  subject: string
  description: string
  htmlContent?: string | null
  status: string
  priority: string
  fromEmail: string
  fromName: string | null
  dueDate?: Date | null
  reminderDate?: Date | null
  createdAt: Date
  updatedAt: Date
  assignedTo: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
  } | null
  queue?: {
    id: string
    name: string
    color: string
    icon: string
  } | null
  participants?: {
    id: string
    email: string
    name?: string | null
    type: string
    createdAt: Date
  }[]
  attachments?: {
    id: string
    filename: string
    filepath: string
    mimetype: string
    size: number
  }[]
  comments: {
    id: string
    content: string
    fullEmailContent?: string | null // Full email content including history for email replies
    sentToEmails?: string | null // Comma-separated emails this external comment was sent to
    createdAt: Date
    user: {
      id: string
      name: string
      email: string
      avatarUrl?: string | null
    } | null // Can be null for external email replies
    fromName?: string | null // Name of external user for email replies
    fromEmail?: string | null // Email of external user for email replies
    attachments?: {
      id: string
      filename: string
      filepath: string
      mimetype: string
      size: number
    }[]
  }[]
}

interface TicketDetailsProps {
  ticket: Ticket
  users: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
  }[]
  currentUser: {
    id: string
    name?: string | null
  }
}

// Removed - using unified icon system

export default function TicketDetails({ ticket: initialTicket, users, currentUser }: TicketDetailsProps) {
  const [ticket, setTicket] = useState(initialTicket)
  const [isLoading, setIsLoading] = useState(false)
  const [editingDueDate, setEditingDueDate] = useState(false)
  const [tempDueDate, setTempDueDate] = useState<Date | undefined>(undefined)
  const [editingReminderDate, setEditingReminderDate] = useState(false)
  const [tempReminderDate, setTempReminderDate] = useState<Date | undefined>(undefined)
  const [queues, setQueues] = useState<Array<{id: string, name: string, color: string, icon: string}>>([])

  const router = useRouter()
  const { statuses, priorities, isLoading: cacheLoading } = useCache()

  // Load ALL queues for ticket assignment (not just user's assigned queues)
  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const response = await fetch('/api/queues') // Get ALL queues for assignment
        if (response.ok) {
          const allQueues = await response.json()
          setQueues(allQueues)
        }
      } catch (error) {
        console.error('Failed to fetch queues:', error)
      }
    }
    fetchQueues()
  }, [])

  const getDisplayTicketNumber = () => {
    return ticket.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`
  }
  
  const handleStatusChange = async (status: string) => {
    setIsLoading(true)
    const previousStatus = ticket.status
    
    // Optimistic update
    setTicket(prev => ({ ...prev, status }))
    
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        // Create an automatic comment to log the status change
        try {
          const statusChangeComment = `[STATUS_CHANGE] Status changed from "${previousStatus}" to "${status}"`
          
          const formData = new FormData()
          formData.append('content', statusChangeComment)
          formData.append('type', 'internal')
          formData.append('fileCount', '0')
          
          const commentResponse = await fetch(`/api/tickets/${ticket.id}/comments`, {
            method: 'POST',
            body: formData,
          })

          if (commentResponse.ok) {
            // Get the new comment data and add it to the ticket state
            const newCommentData = await commentResponse.json()
            setTicket(prev => ({ 
              ...prev, 
              comments: [...prev.comments, newCommentData]
            }))
          }
        } catch (commentError) {
          console.error('Failed to create status change comment:', commentError)
          // Don't fail the main request if comment creation fails
        }
      } else {
        // Revert optimistic update on error
        setTicket(prev => ({ ...prev, status: previousStatus }))
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      // Revert optimistic update
      setTicket(prev => ({ ...prev, status: previousStatus }))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePriorityChange = async (priority: string) => {
    setIsLoading(true)
    const previousPriority = ticket.priority
    
    // Optimistic update
    setTicket(prev => ({ ...prev, priority }))
    
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority }),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setTicket(prev => ({ ...prev, priority: previousPriority }))
        throw new Error('Failed to update priority')
      }
    } catch (error) {
      console.error('Failed to update priority:', error)
      // Revert optimistic update
      setTicket(prev => ({ ...prev, priority: previousPriority }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleQueueChange = async (queueId: string) => {
    setIsLoading(true)
    const previousQueue = ticket.queue
    const newQueueId = queueId === 'NONE' ? null : queueId
    const newQueue = queueId === 'NONE' ? null : queues.find(q => q.id === queueId) || null
    
    // Optimistic update
    setTicket(prev => ({ ...prev, queue: newQueue }))
    
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queueId: newQueueId }),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setTicket(prev => ({ ...prev, queue: previousQueue }))
        throw new Error('Failed to update queue')
      }
    } catch (error) {
      console.error('Failed to update queue:', error)
      // Revert optimistic update
      setTicket(prev => ({ ...prev, queue: previousQueue }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssigneeChange = async (assignedToId: string) => {
    setIsLoading(true)
    const previousAssignedTo = ticket.assignedTo
    const newAssignedTo = assignedToId === '' ? null : users.find(u => u.id === assignedToId) || null
    
    // Optimistic update
    setTicket(prev => ({ ...prev, assignedTo: newAssignedTo }))
    
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          assignedToId: assignedToId === '' ? null : assignedToId 
        }),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setTicket(prev => ({ ...prev, assignedTo: previousAssignedTo }))
        throw new Error('Failed to update assignee')
      }
    } catch (error) {
      console.error('Failed to update assignee:', error)
      // Revert optimistic update
      setTicket(prev => ({ ...prev, assignedTo: previousAssignedTo }))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleRequesterUpdate = async (name: string, email: string) => {
    const previousFromName = ticket.fromName
    const previousFromEmail = ticket.fromEmail
    
    // Optimistic update
    setTicket(prev => ({ ...prev, fromName: name, fromEmail: email }))
    
    const response = await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        fromName: name,
        fromEmail: email
      }),
    })

    if (!response.ok) {
      // Revert optimistic update on error
      setTicket(prev => ({ ...prev, fromName: previousFromName, fromEmail: previousFromEmail }))
      throw new Error('Failed to update requester')
    }
  }

  const handleDueDateChange = async (date: Date | undefined) => {
    setIsLoading(true)
    const previousDueDate = ticket.dueDate
    const normalizedDate = date ? normalizeDateToMidnight(date) : null
    
    // Optimistic update
    setTicket(prev => ({ ...prev, dueDate: normalizedDate }))
    
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dueDate: normalizedDate?.toISOString() || null
        }),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setTicket(prev => ({ ...prev, dueDate: previousDueDate }))
        throw new Error('Failed to update due date')
      }
    } catch (error) {
      console.error('Failed to update due date:', error)
      // Revert optimistic update
      setTicket(prev => ({ ...prev, dueDate: previousDueDate }))
    } finally {
      setIsLoading(false)
    }
  }

  const getDueDateStatus = () => {
    if (!ticket.dueDate) return null
    
    const now = new Date()
    const dueDate = new Date(ticket.dueDate)
    const diffHours = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 0) {
      return { status: 'overdue', color: 'text-red-600', bg: 'bg-red-50' }
    } else if (diffHours <= 24) {
      return { status: 'due_soon', color: 'text-amber-600', bg: 'bg-amber-50' }
    }
    return { status: 'normal', color: 'text-green-600', bg: 'bg-green-50' }
  }

  const handleReminderDateChange = async (date: Date | undefined) => {
    setIsLoading(true)
    const previousReminderDate = ticket.reminderDate
    
    // Optimistic update
    setTicket(prev => ({ ...prev, reminderDate: date || null }))
    
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reminderDate: date ? date.toISOString() : null
        }),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setTicket(prev => ({ ...prev, reminderDate: previousReminderDate }))
        throw new Error('Failed to update reminder date')
      }
    } catch (error) {
      console.error('Failed to update reminder date:', error)
      // Revert optimistic update
      setTicket(prev => ({ ...prev, reminderDate: previousReminderDate }))
    } finally {
      setIsLoading(false)
    }
  }

  const getReminderStatus = () => {
    if (!ticket.reminderDate) return null
    
    const now = new Date()
    const reminderDate = new Date(ticket.reminderDate)
    const diffHours = Math.ceil((reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 0) {
      return { status: 'overdue', color: 'text-red-600', bg: 'bg-red-50' }
    } else if (diffHours <= 24) {
      return { status: 'due_soon', color: 'text-amber-600', bg: 'bg-amber-50' }
    }
    return { status: 'normal', color: 'text-blue-600', bg: 'bg-blue-50' }
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main Content */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="font-mono text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                  {getDisplayTicketNumber()}
                </div>
              </div>
              <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col space-y-6">
          <div>
            <h3 className="font-medium text-base mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </h3>
            <div className="bg-muted/30 rounded-md p-4 max-h-[300px] overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* Ticket Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div>
              <h3 className="font-medium text-base mb-3 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments ({ticket.attachments.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ticket.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                  >
                    {attachment.mimetype.startsWith('image/') ? (
                      <div className="relative">
                        <img
                          src={attachment.filepath}
                          alt={attachment.filename}
                          className="w-12 h-12 object-cover rounded cursor-pointer"
                          onClick={() => window.open(attachment.filepath, '_blank')}
                        />
                      </div>
                    ) : (
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <a
                      href={attachment.filepath}
                      download={attachment.filename}
                      className="text-primary hover:text-primary/80"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="border-t pt-6">
            <h3 className="font-medium text-base mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({ticket.comments.length})
            </h3>
            <div className="space-y-4">
              <TicketComments 
                ticket={ticket} 
                currentUser={currentUser} 
                onTicketUpdate={(updatedFields) => setTicket(prev => ({ ...prev, ...updatedFields }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ticket Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Status</h4>
              <Select 
                value={statuses.find(s => s.name === ticket.status)?.name || ticket.status}
                onValueChange={handleStatusChange}
                disabled={isLoading}
              >
                <SelectTrigger className={`w-full ${statuses.find(s => s.name === ticket.status)?.color || ''}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => {
                    const IconComponent = getIconComponent(status.icon)
                    return (
                      <SelectItem key={status.id} value={status.name}>
                        <span className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{status.name}</span>
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Priority</h4>
              <Select 
                value={priorities.find(p => p.name === ticket.priority)?.name || ticket.priority}
                onValueChange={handlePriorityChange}
                disabled={isLoading}
              >
                <SelectTrigger className={`w-full ${priorities.find(p => p.name === ticket.priority)?.color || ''}`}>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => {
                    const IconComponent = getIconComponent(priority.icon)
                    return (
                      <SelectItem key={priority.id} value={priority.name}>
                        <span className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{priority.name}</span>
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Queue */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Queue</h4>
              <Select 
                value={ticket.queue?.id || 'NONE'}
                onValueChange={handleQueueChange}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No Queue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">
                    <span className="flex items-center gap-2">
                      <Circle className="h-4 w-4" />
                      <span>No Queue</span>
                    </span>
                  </SelectItem>
                  {queues.map((queue) => {
                    const IconComponent = getIconComponent(queue.icon)
                    return (
                      <SelectItem key={queue.id} value={queue.id}>
                        <span className="flex items-center gap-2">
                          <div style={{ color: queue.color }}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <span>{queue.name}</span>
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Assigned To</h4>
              <Combobox
                data={[
                  { label: 'Unassigned', value: '' },
                  ...users.map(user => ({
                    label: user.name,
                    value: user.id
                  }))
                ]}
                type="assignee"
                defaultValue={ticket.assignedTo?.id || ""}
                onValueChange={handleAssigneeChange}
              >
                <ComboboxTrigger className="w-full">
                  {ticket.assignedTo ? (
                    <span className="flex items-center gap-2">
                      <UserAvatar 
                        user={{
                          name: ticket.assignedTo.name,
                          email: ticket.assignedTo.email,
                          avatarUrl: ticket.assignedTo.avatarUrl
                        }}
                        size="sm"
                      />
                      {ticket.assignedTo.name}
                    </span>
                  ) : (
                    "Unassigned"
                  )}
                </ComboboxTrigger>
                <ComboboxContent className="p-0">
                  <ComboboxInput placeholder="Search users..." />
                  <ComboboxEmpty>No users found</ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxGroup>
                      <ComboboxItem value="">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Unassigned</span>
                        </div>
                      </ComboboxItem>
                      {users.map((user) => (
                        <ComboboxItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <UserAvatar 
                              user={{
                                name: user.name,
                                email: user.email,
                                avatarUrl: user.avatarUrl
                              }}
                              size="sm"
                            />
                            <span>{user.name}</span>
                          </div>
                        </ComboboxItem>
                      ))}
                    </ComboboxGroup>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>


            {/* Dates */}
            <div className="space-y-3 pt-2">
              {/* Due Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </span>
                  {ticket.dueDate && getDueDateStatus()?.status === 'overdue' && (
                    <Badge variant="destructive" className="text-xs">Overdue</Badge>
                  )}
                  {ticket.dueDate && getDueDateStatus()?.status === 'due_soon' && (
                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">Due Soon</Badge>
                  )}
                </div>
                <DatePicker
                  date={ticket.dueDate ? new Date(ticket.dueDate) : undefined}
                  setDate={handleDueDateChange}
                  placeholder="Select due date"
                  className="text-sm"
                />
              </div>
              
              {/* Reminder Date & Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Reminder Date & Time
                  </span>
                  {ticket.reminderDate && getReminderStatus()?.status === 'overdue' && (
                    <Badge variant="destructive" className="text-xs">Reminder Passed</Badge>
                  )}
                  {ticket.reminderDate && getReminderStatus()?.status === 'due_soon' && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Reminder Soon</Badge>
                  )}
                </div>
                <DateTimePicker
                  date={ticket.reminderDate ? new Date(ticket.reminderDate) : undefined}
                  setDate={handleReminderDateChange}
                  placeholder="Select reminder date & time"
                  className="text-sm"
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span>{format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Updated:</span>
                <span>{format(new Date(ticket.updatedAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        {ticket.participants && (
          <TicketParticipants 
            ticketId={ticket.id}
            participants={ticket.participants}
            requester={{
              name: ticket.fromName,
              email: ticket.fromEmail
            }}
            onRequesterUpdate={handleRequesterUpdate}
            onParticipantsUpdate={(updatedParticipants) => setTicket(prev => ({ ...prev, participants: updatedParticipants }))}
          />
        )}
      </div>
    </div>
  )
}