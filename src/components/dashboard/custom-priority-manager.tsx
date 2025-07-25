'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Clock, Timer, AlertCircle, AlertTriangle, Zap, TrendingUp, GripVertical } from 'lucide-react'
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

interface CustomPriority {
  id: string
  name: string
  icon: string
  color: string
  order: number
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const iconOptions = [
  { name: 'Clock', value: 'Clock', component: Clock },
  { name: 'Timer', value: 'Timer', component: Timer },
  { name: 'Alert Circle', value: 'AlertCircle', component: AlertCircle },
  { name: 'Alert Triangle', value: 'AlertTriangle', component: AlertTriangle },
  { name: 'Zap', value: 'Zap', component: Zap },
  { name: 'Trending Up', value: 'TrendingUp', component: TrendingUp },
]

const colorOptions = [
  { name: 'Gray', value: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800' },
  { name: 'Yellow', value: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' },
  { name: 'Orange', value: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' },
  { name: 'Red', value: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  { name: 'Blue', value: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  { name: 'Green', value: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
]

export default function CustomPriorityManager() {
  const [priorities, setPriorities] = useState<CustomPriority[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPriority, setEditingPriority] = useState<CustomPriority | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Clock',
    color: colorOptions[0].value
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    initAndFetchPriorities()
  }, [])

  const initAndFetchPriorities = async () => {
    try {
      // Initialize defaults first
      await fetch('/api/admin/custom-priorities/init', { method: 'POST' })
      // Then fetch all priorities
      await fetchPriorities()
    } catch (error) {
      console.error('Error initializing priorities:', error)
      setIsLoading(false)
    }
  }

  const fetchPriorities = async () => {
    try {
      const response = await fetch('/api/admin/custom-priorities')
      if (response.ok) {
        const data = await response.json()
        setPriorities(data)
      }
    } catch (error) {
      console.error('Error fetching priorities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = priorities.findIndex((priority) => priority.id === active.id)
      const newIndex = priorities.findIndex((priority) => priority.id === over?.id)

      const newPriorities = arrayMove(priorities, oldIndex, newIndex)
      setPriorities(newPriorities)

      // Update order in database
      try {
        await Promise.all(
          newPriorities.map((priority, index) =>
            fetch(`/api/admin/custom-priorities/${priority.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: priority.name,
                icon: priority.icon,
                color: priority.color,
                order: index + 1,
              }),
            })
          )
        )
      } catch (error) {
        console.error('Error updating priority order:', error)
        // Revert the change on error
        fetchPriorities()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingPriority 
        ? `/api/admin/custom-priorities/${editingPriority.id}`
        : '/api/admin/custom-priorities'
      
      const method = editingPriority ? 'PUT' : 'POST'
      
      const priorityData = editingPriority 
        ? formData 
        : { ...formData, order: priorities.length + 1 }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(priorityData),
      })

      if (response.ok) {
        await fetchPriorities()
        setIsDialogOpen(false)
        setEditingPriority(null)
        setFormData({
          name: '',
          icon: 'Clock',
          color: colorOptions[0].value
        })
      }
    } catch (error) {
      console.error('Error saving priority:', error)
    }
  }

  const handleEdit = (priority: CustomPriority) => {
    setEditingPriority(priority)
    setFormData({
      name: priority.name,
      icon: priority.icon,
      color: priority.color
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (priority: CustomPriority) => {
    if (priority.isDefault) {
      alert('Cannot delete default priority')
      return
    }

    if (confirm(`Are you sure you want to delete the "${priority.name}" priority?`)) {
      try {
        const response = await fetch(`/api/admin/custom-priorities/${priority.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchPriorities()
        }
      } catch (error) {
        console.error('Error deleting priority:', error)
      }
    }
  }

  const getIconComponent = (iconName: string) => {
    const icon = iconOptions.find(opt => opt.value === iconName)
    return icon ? icon.component : Clock
  }

  // Sortable Item Component
  const SortablePriorityRow = ({ priority }: { priority: CustomPriority }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: priority.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    const IconComponent = getIconComponent(priority.icon)

    return (
      <TableRow ref={setNodeRef} style={style} {...attributes}>
        <TableCell>
          <div className="flex items-center gap-2">
            <div {...listeners} className="cursor-grab hover:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="font-medium">{priority.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={priority.color}>
            <IconComponent className="h-3 w-3 mr-1" />
            {priority.name}
          </Badge>
        </TableCell>
        <TableCell>
          {priority.isDefault ? (
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
              onClick={() => handleEdit(priority)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {!priority.isDefault && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(priority)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Priority Configuration</CardTitle>
              <CardDescription>
                Manage ticket priorities and their display properties. Drag to reorder.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPriority(null)
                  setFormData({
                    name: '',
                    icon: 'Clock',
                    color: colorOptions[0].value
                  })
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Priority
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPriority ? 'Edit Priority' : 'Add New Priority'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure the priority name, icon, and color scheme.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Priority Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Critical"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="icon">Icon</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((option) => {
                          const IconComponent = option.component
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {option.name}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="color">Color Theme</Label>
                    <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${option.value.split(' ')[0]}`} />
                              {option.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>


                  <div className="flex items-center gap-2">
                    <Label>Preview:</Label>
                    <Badge variant="outline" className={formData.color}>
                      {React.createElement(getIconComponent(formData.icon), { className: "h-3 w-3 mr-1" })}
                      {formData.name || 'Priority Name'}
                    </Badge>
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
                      {editingPriority ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext items={priorities.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {priorities.map((priority) => (
                    <SortablePriorityRow key={priority.id} priority={priority} />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  )
}