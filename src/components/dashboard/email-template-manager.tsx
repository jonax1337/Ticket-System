'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { BASE_EMAIL_TEMPLATE } from '@/lib/email-base-template'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/animate-ui/components/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Edit, 
  Eye,
  Info,
  FileText,
  Code,
  Globe,
  CheckCircle,
  XCircle,
  Settings,
  FileType,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  MessageSquarePlus,
  RefreshCw,
  MessageCircle,
  Users,
  AlertTriangle,
  CheckSquare,
  Palette
} from 'lucide-react'
import { toast } from 'sonner'

interface BaseTemplateConfig {
  id: string
  subjectPrefix: string
  htmlTemplate: string
  isActive: boolean
  showLogo: boolean
  hideAppName: boolean
  hideSlogan: boolean
  monochromeLogo: boolean
  fixedHeaderColor: boolean
  headerColor: string
  disclaimerText: string
  systemName: string
  logoUrl: string | null
  slogan: string | null
  createdAt: string
  updatedAt: string
}

interface EmailContentSection {
  title: string
  content: string
  style: 'default' | 'info' | 'success' | 'warning' | 'error'
}

interface EmailTypeConfig {
  id: string
  type: string
  headerTitle: string
  headerSubtitle: string
  headerColor: string
  greeting: string
  introText: string
  footerText: string
  sections: EmailContentSection[]
  actionButton: {
    text: string
    url: string
    color: string
  } | null
  createdAt: string
  updatedAt: string
}

