'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/shadcn-io/combobox'
import { Clock, Timer, AlertCircle, AlertTriangle, User, Mail, FileText, Plus, Upload, X, Image, ArrowRight, CheckCircle2, Zap, TrendingUp, Calendar, Bell, Inbox, Folder, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { UserAvatar } from '@/components/ui/user-avatar'
import { DatePicker } from '@/components/ui/date-picker'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { normalizeDateToMidnight } from '@/lib/date-utils'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone'

interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
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
    TrendingUp,
    Inbox,
    Folder,
    Circle
  }
  return iconMap[iconName] || AlertCircle
}

export function CreateTicketDialog() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [priorities, setPriorities] = useState<CustomPriority[]>([])
  const [queues, setQueues] = useState<Array<{id: string, name: string, color: string, icon: string}>>([])
  const [priority, setPriority] = useState<string>('Medium')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [selectedQueue, setSelectedQueue] = useState<string>('no-queue')
  const [attachments, setAttachments] = useState<File[]>([])
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [reminderDate, setReminderDate] = useState<Date | undefined>(undefined)

  const handleAssigneeChange = (value: string) => {
    setAssignedTo(value)
  }

  const handleFileChange = (files: File[]) => {
    setAttachments(prev => [...prev, ...files])
  }

  const handleFileError = (error: Error) => {
    toast.error(error.message || 'Error uploading files')
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  useEffect(() => {
    // Load users, priorities, and queues
    const fetchData = async () => {
      try {
        const [usersResponse, prioritiesResponse, queuesResponse] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/priorities'),
          fetch('/api/users/queues') // Get user's assigned queues + default queues
        ])
        
        if (usersResponse.ok) {
          const userData = await usersResponse.json()
          setUsers(userData)
        }
        
        if (prioritiesResponse.ok) {
          const priorityData = await prioritiesResponse.json()
          setPriorities(priorityData)
          // Set default priority to first priority or 'Medium'
          if (priorityData.length > 0) {
            const defaultPriority = priorityData.find((p: CustomPriority) => p.name === 'Medium') || priorityData[0]
            setPriority(defaultPriority.name)
          }
        }

        if (queuesResponse.ok) {
          const userQueueData = await queuesResponse.json()
          // Extract just the queue data from user queue assignments
          const queueData = userQueueData.map((uq: { queue: {id: string, name: string, color: string, icon: string} }) => uq.queue)
          setQueues(queueData)
          // Set default queue if available
          const defaultQueue = queueData.find((q: {id: string, name: string, color: string, icon: string, isDefault: boolean}) => q.isDefault)
          if (defaultQueue) {
            setSelectedQueue(defaultQueue.id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    
    if (open) {
      fetchData()
    }
  }, [open])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    
    try {
      // Upload attachments first if any
      let uploadedFiles: Array<{filename: string, filepath: string, mimetype: string, size: number}> = []
      
      if (attachments.length > 0) {
        const uploadFormData = new FormData()
        attachments.forEach(file => {
          uploadFormData.append('files', file)
        })

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          uploadedFiles = uploadResult.files
        }
      }

      // Create ticket with attachments
      const response = await fetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: formData.get('subject'),
          description: formData.get('description'),
          fromEmail: formData.get('fromEmail') || 'internal@support.com',
          fromName: formData.get('fromName') || 'Internal Support',
          priority: priority,
          queueId: selectedQueue && selectedQueue !== 'no-queue' ? selectedQueue : null,
          assignedTo: assignedTo || null,
          attachments: uploadedFiles,
          dueDate: dueDate ? normalizeDateToMidnight(dueDate)?.toISOString() : null,
          reminderDate: reminderDate ? reminderDate.toISOString() : null,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to create ticket')
      }

      const createdTicket = await response.json()

      // Reset form and close dialog on success
      const defaultPriority = priorities.find(p => p.name === 'Medium') || priorities[0]
      setPriority(defaultPriority?.name || 'Medium')
      setAssignedTo('')
      setSelectedQueue('no-queue')
      setAttachments([])
      setDueDate(undefined)
      setReminderDate(undefined)
      setOpen(false)
      
      toast.success('Ticket created successfully', {
        description: `Ticket ${createdTicket.ticketNumber || createdTicket.id} has been created.`
      })
      
      router.refresh()
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error('Failed to create ticket', {
        description: 'Please try again or contact support if the problem persists.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="ml-auto">
          New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] m-4 p-0 overflow-hidden flex flex-col gap-0">
        <div className="p-6 border-b flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Ticket
            </DialogTitle>
            <DialogDescription>
              Create a new support ticket. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-500">
            <div className="p-6 space-y-6">
              {/* Ticket Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Ticket Information
                </h4>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Brief description of the issue"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Detailed description of the problem or request"
                      rows={4}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Ticket Details</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Priority</Label>
                    <Select value={priority} onValueChange={(value: string) => setPriority(value)}>
                      <SelectTrigger className={priorities.find(p => p.name === priority)?.color || ''}>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priorityOption) => {
                          const IconComponent = getIconComponent(priorityOption.icon)
                          return (
                            <SelectItem key={priorityOption.id} value={priorityOption.name}>
                              <span className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                <span>{priorityOption.name}</span>
                              </span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Queue</Label>
                    <Select value={selectedQueue} onValueChange={(value: string) => setSelectedQueue(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select queue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-queue">
                          <span className="flex items-center gap-2">
                            <span>No Queue</span>
                          </span>
                        </SelectItem>
                        {queues.map((queue) => {
                          const IconComponent = getIconComponent(queue.icon)
                          return (
                            <SelectItem key={queue.id} value={queue.id}>
                              <span className="flex items-center gap-2">
                                <div style={{ color: queue.color }}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <span>{queue.name}</span>
                              </span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Assigned to</Label>
                    <Combobox
                      data={[
                        { label: 'Unassigned', value: '' },
                        ...users.map(user => ({
                          label: user.name,
                          value: user.id
                        }))
                      ]}
                      type="assignee"
                      defaultValue={assignedTo}
                      onValueChange={handleAssigneeChange}
                    >
                      <ComboboxTrigger className="w-full">
                        {assignedTo ? (
                          users.find(user => user.id === assignedTo) ? (
                            <span className="flex items-center gap-2">
                              <UserAvatar 
                                user={{
                                  name: users.find(user => user.id === assignedTo)?.name,
                                  email: users.find(user => user.id === assignedTo)?.email,
                                  avatarUrl: users.find(user => user.id === assignedTo)?.avatarUrl
                                }}
                                size="sm"
                              />
                              {users.find(user => user.id === assignedTo)?.name}
                            </span>
                          ) : (
                            "Select user"
                          )
                        ) : (
                          "Unassigned"
                        )}
                      </ComboboxTrigger>
                      <ComboboxContent className="p-0">
                        <ComboboxInput placeholder="Search users..." />
                        <ComboboxEmpty>No users found</ComboboxEmpty>
                        <ComboboxList>
                          <ComboboxGroup>
                            <ComboboxItem value="">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Unassigned</span>
                              </div>
                            </ComboboxItem>
                            {users.map((user) => (
                              <ComboboxItem key={user.id} value={user.id}>
                                <div className="flex items-center gap-2">
                                  <UserAvatar 
                                    user={{
                                      name: user.name,
                                      email: user.email,
                                      avatarUrl: user.avatarUrl
                                    }}
                                    size="sm"
                                  />
                                  <span>{user.name}</span>
                                </div>
                              </ComboboxItem>
                            ))}
                          </ComboboxGroup>
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Due Date (optional)
                    </Label>
                    <DatePicker
                      date={dueDate}
                      setDate={setDueDate}
                      placeholder="Select due date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminderDate" className="text-sm font-medium flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Reminder Date & Time (optional)
                    </Label>
                    <DateTimePicker
                      date={reminderDate}
                      setDate={setReminderDate}
                      placeholder="Select reminder date & time"
                    />
                  </div>
                </div>
              </div>

              {/* Requester Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Requester (optional)
                </h4>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fromEmail" className="text-sm font-medium">Email</Label>
                    <Input
                      id="fromEmail"
                      name="fromEmail"
                      type="email"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fromName" className="text-sm font-medium">Name</Label>
                    <Input
                      id="fromName"
                      name="fromName"
                      placeholder="Requester's name"
                    />
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Attachments (optional)
                </h4>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Upload Files</Label>
                    <Dropzone
                      onDrop={handleFileChange}
                      onError={handleFileError}
                      accept={{
                        'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
                        'application/pdf': ['.pdf'],
                        'application/msword': ['.doc'],
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                        'text/plain': ['.txt'],
                        'application/zip': ['.zip'],
                        'application/x-rar-compressed': ['.rar']
                      }}
                      maxSize={10 * 1024 * 1024} // 10MB
                      multiple
                      className="min-h-[80px]"
                    >
                      <DropzoneEmptyState>
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground mb-1">
                            <Upload size={14} />
                          </div>
                          <p className="font-medium text-sm">
                            Upload attachments
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Drag and drop or click to upload
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Images, documents, archives (Max 10MB each)
                          </p>
                        </div>
                      </DropzoneEmptyState>
                      <DropzoneContent />
                    </Dropzone>
                  </div>
                  
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Selected Files:</Label>
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t flex-shrink-0">
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Ticket'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}