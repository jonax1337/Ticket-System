'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useState } from 'react'
import { User, MessageCircle, Clock, AlertTriangle, AlertCircle, CheckCircle2, Timer, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react'
import { TicketStatus, Priority } from '@prisma/client'

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
  }[]
}

interface TicketsListProps {
  tickets: Ticket[]
}

type SortField = 'id' | 'subject' | 'status' | 'priority' | 'fromName' | 'assignedTo' | 'createdAt' | 'comments'
type SortDirection = 'asc' | 'desc'

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

export default function TicketsList({ tickets }: TicketsListProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedTickets = [...tickets].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortField) {
      case 'id':
        aValue = a.id
        bValue = b.id
        break
      case 'subject':
        aValue = a.subject.toLowerCase()
        bValue = b.subject.toLowerCase()
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'priority':
        const priorityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 }
        aValue = priorityOrder[a.priority]
        bValue = priorityOrder[b.priority]
        break
      case 'fromName':
        aValue = (a.fromName || a.fromEmail).toLowerCase()
        bValue = (b.fromName || b.fromEmail).toLowerCase()
        break
      case 'assignedTo':
        aValue = a.assignedTo?.name?.toLowerCase() || ''
        bValue = b.assignedTo?.name?.toLowerCase() || ''
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      case 'comments':
        aValue = a.comments.length
        bValue = b.comments.length
        break
      default:
        aValue = a.createdAt
        bValue = b.createdAt
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? 
        <ChevronUp className="h-3 w-3" /> : 
        <ChevronDown className="h-3 w-3" />
      )}
    </button>
  )
  const generateTicketNumber = (ticketId: string) => {
    // Generate a short ticket number from the ID (last 6 characters)
    return `#${ticketId.slice(-6).toUpperCase()}`
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No tickets found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  <SortButton field="id">Ticket #</SortButton>
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  <SortButton field="subject">Subject</SortButton>
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  <SortButton field="status">Status</SortButton>
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  <SortButton field="priority">Priority</SortButton>
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  <SortButton field="fromName">Requester</SortButton>
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  <SortButton field="assignedTo">Assigned</SortButton>
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  <SortButton field="createdAt">Created</SortButton>
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                  <SortButton field="comments">Comments</SortButton>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTickets.map((ticket) => (
                <tr 
                  key={ticket.id}
                  className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                >
                    <td className="p-4">
                      <div className="font-mono text-sm font-medium text-primary">
                        {generateTicketNumber(ticket.id)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium text-sm leading-tight">
                          {ticket.subject}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {ticket.description}
                        </div>
                      </div>
                    </td>
                  <td className="p-4">
                    <Badge variant="outline" className={statusColors[ticket.status]}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className={priorityColors[ticket.priority]}>
                      {ticket.priority}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <div className="font-medium">
                        {ticket.fromName || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ticket.fromEmail}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {ticket.assignedTo ? (
                        <div>
                          <div className="font-medium">
                            {ticket.assignedTo.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {ticket.assignedTo.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                      <div className="text-xs">
                        {format(new Date(ticket.createdAt), 'HH:mm')}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageCircle className="h-3 w-3" />
                      <span>{ticket.comments.length}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}