const templateTypes = [
  { value: 'ticket_created', label: 'Ticket Created', description: 'When a new ticket is created', icon: MessageSquarePlus, color: 'text-blue-600 dark:text-blue-400' },
  { value: 'status_changed', label: 'Status Changed', description: 'When ticket status is updated', icon: RefreshCw, color: 'text-purple-600 dark:text-purple-400' },
  { value: 'comment_added', label: 'Comment Added', description: 'When a new comment is added', icon: MessageCircle, color: 'text-green-600 dark:text-green-400' },
  { value: 'participant_added', label: 'Participant Added', description: 'When someone is added as participant', icon: Users, color: 'text-cyan-600 dark:text-cyan-400' },
  { value: 'automation_warning', label: 'Automation Warning', description: 'Before automatic ticket closure', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
  { value: 'automation_closed', label: 'Ticket Auto-Closed', description: 'When ticket is automatically closed', icon: CheckSquare, color: 'text-emerald-600 dark:text-emerald-400' }
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

const sectionStyles = [
  { value: 'default', label: 'Default', color: '#2563eb' },
  { value: 'info', label: 'Info', color: '#0891b2' },
  { value: 'success', label: 'Success', color: '#059669' },
  { value: 'warning', label: 'Warning', color: '#f59e0b' },
  { value: 'error', label: 'Error', color: '#dc2626' }
]

export default function EmailTemplateManager() {
  const [activeTab, setActiveTab] = useState('base')
  const [baseTemplate, setBaseTemplate] = useState<BaseTemplateConfig | null>(null)
  const [emailTypes, setEmailTypes] = useState<EmailTypeConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<{
    subject: string;
    htmlContent: string;
    sampleData: Record<string, unknown>;
  } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  // Base template form data
  const [baseFormData, setBaseFormData] = useState({
    subjectPrefix: '[Ticket {{ticketNumber}}]',
    htmlTemplate: '',
    isActive: true,
    showLogo: true,
    hideAppName: false,
    hideSlogan: false,
    monochromeLogo: false,
    fixedHeaderColor: false,
    headerColor: '#2563eb',
    disclaimerText: 'This email was sent from {{systemName}} support system.'
  })

  // Type configuration form data
  const [typeFormData, setTypeFormData] = useState<Partial<EmailTypeConfig>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch base template
      const baseResponse = await fetch('/api/admin/email-templates/base')
      if (baseResponse.ok) {
        const baseData = await baseResponse.json()
        setBaseTemplate(baseData)
        setBaseFormData({
          subjectPrefix: baseData.subjectPrefix,
          htmlTemplate: baseData.htmlTemplate,
          isActive: baseData.isActive,
          showLogo: baseData.showLogo ?? true,
          hideAppName: baseData.hideAppName ?? false,
          hideSlogan: baseData.hideSlogan ?? false,
          monochromeLogo: baseData.monochromeLogo ?? false,
          fixedHeaderColor: baseData.fixedHeaderColor ?? false,
          headerColor: baseData.headerColor ?? '#2563eb',
          disclaimerText: baseData.disclaimerText ?? 'This email was sent from {{systemName}} support system.'
        })
      }

      // Fetch email type configurations
      const typesResponse = await fetch('/api/admin/email-templates/types')
      if (typesResponse.ok) {
        const typesData = await typesResponse.json()
        setEmailTypes(typesData.map((config: Record<string, unknown>) => ({
          ...config,
          sections: JSON.parse(config.sections as string),
          actionButton: config.actionButton ? JSON.parse(config.actionButton as string) : null
        })))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch template configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetBase = () => {
    if (confirm('Are you sure you want to reset the template to default? This will overwrite your current template.')) {
      setBaseFormData({
        ...baseFormData,
        htmlTemplate: BASE_EMAIL_TEMPLATE,
        disclaimerText: 'This email was sent from {{systemName}} support system.'
      })
      toast.success('Template reset to default')
    }
  }

  const handleSaveBase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/email-templates/base', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(baseFormData),
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

  const handleSaveType = async () => {
    if (!selectedType || !typeFormData) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/email-templates/types/${selectedType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(typeFormData),
      })

      if (response.ok) {
        const updatedConfig = await response.json()
        setEmailTypes(prev => prev.map(config => 
          config.type === selectedType 
            ? { 
                ...updatedConfig, 
                sections: (() => {
                  try { return JSON.parse(updatedConfig.sections) } 
                  catch { return [] }
                })(),
                actionButton: (() => {
                  try { return updatedConfig.actionButton ? JSON.parse(updatedConfig.actionButton) : null }
                  catch { return null }
                })()
              }
            : config
        ))
        setSelectedType(null)
        setTypeFormData({})
        toast.success('Email type configuration updated successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update type configuration')
      }
    } catch (err) {
      console.error('Failed to save type configuration:', err)
      toast.error('Failed to save type configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const openEditType = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/email-templates/types/${type}`)
      if (response.ok) {
        const config = await response.json()
        setTypeFormData(config)
        setSelectedType(type)
      } else {
        toast.error('Failed to load type configuration')
      }
    } catch (error) {
      console.error('Error loading type configuration:', error)
      toast.error('Failed to load type configuration')
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

  const addSection = () => {
    if (!typeFormData.sections) return
    const newSection: EmailContentSection = {
      title: 'New Section',
      content: '<p>Section content goes here...</p>',
      style: 'default'
    }
    setTypeFormData({
      ...typeFormData,
      sections: [...typeFormData.sections, newSection]
    })
  }

  const updateSection = (index: number, field: keyof EmailContentSection, value: string) => {
    if (!typeFormData.sections) return
    const updatedSections = [...typeFormData.sections]
    updatedSections[index] = { ...updatedSections[index], [field]: value }
    setTypeFormData({
      ...typeFormData,
      sections: updatedSections
    })
  }

  const removeSection = (index: number) => {
    if (!typeFormData.sections) return
    const updatedSections = typeFormData.sections.filter((_, i) => i !== index)
    setTypeFormData({
      ...typeFormData,
      sections: updatedSections
    })
  }

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!typeFormData.sections) return
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= typeFormData.sections.length) return

    const updatedSections = [...typeFormData.sections]
    const temp = updatedSections[index]
    updatedSections[index] = updatedSections[newIndex]
    updatedSections[newIndex] = temp

    setTypeFormData({
      ...typeFormData,
      sections: updatedSections
    })
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-auto p-1">
          <TabsTrigger value="base" className="flex items-center gap-2">
            <FileType className="h-4 w-4" />
            Base Template
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Email Types
          </TabsTrigger>
        </TabsList>

        <TabsContents className="mt-6">
          <TabsContent value="base" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileType className="h-5 w-5" />
                    Unified Email Base Template
                  </CardTitle>
                  <CardDescription>
                    Manage the single base HTML template and subject prefix used for all email notifications.
                  </CardDescription>
                </div>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsEditDialogOpen(true)} disabled={!baseTemplate}>
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
                              value={baseFormData.subjectPrefix}
                              onChange={(e) => setBaseFormData({ ...baseFormData, subjectPrefix: e.target.value })}
                              placeholder="e.g. [Ticket {{ticketNumber}}]"
                            />
                            <p className="text-xs text-muted-foreground">
                              This prefix will be added to all email subjects automatically. Use {`{{ticketNumber}}`} for dynamic ticket numbers.
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="isActive"
                              checked={baseFormData.isActive}
                              onCheckedChange={(checked) => setBaseFormData({ ...baseFormData, isActive: !!checked })}
                            />
                            <Label htmlFor="isActive">Active Template</Label>
                          </div>
                        </div>

                        <Separator />

                        {/* Logo Configuration */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">Email Header Configuration</h4>
                          
                          {baseTemplate?.logoUrl && (
                            <>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="showLogo"
                                  checked={baseFormData.showLogo}
                                  onCheckedChange={(checked) => setBaseFormData({ ...baseFormData, showLogo: !!checked })}
                                />
                                <Label htmlFor="showLogo">Show logo in emails</Label>
                              </div>
                              
                              {baseFormData.showLogo && (
                                <div className="flex items-center space-x-2 ml-6">
                                  <Checkbox
                                    id="monochromeLogo"
                                    checked={baseFormData.monochromeLogo}
                                    onCheckedChange={(checked) => setBaseFormData({ ...baseFormData, monochromeLogo: !!checked })}
                                  />
                                  <Label htmlFor="monochromeLogo">Make logo monochrome (uses header color)</Label>
                                </div>
                              )}
                            </>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hideAppName"
                              checked={baseFormData.hideAppName}
                              onCheckedChange={(checked) => setBaseFormData({ ...baseFormData, hideAppName: !!checked })}
                            />
                            <Label htmlFor="hideAppName">Hide application name in emails</Label>
                          </div>

                          {baseTemplate?.slogan && (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="hideSlogan"
                                checked={baseFormData.hideSlogan}
                                onCheckedChange={(checked) => setBaseFormData({ ...baseFormData, hideSlogan: !!checked })}
                              />
                              <Label htmlFor="hideSlogan">Hide slogan in emails</Label>
                            </div>
                          )}

                          {baseTemplate?.logoUrl && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Current Logo</Label>
                              <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/50">
                                <Image 
                                  src={baseTemplate.logoUrl} 
                                  alt="Logo preview" 
                                  width={120}
                                  height={48}
                                  className="h-12 w-auto max-w-[120px] object-contain"
                                />
                                <div className="text-xs text-muted-foreground">
                                  Logo will appear in email headers when enabled
                                </div>
                              </div>
                            </div>
                          )}

                          {!baseTemplate?.logoUrl && (
                            <div className="p-3 border border-dashed rounded-lg bg-muted/20">
                              <div className="text-sm text-muted-foreground text-center">
                                No logo configured. Set a logo URL in <strong>Admin Settings</strong> to enable logo options for emails.
                              </div>
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Header Color Configuration */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">Header Color Configuration</h4>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="fixedHeaderColor"
                              checked={baseFormData.fixedHeaderColor}
                              onCheckedChange={(checked) => setBaseFormData({ ...baseFormData, fixedHeaderColor: !!checked })}
                            />
                            <Label htmlFor="fixedHeaderColor">Use same header color for all email types</Label>
                          </div>
                          
                          {baseFormData.fixedHeaderColor && (
                            <div className="space-y-2">
                              <Label htmlFor="headerColor">Fixed Header Color</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id="headerColor"
                                  type="color"
                                  value={baseFormData.headerColor}
                                  onChange={(e) => setBaseFormData({ ...baseFormData, headerColor: e.target.value })}
                                  className="w-20 h-10"
                                />
                                <Input
                                  value={baseFormData.headerColor}
                                  onChange={(e) => setBaseFormData({ ...baseFormData, headerColor: e.target.value })}
                                  placeholder="#2563eb"
                                  className="flex-1"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                This color will override all individual email type header colors when enabled.
                              </p>
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Template Content */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">Base HTML Template</h4>
                          
                          <div className="space-y-2">
                            <Label htmlFor="htmlTemplate">HTML Template</Label>
                            <Textarea
                              id="htmlTemplate"
                              value={baseFormData.htmlTemplate}
                              onChange={(e) => setBaseFormData({ ...baseFormData, htmlTemplate: e.target.value })}
                              placeholder="Enter the base HTML template with placeholders..."
                              className="min-h-[400px] font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              This is the unified HTML template that will be used for all email types. Use placeholders like {`{{headerTitle}}`}, {`{{sections}}`}, {`{{actionButton}}`} for dynamic content.
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Disclaimer Text */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">Footer Disclaimer Text</h4>
                          
                          <div className="space-y-2">
                            <Label htmlFor="disclaimerText">Disclaimer Text</Label>
                            <Textarea
                              id="disclaimerText"
                              value={baseFormData.disclaimerText}
                              onChange={(e) => setBaseFormData({ ...baseFormData, disclaimerText: e.target.value })}
                              placeholder="This email was sent from {{systemName}} support system."
                              className="min-h-[80px]"
                            />
                            <p className="text-xs text-muted-foreground">
                              This text appears at the bottom of all emails. You can use variables like {`{{systemName}}`}.
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
                            Click on a variable to insert it into your template.
                          </p>
                          
                          <ScrollArea className="h-[400px]">
                            <div className="space-y-2">
                              {Object.entries(availableVariables).map(([variable, description]) => (
                                <div
                                  key={variable}
                                  className="p-2 border rounded cursor-pointer hover:bg-background transition-colors"
                                  onClick={() => {
                                    const textarea = document.getElementById('htmlTemplate') as HTMLTextAreaElement
                                    if (textarea) {
                                      const start = textarea.selectionStart
                                      const end = textarea.selectionEnd
                                      const text = textarea.value
                                      const before = text.substring(0, start)
                                      const after = text.substring(end, text.length)
                                      const newText = before + `{{${variable}}}` + after
                                      setBaseFormData({ ...baseFormData, htmlTemplate: newText })
                                      setTimeout(() => {
                                        textarea.focus()
                                        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
                                      }, 0)
                                    }
                                  }}
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
                      <DialogFooter className="flex flex-row items-center justify-between w-full">
                        <Button 
                          variant="ghost" 
                          onClick={handleResetBase}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reset to Default
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveBase} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Template'}
                          </Button>
                        </div>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
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

                    {/* Logo Configuration Overview */}
                    <div className="mb-4 space-y-3">
                      <Label className="text-sm font-medium">Email Header Configuration</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                          {baseTemplate.logoUrl && baseTemplate.showLogo ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>Logo {baseTemplate.logoUrl && baseTemplate.showLogo ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                          {!baseTemplate.hideAppName ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>App Name {!baseTemplate.hideAppName ? 'Shown' : 'Hidden'}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                          {baseTemplate.slogan && !baseTemplate.hideSlogan ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>Slogan {baseTemplate.slogan && !baseTemplate.hideSlogan ? 'Shown' : 'Hidden'}</span>
                        </div>
                      </div>
                      
                      {baseTemplate.monochromeLogo && baseTemplate.showLogo && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-sm">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span>Logo will be displayed in monochrome using header color</span>
                        </div>
                      )}
                      
                      {baseTemplate.fixedHeaderColor && (
                        <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/30 rounded text-sm">
                          <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span>Fixed header color: </span>
                          <span 
                            className="inline-block w-4 h-4 rounded border" 
                            style={{ backgroundColor: baseTemplate.headerColor }}
                          ></span>
                          <code className="text-xs font-mono">{baseTemplate.headerColor}</code>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date(baseTemplate.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Email Type Configurations
              </CardTitle>
              <CardDescription>
                Customize the content, sections, and appearance for each email type while using the unified base template.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading email type configurations...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templateTypes.map((type) => {
                    const config = emailTypes.find(c => c.type === type.value)
                    const IconComponent = type.icon
                    return (
                      <Card key={type.value} className="group hover:shadow-md transition-all duration-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg bg-muted/50 ${type.color} group-hover:bg-muted transition-colors`}>
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div>
                                <CardTitle className="text-base font-semibold">{type.label}</CardTitle>
                                <CardDescription className="text-sm">{type.description}</CardDescription>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {config && (
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Content Sections:</span>
                                <Badge variant="secondary" className="text-xs">
                                  {config.sections.length} sections
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Header Color:</span>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded border border-border" 
                                    style={{ backgroundColor: config.headerColor }}
                                  ></div>
                                  <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
                                    {config.headerColor}
                                  </code>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Last updated: {new Date(config.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditType(type.value)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Configure
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreview(type.value)}
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          </TabsContent>
        </TabsContents>
      </Tabs>

      {/* Type Configuration Dialog */}
      {selectedType && (
        <Dialog open={!!selectedType} onOpenChange={() => { setSelectedType(null); setTypeFormData({}) }}>
          <DialogContent className="max-w-6xl w-full max-h-[90vh] m-4 p-0 overflow-hidden flex flex-col gap-0">
            <div className="p-6 border-b flex-shrink-0">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configure {templateTypes.find(t => t.value === selectedType)?.label} Email
                </DialogTitle>
                <DialogDescription>
                  Customize the content sections, colors, and text for this email type.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {typeFormData && (
                <>
                  {/* Header Configuration */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Header Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="headerTitle">Header Title</Label>
                        <Input
                          id="headerTitle"
                          value={typeFormData.headerTitle || ''}
                          onChange={(e) => setTypeFormData({ ...typeFormData, headerTitle: e.target.value })}
                          placeholder="{{systemName}}"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="headerSubtitle">Header Subtitle</Label>
                        <Input
                          id="headerSubtitle"
                          value={typeFormData.headerSubtitle || ''}
                          onChange={(e) => setTypeFormData({ ...typeFormData, headerSubtitle: e.target.value })}
                          placeholder="Notification"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="headerColor">Header Color</Label>
                        {baseTemplate?.fixedHeaderColor ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 bg-muted rounded">
                              <span 
                                className="inline-block w-6 h-6 rounded border" 
                                style={{ backgroundColor: baseTemplate.headerColor }}
                              ></span>
                              <code className="text-sm font-mono">{baseTemplate.headerColor}</code>
                              <span className="text-sm text-muted-foreground">(Fixed by base template)</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Header color is controlled by the base template settings.
                            </p>
                          </div>
                        ) : (
                          <Input
                            id="headerColor"
                            type="color"
                            value={typeFormData.headerColor || '#2563eb'}
                            onChange={(e) => setTypeFormData({ ...typeFormData, headerColor: e.target.value })}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Content Configuration */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Content Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="greeting">Greeting</Label>
                        <Input
                          id="greeting"
                          value={typeFormData.greeting || ''}
                          onChange={(e) => setTypeFormData({ ...typeFormData, greeting: e.target.value })}
                          placeholder="Hello {{customerName}},"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="footerText">Footer Text</Label>
                        <Textarea
                          id="footerText"
                          value={typeFormData.footerText || ''}
                          onChange={(e) => setTypeFormData({ ...typeFormData, footerText: e.target.value })}
                          placeholder="Best regards,<br>{{systemName}} Support Team"
                          className="min-h-[60px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="introText">Introduction Text</Label>
                      <Textarea
                        id="introText"
                        value={typeFormData.introText || ''}
                        onChange={(e) => setTypeFormData({ ...typeFormData, introText: e.target.value })}
                        placeholder="Introduction text for this email type..."
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Content Sections */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Content Sections</h4>
                      <Button onClick={addSection} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Section
                      </Button>
                    </div>
                    
                    {typeFormData.sections && typeFormData.sections.length > 0 ? (
                      <div className="space-y-4">
                        {typeFormData.sections.map((section, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Section {index + 1}</span>
                                <Select
                                  value={section.style}
                                  onValueChange={(value) => updateSection(index, 'style', value)}
                                >
                                  <SelectTrigger className="w-auto min-w-[100px] h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sectionStyles.map(style => (
                                      <SelectItem key={style.value} value={style.value}>
                                        <div className="flex items-center gap-2">
                                          <div 
                                            className="w-3 h-3 rounded border" 
                                            style={{ backgroundColor: style.color }}
                                          ></div>
                                          {style.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveSection(index, 'up')}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveSection(index, 'down')}
                                  disabled={index === typeFormData.sections!.length - 1}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeSection(index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor={`section-title-${index}`}>Section Title</Label>
                                <Input
                                  id={`section-title-${index}`}
                                  value={section.title}
                                  onChange={(e) => updateSection(index, 'title', e.target.value)}
                                  placeholder="Section title"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`section-content-${index}`}>Section Content</Label>
                                <Textarea
                                  id={`section-content-${index}`}
                                  value={section.content}
                                  onChange={(e) => updateSection(index, 'content', e.target.value)}
                                  placeholder="Section content (HTML allowed)"
                                  className="min-h-[100px] font-mono text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No sections configured</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Add content sections to customize this email type.
                        </p>
                        <Button onClick={addSection} className="mt-4" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add First Section
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t flex-shrink-0">
              <DialogFooter>
                <Button variant="outline" onClick={() => { setSelectedType(null); setTypeFormData({}) }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveType} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Configuration'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
                <TabsList className="w-full grid grid-cols-2 h-auto p-1">
                  <TabsTrigger value="html" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    HTML Preview
                  </TabsTrigger>
                  <TabsTrigger value="source" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    HTML Source
                  </TabsTrigger>
                </TabsList>
                
                <TabsContents className="mt-6">
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
                        ref={(iframe) => {
                          if (iframe) {
                            // Use timeout to ensure both tabs are rendered
                            setTimeout(() => {
                              const sourceContainer = document.getElementById('html-source-container');
                              if (sourceContainer) {
                                const sourceHeight = sourceContainer.scrollHeight;
                                const dynamicHeight = Math.max(sourceHeight, 900);
                                iframe.style.height = dynamicHeight + 'px';
                                console.log('Setting iframe height to:', dynamicHeight, 'px based on source height:', sourceHeight, 'px');
                              }
                            }, 100);
                          }
                        }}
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
                        className="w-full border-0"
                        style={{ height: '900px', minHeight: '900px' }}
                        title="Email Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                  </TabsContent>
                
                  <TabsContent value="source" className="space-y-4">
                  <div className="space-y-2">
                    <Label>HTML Source:</Label>
                    <div 
                      id="html-source-container"
                      className="border rounded p-4 bg-muted/30"
                      style={{ height: 'auto', minHeight: '900px' }}
                    >
                      <pre className="whitespace-pre-wrap text-xs font-mono overflow-x-auto">
                        {previewData.htmlContent}
                      </pre>
                    </div>
                  </div>
                  </TabsContent>
                </TabsContents>
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