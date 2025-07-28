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
import { Plus, Edit, Trash2, GripVertical, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { IconSelect, ColorSelect, IconBadge } from '@/components/ui/icon-components'
import { getIconByValue, renderIcon } from '@/lib/icon-map'
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



export default function CustomPriorityManager() {
  const [priorities, setPriorities] = useState<CustomPriority[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPriority, setEditingPriority] = useState<CustomPriority | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Clock',
    color: 'gray'
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
          color: 'gray'
        })
        toast.success(
          editingPriority ? 'Priority updated successfully' : 'Priority created successfully'
        )
      } else {
        toast.error('Failed to save priority')
      }
    } catch (error) {
      console.error('Error saving priority:', error)
      toast.error('Failed to save priority')
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
      toast.error('Cannot delete default priority')
      return
    }

    try {
      const response = await fetch(`/api/admin/custom-priorities/${priority.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchPriorities()
        toast.success('Priority deleted successfully')
      } else {
        toast.error('Failed to delete priority')
      }
    } catch (error) {
      console.error('Error deleting priority:', error)
      toast.error('Failed to delete priority')
    }
  }

  const getIconComponent = (iconName: string) => {
    return renderIcon(iconName, "h-4 w-4")
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
          <IconBadge icon={priority.icon} color={priority.color}>
            {priority.name}
          </IconBadge>
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Priority</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the &quot;{priority.name}&quot; priority? 
                      This action cannot be undone and may affect existing tickets using this priority.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(priority)}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                    >
                      Delete Priority
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {renderIcon('Settings', 'h-5 w-5')}
                Priority Configuration
              </CardTitle>
              <CardDescription>
                Manage ticket priorities and their display properties.<br />Drag to reorder.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPriority(null)
                  setFormData({
                    name: '',
                    icon: 'Clock',
                    color: 'gray'
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
                    <IconSelect 
                      value={formData.icon}
                      onValueChange={(value) => setFormData({ ...formData, icon: value })}
                      placeholder="Select an icon..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="color">Color Theme</Label>
                    <ColorSelect 
                      value={formData.color}
                      onValueChange={(value) => setFormData({ ...formData, color: value })}
                      placeholder="Select a color..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label>Preview:</Label>
                    <IconBadge icon={formData.icon} color={formData.color}>
                      {formData.name || 'Priority Name'}
                    </IconBadge>
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
          {/* Silent loading indicator */}
          {isLoading && priorities.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Updating priorities...</span>
            </div>
          )}
          
          {priorities.length === 0 ? (
            <div className="text-center py-8">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading priorities...</p>
                </>
              ) : (
                <>
                  {renderIcon('Clock', 'h-12 w-12 text-muted-foreground/50 mx-auto mb-3')}
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">No priorities configured</h4>
                  <p className="text-xs text-muted-foreground">Add your first priority to get started</p>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}