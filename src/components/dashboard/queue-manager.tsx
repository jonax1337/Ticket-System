'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Edit, Plus, Save, X, Inbox, Folder, Circle, Users, Settings, GripVertical, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'

interface Queue {
  id: string
  name: string
  description: string | null
  color: string
  icon: string
  isDefault: boolean
  order: number
  _count: {
    tickets: number
    userQueues: number
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface UserQueue {
  id: string
  userId: string
  queueId: string
  user: User
  queue: Queue
}

const ICON_OPTIONS = [
  { value: 'Inbox', label: 'Inbox', Icon: Inbox },
  { value: 'Folder', label: 'Folder', Icon: Folder },
  { value: 'Circle', label: 'Circle', Icon: Circle },
  { value: 'Users', label: 'Users', Icon: Users },
  { value: 'Settings', label: 'Settings', Icon: Settings },
]

const COLOR_OPTIONS = [
  { value: '#2563eb', label: 'Blue' },
  { value: '#dc2626', label: 'Red' },
  { value: '#16a34a', label: 'Green' },
  { value: '#ca8a04', label: 'Yellow' },
  { value: '#9333ea', label: 'Purple' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#0891b2', label: 'Cyan' },
  { value: '#be123c', label: 'Rose' },
]

export default function QueueManager() {
  const [queues, setQueues] = useState<Queue[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [userQueues, setUserQueues] = useState<UserQueue[]>([])
  const [loading, setLoading] = useState(true)
  const [editingQueue, setEditingQueue] = useState<Queue | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#2563eb',
    icon: 'Inbox',
    isDefault: false,
    order: 0
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchData()
  }, [])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = queues.findIndex((queue) => queue.id === active.id)
      const newIndex = queues.findIndex((queue) => queue.id === over?.id)

      const newQueues = arrayMove(queues, oldIndex, newIndex)
      setQueues(newQueues)

      // Update order in database
      try {
        await Promise.all(
          newQueues.map((queue, index) =>
            fetch(`/api/queues/${queue.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: queue.name,
                description: queue.description,
                color: queue.color,
                icon: queue.icon,
                isDefault: queue.isDefault,
                order: index + 1,
              }),
            })
          )
        )
      } catch (error) {
        console.error('Error updating queue order:', error)
        toast.error('Failed to update queue order')
        // Revert the change on error
        fetchData()
      }
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch queues
      const queuesResponse = await fetch('/api/queues')
      if (queuesResponse.ok) {
        const queuesData = await queuesResponse.json()
        setQueues(queuesData)
      }

      // Fetch users - Fix: use correct API endpoint
      const usersResponse = await fetch('/api/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      // Fetch user-queue assignments
      const userQueuesResponse = await fetch('/api/admin/user-queues')
      if (userQueuesResponse.ok) {
        const userQueuesData = await userQueuesResponse.json()
        setUserQueues(userQueuesData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load queue data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQueue = async () => {
    try {
      const response = await fetch('/api/queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Queue created successfully')
        setIsDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create queue')
      }
    } catch (error) {
      console.error('Failed to create queue:', error)
      toast.error('Failed to create queue')
    }
  }

  const handleUpdateQueue = async () => {
    if (!editingQueue) return

    try {
      const response = await fetch(`/api/queues/${editingQueue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Queue updated successfully')
        setEditingQueue(null)
        setIsDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update queue')
      }
    } catch (error) {
      console.error('Failed to update queue:', error)
      toast.error('Failed to update queue')
    }
  }

  const handleDeleteQueue = async (queueId: string) => {
    if (!confirm('Are you sure you want to delete this queue? All tickets in this queue will be moved to "No Queue".')) {
      return
    }

    try {
      const response = await fetch(`/api/queues/${queueId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Queue deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete queue')
      }
    } catch (error) {
      console.error('Failed to delete queue:', error)
      toast.error('Failed to delete queue')
    }
  }

  const handleEditQueue = (queue: Queue) => {
    setEditingQueue(queue)
    setFormData({
      name: queue.name,
      description: queue.description || '',
      color: queue.color,
      icon: queue.icon,
      isDefault: queue.isDefault,
      order: queue.order
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#2563eb',
      icon: 'Inbox',
      isDefault: false,
      order: 0
    })
    setEditingQueue(null)
  }

  const handleAssignUserToQueue = async (userId: string, queueId: string) => {
    try {
      const response = await fetch('/api/users/queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, queueId }),
      })

      if (response.ok) {
        toast.success('User assigned to queue')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to assign user to queue')
      }
    } catch (error) {
      console.error('Failed to assign user to queue:', error)
      toast.error('Failed to assign user to queue')
    }
  }

  const handleRemoveUserFromQueue = async (userId: string, queueId: string) => {
    try {
      const response = await fetch(`/api/users/queues?userId=${userId}&queueId=${queueId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('User removed from queue')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove user from queue')
      }
    } catch (error) {
      console.error('Failed to remove user from queue:', error)
      toast.error('Failed to remove user from queue')
    }
  }

  const getUserQueues = (userId: string) => {
    return userQueues.filter(uq => uq.userId === userId)
  }

  const getQueueUsers = (queueId: string) => {
    return userQueues.filter(uq => uq.queueId === queueId)
  }

  // Sortable Queue Row Component
  const SortableQueueRow = ({ queue }: { queue: Queue }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: queue.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    const IconComponent = ICON_OPTIONS.find(option => option.value === queue.icon)?.Icon || Inbox

    return (
      <TableRow ref={setNodeRef} style={style} {...attributes}>
        <TableCell>
          <div className="flex items-center gap-2">
            <div {...listeners} className="cursor-grab hover:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <IconComponent 
              className="h-4 w-4" 
              style={{ color: queue.color }}
            />
            <span className="font-medium">{queue.name}</span>
          </div>
        </TableCell>
        <TableCell>
          {queue.description && (
            <span className="text-sm text-muted-foreground">{queue.description}</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{queue._count.tickets} tickets</span>
            <span>{queue._count.userQueues} users</span>
          </div>
        </TableCell>
        <TableCell>
          {queue.isDefault ? (
            <Badge variant="secondary">Default</Badge>
          ) : (
            <Badge variant="outline">Custom</Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditQueue(queue)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteQueue(queue.id)}
              disabled={queue._count.tickets > 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  Queue Management
                </CardTitle>
                <CardDescription>
                  Create and manage support queues for organizing tickets. Drag to reorder.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading queue management...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Queue Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Queue Management
              </CardTitle>
              <CardDescription>
                Create and manage support queues for organizing tickets.<br />Drag to reorder.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Queue
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingQueue ? 'Edit Queue' : 'Create New Queue'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingQueue 
                      ? 'Update the queue settings below.'
                      : 'Create a new queue to organize your tickets.'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Queue Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Technical Support"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description for this queue"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="icon">Icon</Label>
                      <Select
                        value={formData.icon}
                        onValueChange={(value) => setFormData({ ...formData, icon: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <option.Icon className="h-4 w-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="color">Color</Label>
                      <Select
                        value={formData.color}
                        onValueChange={(value) => setFormData({ ...formData, color: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLOR_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: option.value }}
                                />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isDefault"
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                    />
                    <Label htmlFor="isDefault">Set as default queue</Label>
                  </div>
                  
                  <div>
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={editingQueue ? handleUpdateQueue : handleCreateQueue}>
                    {editingQueue ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Silent loading indicator */}
          {loading && queues.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Updating queues...</span>
            </div>
          )}
          
          {queues.length === 0 ? (
            <div className="text-center py-8">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading queues...</p>
                </>
              ) : (
                <>
                  <Inbox className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">No queues configured</h4>
                  <p className="text-xs text-muted-foreground">Add your first queue to get started</p>
                </>
              )}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Queue</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Statistics</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext items={queues.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    {queues.map((queue) => (
                      <SortableQueueRow key={queue.id} queue={queue} />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* User-Queue Assignment Section */}
      <Card>
        <CardHeader>
          <CardTitle>User Queue Assignments</CardTitle>
          <CardDescription>
            Assign users to specific queues to control access to tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {users.map((user) => {
              const assignedQueues = getUserQueues(user.id)
              return (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Assigned Queues:</Label>
                    <div className="flex flex-wrap gap-2">
                      {assignedQueues.map((userQueue) => (
                        <Badge key={userQueue.id} variant="outline" className="flex items-center gap-1">
                          {userQueue.queue.name}
                          <button
                            onClick={() => handleRemoveUserFromQueue(user.id, userQueue.queueId)}
                            className="ml-1 hover:bg-red-100 rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {assignedQueues.length === 0 && (
                        <span className="text-sm text-muted-foreground">No queues assigned</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Select onValueChange={(queueId) => handleAssignUserToQueue(user.id, queueId)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Assign to queue..." />
                        </SelectTrigger>
                        <SelectContent>
                          {queues
                            .filter(queue => !assignedQueues.some(aq => aq.queueId === queue.id))
                            .map((queue) => {
                              const IconComponent = ICON_OPTIONS.find(option => option.value === queue.icon)?.Icon || Inbox
                              return (
                                <SelectItem key={queue.id} value={queue.id}>
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" style={{ color: queue.color }} />
                                    {queue.name}
                                  </div>
                                </SelectItem>
                              )
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}