'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Clock, Mail, AlertTriangle, AlertCircle, CheckCircle2, Timer, ArrowRight, Search, MessageSquare, FileText } from 'lucide-react'
import { TicketStatus, Priority } from '@prisma/client'
import { useRouter } from 'next/navigation'
import TicketComments from '@/components/dashboard/ticket-comments'
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
  subject: string
  description: string
  status: TicketStatus
  priority: Priority
  fromEmail: string
  fromName: string | null
  createdAt: Date
  updatedAt: Date
  assignedTo: {
    id: string
    name: string
    email: string
  } | null
  comments: {
    id: string
    content: string
    createdAt: Date
    user: {
      id: string
      name: string
      email: string
    }
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

const statusColors = {
  OPEN: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  CLOSED: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  URGENT: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
}

const priorityIcons = {
  LOW: <Clock className="h-4 w-4" />,
  MEDIUM: <Timer className="h-4 w-4" />,
  HIGH: <AlertCircle className="h-4 w-4" />,
  URGENT: <AlertTriangle className="h-4 w-4" />,
}

const statusIcons = {
  OPEN: <AlertCircle className="h-4 w-4" />,
  IN_PROGRESS: <ArrowRight className="h-4 w-4" />,
  CLOSED: <CheckCircle2 className="h-4 w-4" />,
}

export default function TicketDetails({ ticket, users, currentUser }: TicketDetailsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [requesterName, setRequesterName] = useState(ticket.fromName || '')
  const [requesterEmail, setRequesterEmail] = useState(ticket.fromEmail)
  const router = useRouter()
  
  const handleStatusChange = async (status: TicketStatus) => {
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

  const handlePriorityChange = async (priority: Priority) => {
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
  
  const handleRequesterUpdate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fromName: requesterName,
          fromEmail: requesterEmail
        }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update requester info:', error)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main Content */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div>
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
                defaultValue={ticket.status}
                onValueChange={handleStatusChange}
                disabled={isLoading}
              >
                <SelectTrigger className={`w-full ${statusColors[ticket.status]}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">
                    <span className="flex items-center gap-2">
                      {statusIcons.OPEN}
                      <span>Open</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="IN_PROGRESS">
                    <span className="flex items-center gap-2">
                      {statusIcons.IN_PROGRESS}
                      <span>In Progress</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="CLOSED">
                    <span className="flex items-center gap-2">
                      {statusIcons.CLOSED}
                      <span>Closed</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Priority</h4>
              <Select 
                defaultValue={ticket.priority}
                onValueChange={handlePriorityChange}
                disabled={isLoading}
              >
                <SelectTrigger className={`w-full ${priorityColors[ticket.priority]}`}>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    <span className="flex items-center gap-2">
                      {priorityIcons.LOW}
                      <span>Low</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <span className="flex items-center gap-2">
                      {priorityIcons.MEDIUM}
                      <span>Medium</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <span className="flex items-center gap-2">
                      {priorityIcons.HIGH}
                      <span>High</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="URGENT">
                    <span className="flex items-center gap-2">
                      {priorityIcons.URGENT}
                      <span>Urgent</span>
                    </span>
                  </SelectItem>
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

            {/* Requester */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Requester</h4>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Name</label>
                    <input
                      type="text"
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      placeholder="Requester name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Email</label>
                    <input
                      type="email"
                      value={requesterEmail}
                      onChange={(e) => setRequesterEmail(e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      placeholder="email@example.com"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    onClick={handleRequesterUpdate}
                    disabled={isLoading}
                  >
                    Update
                  </Button>
                </div>
              </div>
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
      </div>
    </div>
  )
}