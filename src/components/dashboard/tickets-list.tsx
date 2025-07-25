'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { User, MessageCircle, Clock, AlertTriangle, AlertCircle, CheckCircle2, Timer, ArrowRight, ChevronUp, ChevronDown, Zap, TrendingUp, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface Ticket {
  id: string
  ticketNumber?: string | null
  subject: string
  description: string
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
  comments: {
    id: string
  }[]
}

interface TicketsListProps {
  tickets: Ticket[]
  isAdmin?: boolean
}

type SortField = 'id' | 'subject' | 'status' | 'priority' | 'fromName' | 'assignedTo' | 'createdAt' | 'comments'
type SortDirection = 'asc' | 'desc'

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

export default function TicketsList({ tickets, isAdmin = false }: TicketsListProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [statuses, setStatuses] = useState<CustomStatus[]>([])
  const [priorities, setPriorities] = useState<CustomPriority[]>([])
  const [deletingTicket, setDeletingTicket] = useState<string | null>(null)

  useEffect(() => {
    // Load custom statuses and priorities for display
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

  const handleDeleteTicket = async (ticketId: string) => {
    setDeletingTicket(ticketId)
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Ticket deleted successfully')
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(`Failed to delete ticket: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete ticket. Please try again.')
    } finally {
      setDeletingTicket(null)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedTickets = [...tickets].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

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
        // Find priority order from custom priorities
        const aPriority = priorities.find(p => p.name === a.priority)
        const bPriority = priorities.find(p => p.name === b.priority)
        aValue = aPriority?.order || 0
        bValue = bPriority?.order || 0
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
      default:
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
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
  const getDisplayTicketNumber = (ticket: Ticket) => {
    // Use the generated ticket number if available, otherwise fallback to ID-based number
    return ticket.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`
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
                {isAdmin && (
                  <th className="text-left p-4 font-medium text-muted-foreground text-sm">
                    Actions
                  </th>
                )}
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
                        {getDisplayTicketNumber(ticket)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium text-sm leading-tight">
                          {ticket.subject}
                        </div>
                      </div>
                    </td>
                  <td className="p-4">
                    {(() => {
                      const status = statuses.find(s => s.name === ticket.status)
                      if (status) {
                        const IconComponent = getIconComponent(status.icon)
                        return (
                          <Badge variant="outline" className={status.color}>
                            <IconComponent className="h-3 w-3 mr-1" />
                            {status.name}
                          </Badge>
                        )
                      }
                      return (
                        <Badge variant="outline">
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      )
                    })()}
                  </td>
                  <td className="p-4">
                    {(() => {
                      const priority = priorities.find(p => p.name === ticket.priority)
                      if (priority) {
                        const IconComponent = getIconComponent(priority.icon)
                        return (
                          <Badge variant="outline" className={priority.color}>
                            <IconComponent className="h-3 w-3 mr-1" />
                            {priority.name}
                          </Badge>
                        )
                      }
                      return (
                        <Badge variant="outline">
                          {ticket.priority}
                        </Badge>
                      )
                    })()}
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
                  {isAdmin && (
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingTicket === ticket.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            {deletingTicket === ticket.id ? (
                              <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete ticket {getDisplayTicketNumber(ticket)}? 
                              This action cannot be undone and will permanently remove the ticket and all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                            >
                              Delete Ticket
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}