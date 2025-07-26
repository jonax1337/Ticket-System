'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Clock, Mail, AlertTriangle, AlertCircle, CheckCircle2, Timer, ArrowRight, Search, MessageSquare, FileText, Zap, TrendingUp, Paperclip, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import TicketComments from '@/components/dashboard/ticket-comments'
import TicketParticipants from '@/components/dashboard/ticket-participants'
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
  createdAt: Date
  updatedAt: Date
  assignedTo: {
    id: string
    name: string
    email: string
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
    createdAt: Date
    user: {
      id: string
      name: string
      email: string
    }
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
  }[]
  currentUser: {
    id: string
    name?: string | null
  }
}

interface CustomStatus {
  id: string
  name: string
  icon: string
  color: string
  order: number
  isDefault: boolean
}

interface CustomPriority {
  id: string
  name: string
  icon: string
  color: string
  order: number
  isDefault: boolean
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
  const [statuses, setStatuses] = useState<CustomStatus[]>([])
  const [priorities, setPriorities] = useState<CustomPriority[]>([])
  const router = useRouter()

  const getDisplayTicketNumber = () => {
    return ticket.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`
  }

  useEffect(() => {
    // Load custom statuses and priorities
    const fetchData = async () => {
      try {
        const [statusesResponse, prioritiesResponse] = await Promise.all([
          fetch('/api/statuses'),
          fetch('/api/priorities')
        ])
        
        if (statusesResponse.ok) {
          const statusData = await statusesResponse.json()
          setStatuses(statusData)
        }
        
        if (prioritiesResponse.ok) {
          const priorityData = await prioritiesResponse.json()
          setPriorities(priorityData)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    
    fetchData()
  }, [])
  
  const handleStatusChange = async (status: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
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
                defaultValue={statuses.find(s => s.name === ticket.status)?.name || ticket.status}
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
                defaultValue={priorities.find(p => p.name === ticket.priority)?.name || ticket.priority}
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
                      <User className="h-4 w-4" />
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
                            <User className="h-4 w-4" />
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