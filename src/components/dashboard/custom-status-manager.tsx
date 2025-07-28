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

interface CustomStatus {
  id: string
  name: string
  icon: string
  color: string
  order: number
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}



export default function CustomStatusManager() {
  const [statuses, setStatuses] = useState<CustomStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<CustomStatus | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: 'AlertCircle',
    color: 'gray'
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    initAndFetchStatuses()
  }, [])

  const initAndFetchStatuses = async () => {
    try {
      // Initialize defaults first
      await fetch('/api/admin/custom-statuses/init', { method: 'POST' })
      // Then fetch all statuses
      await fetchStatuses()
    } catch (error) {
      console.error('Error initializing statuses:', error)
      setIsLoading(false)
    }
  }

  const fetchStatuses = async () => {
    try {
      const response = await fetch('/api/admin/custom-statuses')
      if (response.ok) {
        const data = await response.json()
        setStatuses(data)
      }
    } catch (error) {
      console.error('Error fetching statuses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = statuses.findIndex((status) => status.id === active.id)
      const newIndex = statuses.findIndex((status) => status.id === over?.id)

      const newStatuses = arrayMove(statuses, oldIndex, newIndex)
      setStatuses(newStatuses)

      // Update order in database
      try {
        await Promise.all(
          newStatuses.map((status, index) =>
            fetch(`/api/admin/custom-statuses/${status.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: status.name,
                icon: status.icon,
                color: status.color,
                order: index + 1,
              }),
            })
          )
        )
      } catch (error) {
        console.error('Error updating status order:', error)
        // Revert the change on error
        fetchStatuses()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingStatus 
        ? `/api/admin/custom-statuses/${editingStatus.id}`
        : '/api/admin/custom-statuses'
      
      const method = editingStatus ? 'PUT' : 'POST'
      
      const statusData = editingStatus 
        ? formData 
        : { ...formData, order: statuses.length + 1 }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusData),
      })

      if (response.ok) {
        await fetchStatuses()
        setIsDialogOpen(false)
        setEditingStatus(null)
        setFormData({
          name: '',
          icon: 'AlertCircle',
          color: 'gray'
        })
        toast.success(
          editingStatus ? 'Status updated successfully' : 'Status created successfully'
        )
      } else {
        toast.error('Failed to save status')
      }
    } catch (error) {
      console.error('Error saving status:', error)
      toast.error('Failed to save status')
    }
  }

  const handleEdit = (status: CustomStatus) => {
    setEditingStatus(status)
    setFormData({
      name: status.name,
      icon: status.icon,
      color: status.color
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (status: CustomStatus) => {
    if (status.isDefault) {
      toast.error('Cannot delete default status')
      return
    }

    try {
      const response = await fetch(`/api/admin/custom-statuses/${status.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchStatuses()
        toast.success('Status deleted successfully')
      } else {
        toast.error('Failed to delete status')
      }
    } catch (error) {
      console.error('Error deleting status:', error)
      toast.error('Failed to delete status')
    }
  }

  const getIconComponent = (iconName: string) => {
    return renderIcon(iconName, "h-4 w-4")
  }

  // Sortable Item Component
  const SortableStatusRow = ({ status }: { status: CustomStatus }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: status.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    const IconComponent = getIconComponent(status.icon)

    return (
      <TableRow ref={setNodeRef} style={style} {...attributes}>
        <TableCell>
          <div className="flex items-center gap-2">
            <div {...listeners} className="cursor-grab hover:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="font-medium">{status.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <IconBadge icon={status.icon} color={status.color}>
            {status.name}
          </IconBadge>
        </TableCell>
        <TableCell>
          {status.isDefault ? (
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
              onClick={() => handleEdit(status)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {!status.isDefault && (
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
                    <AlertDialogTitle>Delete Status</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the &quot;{status.name}&quot; status? 
                      This action cannot be undone and may affect existing tickets using this status.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(status)}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                    >
                      Delete Status
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
                Status Configuration
              </CardTitle>
              <CardDescription>
                Manage ticket statuses and their display properties.<br />Drag to reorder.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingStatus(null)
                  setFormData({
                    name: '',
                    icon: 'AlertCircle',
                    color: 'gray'
                  })
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingStatus ? 'Edit Status' : 'Add New Status'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure the status name, icon, and color scheme.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Status Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., In Review"
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
                      {formData.name || 'Status Name'}
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
                      {editingStatus ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Silent loading indicator */}
          {isLoading && statuses.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Updating statuses...</span>
            </div>
          )}
          
          {statuses.length === 0 ? (
            <div className="text-center py-8">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading statuses...</p>
                </>
              ) : (
                <>
                  {renderIcon('AlertCircle', 'h-12 w-12 text-muted-foreground/50 mx-auto mb-3')}
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">No statuses configured</h4>
                  <p className="text-xs text-muted-foreground">Add your first status to get started</p>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext items={statuses.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {statuses.map((status) => (
                      <SortableStatusRow key={status.id} status={status} />
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