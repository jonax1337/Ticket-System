'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCache } from '@/lib/cache-context'
import { toast } from 'sonner'
// Removed enum imports - now using dynamic string values

interface User {
  id: string
  name: string
  email: string
}

interface Ticket {
  id: string
  status: string
  priority: string
  assignedTo: {
    id: string
    name: string
    email: string
  } | null
}

interface TicketActionsProps {
  ticket: Ticket
  users: User[]
  currentUser: {
    id: string
    role: string
  }
  onUpdate?: (updatedTicket: Partial<Ticket>) => void
}

export default function TicketActions({ ticket, users, onUpdate }: TicketActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { statuses, priorities } = useCache()

  const handleStatusChange = async (status: string) => {
    setIsLoading(true)
    
    // Optimistic update
    onUpdate?.({ status })
    
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }
      
      const updatedTicket = await response.json()
      onUpdate?.(updatedTicket)
      toast.success('Status updated successfully')
    } catch (error) {
      console.error('Failed to update status:', error)
      // Revert optimistic update
      onUpdate?.({ status: ticket.status })
      toast.error('Failed to update status')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePriorityChange = async (priority: string) => {
    setIsLoading(true)
    
    // Optimistic update
    onUpdate?.({ priority })
    
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority }),
      })

      if (!response.ok) {
        throw new Error('Failed to update priority')
      }
      
      const updatedTicket = await response.json()
      onUpdate?.(updatedTicket)
      toast.success('Priority updated successfully')
    } catch (error) {
      console.error('Failed to update priority:', error)
      // Revert optimistic update
      onUpdate?.({ priority: ticket.priority })
      toast.error('Failed to update priority')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssigneeChange = async (assignedToId: string) => {
    setIsLoading(true)
    
    const newAssignedTo = assignedToId === 'unassigned' ? null : users.find(u => u.id === assignedToId) || null
    
    // Optimistic update
    onUpdate?.({ assignedTo: newAssignedTo })
    
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          assignedToId: assignedToId === 'unassigned' ? null : assignedToId 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update assignee')
      }
      
      const updatedTicket = await response.json()
      onUpdate?.(updatedTicket)
      toast.success('Assignee updated successfully')
    } catch (error) {
      console.error('Failed to update assignee:', error)
      // Revert optimistic update
      onUpdate?.({ assignedTo: ticket.assignedTo })
      toast.error('Failed to update assignee')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <Select
              value={ticket.status}
              onValueChange={handleStatusChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.name}>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: status.color }}
                      />
                      {status.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <Select
              value={ticket.priority}
              onValueChange={handlePriorityChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority.id} value={priority.name}>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: priority.color }}
                      />
                      {priority.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Assigned To</label>
            <Select
              value={ticket.assignedTo?.id || 'unassigned'}
              onValueChange={handleAssigneeChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}