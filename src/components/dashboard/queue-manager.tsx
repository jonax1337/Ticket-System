'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Edit, Plus, X, GripVertical, RefreshCw, Search, Shield, User as UserIcon, Check, ChevronDown, UserCheck, Inbox } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
} from "@/components/ui/alert-dialog"
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { IconPicker } from '@/components/ui/enhanced-icon-picker'
import { getIconComponent } from '@/lib/icon-system'

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
  avatarUrl?: string
}

interface UserQueue {
  id: string
  userId: string
  queueId: string
  user: User
  queue: Queue
}

const roleColors = {
  ADMIN: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  SUPPORTER: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
}

const roleIcons = {
  ADMIN: Shield,
  SUPPORTER: UserCheck,
}

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
  const [deletingQueue, setDeletingQueue] = useState<Queue | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
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

  const handleDeleteQueue = async () => {
    if (!deletingQueue) return

    try {
      const response = await fetch(`/api/queues/${deletingQueue.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Queue deleted successfully')
        setDeletingQueue(null)
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
      order: queues.length + 1 // New queues go to the bottom
    })
    setEditingQueue(null)
  }

  const handleAssignUserToQueue = async (userId: string, queueId: string) => {
    if (!queueId) return
    
    try {
      const response = await fetch('/api/users/queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, queueId }),
      })

      if (response.ok) {
        toast.success('User assigned to queue')
        // Update state without full refresh
        const newUserQueue = await response.json()
        // We need to add the user object to the userQueue for our state
        const user = users.find(u => u.id === userId)
        if (user) {
          setUserQueues(prev => [...prev, { ...newUserQueue, user }])
        }
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
        // Update state without full refresh
        setUserQueues(prev => prev.filter(uq => !(uq.userId === userId && uq.queueId === queueId)))
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


  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

    const IconComponent = getIconComponent(queue.icon)

    return (
      <TableRow ref={setNodeRef} style={style} {...attributes}>
        <TableCell>
          <div className="flex items-center gap-2">
            <div {...listeners} className="cursor-grab hover:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div style={{ color: queue.color }}>
              <IconComponent className="h-4 w-4" />
            </div>
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={queue.isDefault}
                  className={queue.isDefault ? "opacity-50 cursor-not-allowed" : ""}
                  title={queue.isDefault ? "Cannot delete default queue" : "Delete queue"}
                  onClick={() => {
                    if (!queue.isDefault) {
                      setDeletingQueue(queue)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Queue</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the queue <strong>&ldquo;{queue.name}&rdquo;</strong>?
                    {queue._count.tickets > 0 && (
                      <><br /><br />This queue contains <strong>{queue._count.tickets}</strong> ticket{queue._count.tickets !== 1 ? 's' : ''}. All tickets will be moved to &ldquo;Default&rdquo;.</>
                    )}
                    {queue._count.userQueues > 0 && (
                      <><br /><br /><strong>{queue._count.userQueues}</strong> user{queue._count.userQueues !== 1 ? 's are' : ' is'} assigned to this queue and will lose access.</>
                    )}
                    <br /><br />This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeletingQueue(null)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteQueue}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Queue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
    <div className="flex gap-6 h-full">
      {/* Queue Management Section - 3/5 width */}
      <div className="flex-[3]">
        <Card className="h-full">
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
                  
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    editingQueue ? handleUpdateQueue() : handleCreateQueue()
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Queue Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Technical Support"
                        required
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
                        <IconPicker
                          value={formData.icon}
                          onValueChange={(value) => setFormData({ ...formData, icon: value })}
                          placeholder="Select an icon"
                          showCategories={true}
                        />
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

                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingQueue ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
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
      </div>

      {/* User-Queue Assignment Section - 2/5 width */}
      <div className="flex-[2]">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>User Queue Assignments</CardTitle>
            <CardDescription>
              Assign users to specific queues to control access to tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* User list */}
              <div className="space-y-3">
                {filteredUsers.map((user) => {
                  const assignedQueues = getUserQueues(user.id)
                  const availableQueues = queues
                  
                  return (
                    <div key={user.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm truncate">{user.name}</h4>
                              <Badge variant="outline" className={`text-xs shrink-0 ${roleColors[user.role as keyof typeof roleColors]}`}>
                                {(() => {
                                  const RoleIcon = roleIcons[user.role as keyof typeof roleIcons]
                                  return (
                                    <>
                                      <RoleIcon className="h-3 w-3 mr-1" />
                                      {user.role}
                                    </>
                                  )
                                })()}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex flex-wrap gap-1">
                                {assignedQueues.map((userQueue) => (
                                  <Badge 
                                    key={userQueue.id} 
                                    variant={userQueue.queue.isDefault ? "secondary" : "outline"} 
                                    className="text-xs flex items-center gap-1 py-1"
                                  >
                                    {userQueue.queue.name}
                                    {userQueue.queue.isDefault && (
                                      <span className="text-xs opacity-60">(default)</span>
                                    )}
                                    {!userQueue.queue.isDefault && (
                                      <button
                                        onClick={() => handleRemoveUserFromQueue(user.id, userQueue.queueId)}
                                        className="ml-1 hover:bg-red-100 rounded"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </Badge>
                                ))}
                                {assignedQueues.length === 0 && (
                                  <span className="text-xs text-muted-foreground">No queues assigned</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="shrink-0 ml-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-auto min-w-[100px] justify-between text-left font-normal"
                              >
                                Add queue
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Command>
                                <CommandEmpty>No queues available.</CommandEmpty>
                                <CommandList>
                                  <CommandGroup>
                                    {availableQueues.map((queue) => {
                                      const IconComponent = getIconComponent(queue.icon)
                                      const isAlreadyAssigned = assignedQueues.some(aq => aq.queueId === queue.id)
                                      const isDefault = queue.isDefault
                                      
                                      return (
                                        <CommandItem
                                          key={queue.id}
                                          onSelect={() => {
                                            if (isDefault) return // Can't toggle default queues
                                            
                                            if (isAlreadyAssigned) {
                                              handleRemoveUserFromQueue(user.id, queue.id)
                                            } else {
                                              handleAssignUserToQueue(user.id, queue.id)
                                            }
                                          }}
                                          disabled={isDefault}
                                        >
                                          <div className="flex items-center gap-2 flex-1">
                                            {isAlreadyAssigned && (
                                              <Check className="h-4 w-4 text-primary" />
                                            )}
                                            <div style={{ color: queue.color }}>
                                              <IconComponent className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                              <span style={{ color: queue.color }}>{queue.name}</span>
                                            </div>
                                            {isDefault && (
                                              <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                                                Default
                                              </Badge>
                                            )}
                                          </div>
                                        </CommandItem>
                                      )
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">No users found</h4>
                    <p className="text-xs text-muted-foreground">Try adjusting your search terms</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}