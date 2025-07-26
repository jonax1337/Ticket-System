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
import { Plus, Edit, Trash2, AlertCircle, ArrowRight, CheckCircle2, Clock, Timer, AlertTriangle, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
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

const iconOptions = [
  { name: 'Alert Circle', value: 'AlertCircle', component: AlertCircle },
  { name: 'Arrow Right', value: 'ArrowRight', component: ArrowRight },
  { name: 'Check Circle', value: 'CheckCircle2', component: CheckCircle2 },
  { name: 'Clock', value: 'Clock', component: Clock },
  { name: 'Timer', value: 'Timer', component: Timer },
  { name: 'Alert Triangle', value: 'AlertTriangle', component: AlertTriangle },
]

const colorOptions = [
  { name: 'Gray', value: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800' },
  { name: 'Orange', value: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' },
  { name: 'Blue', value: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  { name: 'Green', value: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
  { name: 'Red', value: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  { name: 'Yellow', value: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' },
]

export default function CustomStatusManager() {
  const [statuses, setStatuses] = useState<CustomStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<CustomStatus | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: 'AlertCircle',
    color: colorOptions[0].value
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
          color: colorOptions[0].value
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
    const icon = iconOptions.find(opt => opt.value === iconName)
    return icon ? icon.component : AlertCircle
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
          <Badge variant="outline" className={status.color}>
            <IconComponent className="h-3 w-3 mr-1" />
            {status.name}
          </Badge>
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

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status Configuration</CardTitle>
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
                    color: colorOptions[0].value
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
                      {formData.name || 'Status Name'}
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
                      {editingStatus ? 'Update' : 'Create'}
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
        </CardContent>
      </Card>
    </div>
  )
}