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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Mail, 
  Edit, 
  Eye,
  Info,
  FileText,
  Code,
  Globe,
  CheckCircle,
  XCircle,
  Settings,
  RefreshCw,
  FileType,
  Save,
  Palette
} from 'lucide-react'
import { toast } from 'sonner'

interface BaseTemplateConfig {
  id: string
  subjectPrefix: string
  htmlTemplate: string
  isActive: boolean
  systemName: string
  createdAt: string
  updatedAt: string
}

const templateTypes = [
  { value: 'ticket_created', label: 'Ticket Created', description: 'When a new ticket is created' },
  { value: 'status_changed', label: 'Status Changed', description: 'When ticket status is updated' },
  { value: 'comment_added', label: 'Comment Added', description: 'When a new comment is added' },
  { value: 'participant_added', label: 'Participant Added', description: 'When someone is added as participant' },
  { value: 'automation_warning', label: 'Automation Warning', description: 'Before automatic ticket closure' },
  { value: 'automation_closed', label: 'Ticket Auto-Closed', description: 'When ticket is automatically closed' }
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
  const [baseTemplate, setBaseTemplate] = useState<BaseTemplateConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{
    subject: string;
    htmlContent: string;
    sampleData: Record<string, unknown>;
  } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewType, setPreviewType] = useState('ticket_created')
  const [formData, setFormData] = useState({
    subjectPrefix: '[Ticket {{ticketNumber}}]',
    htmlTemplate: '',
    isActive: true
  })

  useEffect(() => {
    fetchBaseTemplate()
  }, [])

  const fetchBaseTemplate = async () => {
    try {
      const response = await fetch('/api/admin/email-templates/base')
      if (response.ok) {
        const data = await response.json()
        setBaseTemplate(data)
        setFormData({
          subjectPrefix: data.subjectPrefix,
          htmlTemplate: data.htmlTemplate,
          isActive: data.isActive
        })
      } else {
        toast.error('Failed to fetch base template configuration')
      }
    } catch (error) {
      console.error('Error fetching base template:', error)
      toast.error('Failed to fetch base template configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/email-templates/base', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedTemplate = await response.json()
        setBaseTemplate(updatedTemplate)
        setIsEditDialogOpen(false)
        toast.success('Base email template updated successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update base template')
      }
    } catch (err) {
      console.error('Failed to save base template:', err)
      toast.error('Failed to save base template')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = async (templateType: string) => {
    try {
      const response = await fetch('/api/admin/email-templates/base/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateType })
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

  const insertVariable = (variable: string) => {
    const htmlTextarea = document.getElementById('htmlTemplate') as HTMLTextAreaElement
    if (htmlTextarea) {
      const start = htmlTextarea.selectionStart
      const end = htmlTextarea.selectionEnd
      const text = htmlTextarea.value
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const newText = before + `{{${variable}}}` + after
      
      setFormData({ ...formData, htmlTemplate: newText })
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        htmlTextarea.focus()
        htmlTextarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
      }, 0)
    }
  }

  const openEditDialog = () => {
    setFormData({
      subjectPrefix: baseTemplate?.subjectPrefix || '[Ticket {{ticketNumber}}]',
      htmlTemplate: baseTemplate?.htmlTemplate || '',
      isActive: baseTemplate?.isActive || true
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileType className="h-5 w-5" />
                Unified Email Template
              </CardTitle>
              <CardDescription>
                Manage the single base template used for all email notifications. Configure the subject prefix and HTML template that adapts automatically for different email types.
              </CardDescription>
            </div>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openEditDialog} disabled={!baseTemplate}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Base Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl w-full max-h-[90vh] m-4 p-0 overflow-hidden flex flex-col gap-0">
                <div className="p-6 border-b flex-shrink-0">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileType className="h-5 w-5" />
                      Edit Base Email Template
                    </DialogTitle>
                    <DialogDescription>
                      Configure the unified email template and subject prefix used for all email notifications.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                
                <div className="flex-1 overflow-hidden flex">
                  {/* Main Form */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Settings */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Configuration</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subjectPrefix">Subject Prefix</Label>
                        <Input
                          id="subjectPrefix"
                          value={formData.subjectPrefix}
                          onChange={(e) => setFormData({ ...formData, subjectPrefix: e.target.value })}
                          placeholder="e.g. [Ticket {{ticketNumber}}]"
                        />
                        <p className="text-xs text-muted-foreground">
                          This prefix will be added to all email subjects automatically. Use {`{{ticketNumber}}`} for dynamic ticket numbers.
                        </p>
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

                    {/* Template Content */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Base HTML Template</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="htmlTemplate">HTML Template</Label>
                        <Textarea
                          id="htmlTemplate"
                          value={formData.htmlTemplate}
                          onChange={(e) => setFormData({ ...formData, htmlTemplate: e.target.value })}
                          placeholder="Enter the base HTML template with placeholders..."
                          className="min-h-[400px] font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          This is the unified HTML template that will be used for all email types. Use placeholders like {`{{headerTitle}}`}, {`{{sections}}`}, {`{{actionButton}}`} for dynamic content.
                        </p>
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
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
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
          {/* Silent loading indicator */}
          {isLoading && baseTemplate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Updating template...</span>
            </div>
          )}
          
          {!baseTemplate ? (
            <div className="text-center py-8">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading base template...</p>
                </>
              ) : (
                <>
                  <FileType className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No Base Template</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Failed to load the base email template configuration.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Base Template Overview */}
              <div className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileType className="h-5 w-5" />
                      Base Email Template
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Unified template system for all email notifications
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {baseTemplate.isActive ? (
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">Subject Prefix</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
                      {baseTemplate.subjectPrefix}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">System Name</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-sm">
                      {baseTemplate.systemName}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date(baseTemplate.updatedAt).toLocaleString()}
                </div>
              </div>

              {/* Email Type Previews */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Email Type Previews</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  See how the base template appears for different email types. Each type uses the same base template with different content sections.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templateTypes.map((type) => (
                    <div key={type.value} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {type.label}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(type.value)}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Preview
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                      <div className="mt-2 text-xs font-mono bg-muted p-2 rounded">
                        {baseTemplate.subjectPrefix} {type.label}: Sample Subject
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                Preview how the unified template renders for different email types
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {previewData && (
              <Tabs defaultValue="html" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="html" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    HTML Preview
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
                    <div className="border rounded bg-white dark:bg-slate-900 overflow-hidden">
                      <iframe
                        srcDoc={`
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <meta charset="utf-8">
                              <meta name="viewport" content="width=device-width, initial-scale=1">
                              <style>
                                body {
                                  margin: 16px;
                                  font-family: system-ui, -apple-system, sans-serif;
                                  line-height: 1.5;
                                  color: #333;
                                  background: #fff;
                                }
                                * {
                                  box-sizing: border-box;
                                }
                              </style>
                            </head>
                            <body>
                              ${previewData.htmlContent}
                            </body>
                          </html>
                        `}
                        className="w-full h-96 border-0"
                        title="Email Preview"
                        sandbox="allow-same-origin"
                      />
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