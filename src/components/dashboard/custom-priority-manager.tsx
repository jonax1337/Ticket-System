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
import { Plus, Edit, Trash2, Clock, GripVertical, RefreshCw } from 'lucide-react'
import { IconPicker } from '@/components/ui/enhanced-icon-picker'
import { getIconComponent } from '@/lib/icon-system'
import { toast } from 'sonner'
import { useCache } from '@/lib/cache-context'
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

// Removed - using enhanced icon picker with all available icons from icon-system

const colorOptions = [
  { name: 'Gray', value: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800', hex: '#6b7280' },
  { name: 'Slate', value: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800', hex: '#64748b' },
  { name: 'Zinc', value: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-400 dark:border-zinc-800', hex: '#71717a' },
  { name: 'Red', value: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', hex: '#ef4444' },
  { name: 'Rose', value: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800', hex: '#f43f5e' },
  { name: 'Pink', value: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800', hex: '#ec4899' },
  { name: 'Orange', value: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800', hex: '#f97316' },
  { name: 'Amber', value: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', hex: '#f59e0b' },
  { name: 'Yellow', value: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800', hex: '#eab308' },
  { name: 'Lime', value: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-400 dark:border-lime-800', hex: '#84cc16' },
  { name: 'Green', value: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', hex: '#22c55e' },
  { name: 'Emerald', value: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800', hex: '#10b981' },
  { name: 'Teal', value: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800', hex: '#14b8a6' },
  { name: 'Cyan', value: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800', hex: '#06b6d4' },
  { name: 'Sky', value: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800', hex: '#0ea5e9' },
  { name: 'Blue', value: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', hex: '#3b82f6' },
  { name: 'Indigo', value: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800', hex: '#6366f1' },
  { name: 'Violet', value: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800', hex: '#8b5cf6' },
  { name: 'Purple', value: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800', hex: '#a855f7' },
  { name: 'Fuchsia', value: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:border-fuchsia-800', hex: '#d946ef' },
]

export default function CustomPriorityManager() {
  const { refreshCache } = useCache()
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
        await refreshCache() // Refresh cache after reordering
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
        await refreshCache() // Refresh cache after priority change
        setIsDialogOpen(false)
        setEditingPriority(null)
        setFormData({
          name: '',
          icon: 'Clock',
          color: colorOptions[0].value
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
        await refreshCache() // Refresh cache after priority deletion
        toast.success('Priority deleted successfully')
      } else {
        toast.error('Failed to delete priority')
      }
    } catch (error) {
      console.error('Error deleting priority:', error)
      toast.error('Failed to delete priority')
    }
  }

  // Use the icon system instead

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
                <Clock className="h-5 w-5" />
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
                      <Label htmlFor="color">Color Theme</Label>
                      <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {colorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: option.hex }}
                                />
                                {option.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>


                  <div className="flex items-center gap-2">
                    <Label>Preview:</Label>
                    <Badge variant="outline" className={formData.color}>
                      {(() => {
                        const IconComponent = getIconComponent(formData.icon)
                        return <IconComponent className="h-3 w-3 mr-1" />
                      })()}
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
                  <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
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