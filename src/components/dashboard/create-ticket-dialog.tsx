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
import { Clock, Timer, AlertCircle, AlertTriangle, User, Mail, FileText, Plus, Upload, X, Image } from 'lucide-react'
import { Priority, TicketStatus } from '@prisma/client'

interface User {
  id: string
  name: string
  email: string
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  URGENT: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
}

const priorityIcons = {
  LOW: <Clock className="h-4 w-4" />,
  MEDIUM: <Timer className="h-4 w-4" />,
  HIGH: <AlertCircle className="h-4 w-4" />,
  URGENT: <AlertTriangle className="h-4 w-4" />,
}

export function CreateTicketDialog() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [attachments, setAttachments] = useState<File[]>([])

  const handleAssigneeChange = (value: string) => {
    setAssignedTo(value)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachments(prev => [...prev, ...files])
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
    // Lade verfügbare Benutzer für die Zuweisung
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const userData = await response.json()
          setUsers(userData)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }
    
    if (open) {
      fetchUsers()
    }
  }, [open])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: formData.get('subject'),
          description: formData.get('description'),
          fromEmail: formData.get('fromEmail') || 'internal@support.com',
          fromName: formData.get('fromName') || 'Internal Support',
          priority: priority,
          assignedTo: assignedTo || null,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to create ticket')
      }

      // Reset form and close dialog on success
      setPriority('MEDIUM')
      setAssignedTo('')
      setAttachments([])
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error creating ticket:', error)
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
                    <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
                      <SelectTrigger className={priorityColors[priority]}>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">
                          <span className="flex items-center gap-2">
                            {priorityIcons.LOW}
                            <span>Low</span>
                          </span>
                        </SelectItem>
                        <SelectItem value="MEDIUM">
                          <span className="flex items-center gap-2">
                            {priorityIcons.MEDIUM}
                            <span>Medium</span>
                          </span>
                        </SelectItem>
                        <SelectItem value="HIGH">
                          <span className="flex items-center gap-2">
                            {priorityIcons.HIGH}
                            <span>High</span>
                          </span>
                        </SelectItem>
                        <SelectItem value="URGENT">
                          <span className="flex items-center gap-2">
                            {priorityIcons.URGENT}
                            <span>Urgent</span>
                          </span>
                        </SelectItem>
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
                              <User className="h-4 w-4" />
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
                                  <User className="h-4 w-4" />
                                  <span>{user.name}</span>
                                </div>
                              </ComboboxItem>
                            ))}
                          </ComboboxGroup>
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
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
                    <Label htmlFor="attachments" className="text-sm font-medium">Upload Files</Label>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="attachments"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Images, documents, archives (MAX. 10MB each)
                          </p>
                        </div>
                        <input
                          id="attachments"
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
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