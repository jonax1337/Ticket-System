'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  Info,
  FileText,
  Code,
  Globe,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface EmailTemplate {
  id: string
  type: string
  name: string
  subject: string
  htmlContent: string
  textContent: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const templateTypes = [
  { value: 'ticket_created', label: 'Ticket Created', description: 'Sent when a new ticket is created' },
  { value: 'status_changed', label: 'Status Changed', description: 'Sent when ticket status is updated' },
  { value: 'comment_added', label: 'Comment Added', description: 'Sent when a new comment is added' },
  { value: 'participant_added', label: 'Participant Added', description: 'Sent when someone is added as participant' }
]

const availableVariables = {
  // Ticket information
  'ticketNumber': 'Unique ticket identifier (e.g., T-123456)',
  'ticketSubject': 'Subject/title of the ticket',
  'ticketDescription': 'Original ticket description/content',
  'ticketStatus': 'Current status of the ticket',
  'ticketPriority': 'Priority level of the ticket',
  'ticketCreatedAt': 'When the ticket was created',
  'ticketUpdatedAt': 'When the ticket was last updated',
  'ticketUrl': 'Direct link to view the ticket',
  
  // User/Customer information
  'customerName': 'Name of the ticket creator/customer',
  'customerEmail': 'Email of the ticket creator/customer',
  'assignedToName': 'Name of the assigned support agent',
  'assignedToEmail': 'Email of the assigned support agent',
  'actorName': 'Name of the person who performed the action',
  'actorEmail': 'Email of the person who performed the action',
  
  // Status change specific
  'previousStatus': 'Previous status before the change',
  'newStatus': 'New status after the change',
  'statusChangeReason': 'Optional reason for status change',
  
  // Comment specific
  'commentContent': 'Content of the new comment',
  'commentAuthor': 'Name of the comment author',
  'commentCreatedAt': 'When the comment was posted',
  
  // Participant specific
  'participantName': 'Name of the participant being added',
  'participantEmail': 'Email of the participant being added',
  'participantType': 'Type of participant (creator, cc, added_manually)',
  
  // System information
  'systemName': 'Name of the support system',
  'supportEmail': 'Main support email address',
  'supportUrl': 'URL to the support system',
  'unsubscribeUrl': 'URL to unsubscribe from notifications',
  
  // Additional context
  'additionalNotes': 'Any additional notes or context',
  'currentDate': 'Current date when email is sent',
  'currentTime': 'Current time when email is sent'
}

export default function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [previewData, setPreviewData] = useState<{
    subject: string;
    htmlContent: string;
    textContent?: string;
    sampleData: Record<string, unknown>;
  } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    isActive: true
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      } else {
        toast.error('Failed to fetch email templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to fetch email templates')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      type: '',
      name: '',
      subject: '',
      htmlContent: '',
      textContent: '',
      isActive: true
    })
  }

  const openEditDialog = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        type: template.type,
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent || '',
        isActive: template.isActive
      })
    } else {
      setEditingTemplate(null)
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const url = editingTemplate 
        ? `/api/admin/email-templates/${editingTemplate.id}`
        : '/api/admin/email-templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        resetForm()
        toast.success(
          editingTemplate ? 'Email template updated successfully' : 'Email template created successfully'
        )
        fetchTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save email template')
      }
    } catch (err) {
      console.error('Failed to save email template:', err)
      toast.error('Failed to save email template')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Email template deleted successfully')
        fetchTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete email template')
      }
    } catch (err) {
      console.error('Failed to delete email template:', err)
      toast.error('Failed to delete email template')
    }
  }

  const handlePreview = async (template: EmailTemplate) => {
    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewData(data)
        setIsPreviewOpen(true)
      } else {
        toast.error('Failed to generate preview')
      }
    } catch (error) {
      console.error('Error generating preview:', error)
      toast.error('Failed to generate preview')
    }
  }

  const handleDuplicate = (template: EmailTemplate) => {
    setEditingTemplate(null)
    setFormData({
      type: template.type,
      name: `${template.name} (Copy)`,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || '',
      isActive: true
    })
    setIsDialogOpen(true)
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ticket_created': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'status_changed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'comment_added': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'participant_added': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const insertVariable = (variable: string) => {
    const htmlTextarea = document.getElementById('htmlContent') as HTMLTextAreaElement
    if (htmlTextarea) {
      const start = htmlTextarea.selectionStart
      const end = htmlTextarea.selectionEnd
      const text = htmlTextarea.value
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const newText = before + `{{${variable}}}` + after
      
      setFormData({ ...formData, htmlContent: newText })
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        htmlTextarea.focus()
        htmlTextarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
      }, 0)
    }
  }

  if (isLoading && templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading templates...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Manage customizable email templates for different ticket actions. Use variables to personalize content.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openEditDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl w-full max-h-[90vh] m-4 p-0 overflow-hidden flex flex-col gap-0">
                <div className="p-6 border-b flex-shrink-0">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      {editingTemplate ? 'Edit Email Template' : 'New Email Template'}
                    </DialogTitle>
                    <DialogDescription>
                      Create customizable email templates with variables for dynamic content.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                
                <div className="flex-1 overflow-hidden flex">
                  {/* Main Form */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Settings */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Basic Settings</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">Template Type</Label>
                          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type..." />
                            </SelectTrigger>
                            <SelectContent>
                              {templateTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div>
                                    <div className="font-medium">{type.label}</div>
                                    <div className="text-xs text-muted-foreground">{type.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Template Name</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Welcome New Customer"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject">Email Subject</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="e.g. Ticket {{ticketNumber}} Created: {{ticketSubject}}"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                        />
                        <Label htmlFor="isActive">Active Template</Label>
                      </div>
                    </div>

                    <Separator />

                    {/* Content */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Email Content</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="htmlContent">HTML Content</Label>
                        <Textarea
                          id="htmlContent"
                          value={formData.htmlContent}
                          onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                          placeholder="Enter HTML email content with variables..."
                          className="min-h-[200px] font-mono text-sm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="textContent">Plain Text Content (Optional)</Label>
                        <Textarea
                          id="textContent"
                          value={formData.textContent}
                          onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                          placeholder="Plain text fallback content..."
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Variables Sidebar */}
                  <div className="w-80 border-l bg-muted/30 overflow-y-auto p-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <h4 className="text-sm font-medium">Available Variables</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click on a variable to insert it into your template. Variables are replaced with actual data when emails are sent.
                      </p>
                      
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {Object.entries(availableVariables).map(([variable, description]) => (
                            <div
                              key={variable}
                              className="p-2 border rounded cursor-pointer hover:bg-background transition-colors"
                              onClick={() => insertVariable(variable)}
                            >
                              <code className="text-xs font-mono text-blue-600 dark:text-blue-400">
                                {`{{${variable}}}`}
                              </code>
                              <p className="text-xs text-muted-foreground mt-1">{description}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t flex-shrink-0">
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Template'}
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No Email Templates</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first email template to customize customer notifications.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {templateTypes.map((templateType) => {
                const typeTemplates = templates.filter(t => t.type === templateType.value)
                
                return (
                  <div key={templateType.value} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getTypeBadgeColor(templateType.value)}>
                        {templateType.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{templateType.description}</span>
                    </div>
                    
                    {typeTemplates.length === 0 ? (
                      <div className="border rounded-lg p-4 bg-muted/20">
                        <p className="text-sm text-muted-foreground">No templates for this type</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {typeTemplates.map((template) => (
                          <div key={template.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{template.name}</h3>
                                  <div className="flex gap-1">
                                    {template.isDefault && (
                                      <Badge variant="outline" className="text-xs">
                                        <Settings className="mr-1 h-3 w-3" />
                                        Default
                                      </Badge>
                                    )}
                                    {template.isActive ? (
                                      <Badge variant="default" className="text-xs">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Active
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">
                                        <XCircle className="mr-1 h-3 w-3" />
                                        Inactive
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-sm text-muted-foreground">
                                  <div className="font-medium">{template.subject}</div>
                                  <div className="text-xs">
                                    Updated: {new Date(template.updatedAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePreview(template)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Preview
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDuplicate(template)}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </Button>

                                {!template.isDefault && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEditDialog(template)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </Button>

                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete the template &quot;{template.name}&quot;? 
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDelete(template.id)}
                                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                                          >
                                            Delete Template
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] m-4 p-0 overflow-hidden flex flex-col gap-0">
          <div className="p-6 border-b flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Email Template Preview
              </DialogTitle>
              <DialogDescription>
                Preview how the email will look with sample data
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {previewData && (
              <Tabs defaultValue="html" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="html" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    HTML Preview
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Plain Text
                  </TabsTrigger>
                  <TabsTrigger value="source" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    HTML Source
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="html" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subject:</Label>
                    <div className="p-3 bg-muted rounded font-mono text-sm">
                      {previewData.subject}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email Content:</Label>
                    <div 
                      className="border rounded p-4 bg-white dark:bg-slate-900"
                      dangerouslySetInnerHTML={{ __html: previewData.htmlContent }}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subject:</Label>
                    <div className="p-3 bg-muted rounded font-mono text-sm">
                      {previewData.subject}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Plain Text Content:</Label>
                    <div className="border rounded p-4 bg-muted/30">
                      <pre className="whitespace-pre-wrap text-sm">
                        {previewData.textContent || 'No plain text content available'}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="source" className="space-y-4">
                  <div className="space-y-2">
                    <Label>HTML Source:</Label>
                    <div className="border rounded p-4 bg-muted/30">
                      <pre className="whitespace-pre-wrap text-xs font-mono overflow-x-auto">
                        {previewData.htmlContent}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
          
          <div className="p-6 border-t flex-shrink-0">
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Close Preview
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}