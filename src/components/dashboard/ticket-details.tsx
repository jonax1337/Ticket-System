'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Clock, Mail, AlertTriangle, AlertCircle, CheckCircle2, Timer, ArrowRight, Search, MessageSquare, FileText, Zap, TrendingUp, Paperclip, Download, Calendar, RefreshCw, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import TicketComments from '@/components/dashboard/ticket-comments'
import TicketParticipants from '@/components/dashboard/ticket-participants'
import { UserAvatar } from '@/components/ui/user-avatar'
import { DatePicker } from '@/components/ui/date-picker'
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

const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Timer,
    AlertTriangle,
    Zap,
    TrendingUp
  }
  return iconMap[iconName] || AlertCircle
}

export default function TicketDetails({ ticket, users, currentUser }: TicketDetailsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [editingDueDate, setEditingDueDate] = useState(false)
  const [tempDueDate, setTempDueDate] = useState<Date | undefined>(undefined)
  const [editingReminderDate, setEditingReminderDate] = useState(false)
  const [tempReminderDate, setTempReminderDate] = useState<Date | undefined>(undefined)
  const router = useRouter()
  const { statuses, priorities, isLoading: cacheLoading } = useCache()

  const getDisplayTicketNumber = () => {
    return ticket.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`
  }
  
  const handleStatusChange = async (status: string) => {
    setIsLoading(true)
    try {
      const previousStatus = ticket.status
      
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
          
          await fetch(`/api/tickets/${ticket.id}/comments`, {
            method: 'POST',
            body: formData,
          })
        } catch (commentError) {
          console.error('Failed to create status change comment:', commentError)
          // Don't fail the main request if comment creation fails
        }
        
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePriorityChange = async (priority: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update priority:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssigneeChange = async (assignedToId: string) => {
    setIsLoading(true)
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

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update assignee:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleRequesterUpdate = async (name: string, email: string) => {
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

    if (response.ok) {
      router.refresh()
    } else {
      throw new Error('Failed to update requester')
    }
  }

  const handleDueDateEdit = () => {
    setEditingDueDate(true)
    setTempDueDate(ticket.dueDate ? new Date(ticket.dueDate) : undefined)
  }

  const handleDueDateSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dueDate: tempDueDate ? normalizeDateToMidnight(tempDueDate)?.toISOString() : null
        }),
      })

      if (response.ok) {
        setEditingDueDate(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update due date:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDueDateCancel = () => {
    setEditingDueDate(false)
    setTempDueDate(ticket.dueDate ? new Date(ticket.dueDate) : undefined)
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

  const handleReminderDateEdit = () => {
    setEditingReminderDate(true)
    setTempReminderDate(ticket.reminderDate ? new Date(ticket.reminderDate) : undefined)
  }

  const handleReminderDateSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reminderDate: tempReminderDate ? normalizeDateToMidnight(tempReminderDate)?.toISOString() : null
        }),
      })

      if (response.ok) {
        const updatedTicket = await response.json()
        // Update the ticket data
        Object.assign(ticket, updatedTicket)
        setEditingReminderDate(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update reminder date:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReminderDateCancel = () => {
    setEditingReminderDate(false)
    setTempReminderDate(ticket.reminderDate ? new Date(ticket.reminderDate) : undefined)
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
              <TicketComments ticket={ticket} currentUser={currentUser} />
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
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date:
                </span>
                <div className="flex items-center gap-2">
                  {editingDueDate ? (
                    <div className="flex items-center gap-2">
                      <DatePicker
                        date={tempDueDate}
                        setDate={setTempDueDate}
                        placeholder="Select due date"
                        className="h-8 text-xs"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleDueDateSave}
                        disabled={isLoading}
                        className="h-8 px-2"
                      >
                        ✓
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleDueDateCancel}
                        className="h-8 px-2"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {ticket.dueDate ? (
                        <span className={`${getDueDateStatus()?.color || ''} font-medium`}>
                          {format(new Date(ticket.dueDate), 'MMM d, yyyy')}
                          {getDueDateStatus()?.status === 'overdue' && (
                            <Badge variant="destructive" className="ml-2 text-xs">Overdue</Badge>
                          )}
                          {getDueDateStatus()?.status === 'due_soon' && (
                            <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-800">Due Soon</Badge>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={handleDueDateEdit}
                        className="h-6 w-6 p-0"
                      >
                        <Calendar className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Reminder Date */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Reminder Date:
                </span>
                <div className="flex items-center gap-2">
                  {editingReminderDate ? (
                    <div className="flex items-center gap-2">
                      <DatePicker
                        date={tempReminderDate}
                        setDate={setTempReminderDate}
                        placeholder="Select reminder date"
                        className="h-8 text-xs"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleReminderDateSave}
                        disabled={isLoading}
                        className="h-8 px-2"
                      >
                        ✓
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleReminderDateCancel}
                        className="h-8 px-2"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {ticket.reminderDate ? (
                        <span className={`${getReminderStatus()?.color || ''} font-medium`}>
                          {format(new Date(ticket.reminderDate), 'MMM d, yyyy')}
                          {getReminderStatus()?.status === 'overdue' && (
                            <Badge variant="destructive" className="ml-2 text-xs">Reminder Passed</Badge>
                          )}
                          {getReminderStatus()?.status === 'due_soon' && (
                            <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-800">Reminder Soon</Badge>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={handleReminderDateEdit}
                        className="h-6 w-6 p-0"
                      >
                        <Bell className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
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
          />
        )}
      </div>
    </div>
  )
}