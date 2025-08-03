'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Eye,
  Edit,
  Copy,
  Type,
  Hash,
  MessageSquare,
  FileText,
  Users,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  SECTION_TEMPLATES,
  EmailContentSectionNew, 
  SectionTemplate, 
  SectionField,
  getSectionTemplate,
  convertNewSectionToOld
} from '@/lib/email-section-templates'

interface EmailSectionBuilderProps {
  sections: EmailContentSectionNew[]
  onSectionsChange: (sections: EmailContentSectionNew[]) => void
}

const sectionStyles = [
  { value: 'default', label: 'Default', color: '#2563eb' },
  { value: 'info', label: 'Info', color: '#0891b2' },
  { value: 'success', label: 'Success', color: '#059669' },
  { value: 'warning', label: 'Warning', color: '#f59e0b' },
  { value: 'error', label: 'Error', color: '#dc2626' }
]


export default function EmailSectionBuilder({ sections, onSectionsChange }: EmailSectionBuilderProps) {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<EmailContentSectionNew | null>(null)
  const [previewSection, setPreviewSection] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<SectionTemplate | null>(null)
  const [tempFieldValues, setTempFieldValues] = useState<Record<string, unknown>>({})

  // Initialize field values with defaults from template
  const initializeFieldValues = (template: SectionTemplate): Record<string, unknown> => {
    const values: Record<string, unknown> = {}
    template.fields.forEach(field => {
      values[field.id] = field.defaultValue ?? ''
    })
    return values
  }

  const addSection = (template: SectionTemplate) => {
    const newSection: EmailContentSectionNew = {
      id: Math.random().toString(36).substr(2, 9),
      templateId: template.id,
      title: tempFieldValues.title as string || template.name,
      fieldValues: tempFieldValues,
      style: 'default',
      enabled: true,
      order: sections.length
    }

    onSectionsChange([...sections, newSection])
    setIsTemplateDialogOpen(false)
    setSelectedTemplate(null)
    setTempFieldValues({})
    toast.success(`Added "${template.name}" section`)
  }

  const removeSection = (sectionId: string) => {
    if (confirm('Are you sure you want to remove this section?')) {
      onSectionsChange(sections.filter(s => s.id !== sectionId))
      toast.success('Section removed')
    }
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId)
    if (index === -1) return

    const newSections = [...sections]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= newSections.length) return

    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]]
    
    // Update order
    newSections.forEach((section, idx) => {
      section.order = idx
    })

    onSectionsChange(newSections)
  }

  const toggleSectionEnabled = (sectionId: string) => {
    onSectionsChange(sections.map(s => 
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    ))
  }

  const updateSectionStyle = (sectionId: string, style: string) => {
    onSectionsChange(sections.map(s => 
      s.id === sectionId ? { ...s, style: style as 'default' | 'info' | 'success' | 'warning' | 'error' } : s
    ))
  }

  const editSection = (section: EmailContentSectionNew) => {
    setEditingSection(section)
    setTempFieldValues(section.fieldValues)
    setIsEditDialogOpen(true)
  }

  const saveEditedSection = () => {
    if (!editingSection) return

    const updatedSection = {
      ...editingSection,
      title: tempFieldValues.title as string || editingSection.title,
      fieldValues: tempFieldValues
    }

    onSectionsChange(sections.map(s => 
      s.id === editingSection.id ? updatedSection : s
    ))

    setIsEditDialogOpen(false)
    setEditingSection(null)
    setTempFieldValues({})
    toast.success('Section updated')
  }

  const previewSectionHtml = (section: EmailContentSectionNew) => {
    const mockVariables = {
      ticketNumber: 'T-123456',
      ticketSubject: 'Sample Ticket Subject',
      ticketStatus: 'Open',
      ticketPriority: 'High',
      ticketCreatedAt: new Date().toLocaleString(),
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      assignedToName: 'Jane Smith',
      actorName: 'Support Agent',
      commentContent: '<p>This is a sample comment content with <strong>formatting</strong>.</p>',
      commentAuthor: 'Support Agent',
      commentCreatedAt: new Date().toLocaleString(),
      participantName: 'Team Member',
      participantEmail: 'member@company.com',
      participantType: 'CC',
      previousStatus: 'Open',
      newStatus: 'In Progress',
      statusChangeReason: 'Customer provided additional information',
      systemName: 'Support System',
      supportEmail: 'support@company.com',
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString()
    }

    const oldSection = convertNewSectionToOld(section, mockVariables)
    setPreviewSection(oldSection.content)
  }

  const duplicateSection = (section: EmailContentSectionNew) => {
    const duplicate: EmailContentSectionNew = {
      ...section,
      id: Math.random().toString(36).substr(2, 9),
      title: section.title + ' (Copy)',
      order: sections.length
    }

    onSectionsChange([...sections, duplicate])
    toast.success('Section duplicated')
  }

  const renderFieldInput = (field: SectionField, value: unknown, onChange: (value: unknown) => void) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )

      case 'textarea':
        return (
          <Textarea
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="min-h-[100px]"
          />
        )

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={!!value}
              onCheckedChange={(checked) => onChange(!!checked)}
            />
            <Label>Enable</Label>
          </div>
        )

      case 'list':
        const listValue = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            {listValue.map((item: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const newList = [...listValue]
                    newList[index] = e.target.value
                    onChange(newList)
                  }}
                  placeholder={field.placeholder}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newList = listValue.filter((_, i) => i !== index)
                    onChange(newList)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange([...listValue, ''])}
              disabled={field.maxItems ? listValue.length >= field.maxItems : false}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Select variables to include:</p>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {field.options?.map((option) => {
                const selectedValues = Array.isArray(value) ? value : []
                return (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedValues.includes(option.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onChange([...selectedValues, option.value])
                        } else {
                          onChange(selectedValues.filter(v => v !== option.value))
                        }
                      }}
                    />
                    <Label className="text-xs">{option.value}</Label>
                  </div>
                )
              })}
            </div>
          </div>
        )

      default:
        return (
          <Input
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Content Sections</h4>
          <p className="text-xs text-muted-foreground">
            Add and configure content sections for this email type using predefined templates
          </p>
        </div>
        <Button onClick={() => setIsTemplateDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Section
        </Button>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-muted-foreground mb-2">No sections configured</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Add content sections to customize this email type using our predefined templates.
            </p>
            <Button onClick={() => setIsTemplateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add First Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => {
            const template = getSectionTemplate(section.templateId)
            return (
              <Card key={section.id} className={`${!section.enabled ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={section.enabled}
                          onCheckedChange={() => toggleSectionEnabled(section.id)}
                        />
                        <span className="font-medium">{section.title}</span>
                      </div>
                      <Select
                        value={section.style}
                        onValueChange={(value) => updateSectionStyle(section.id, value)}
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
                        onClick={() => previewSectionHtml(section)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editSection(section)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateSection(section)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={index === sections.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSection(section.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {template && (
                    <p className="text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Template Selection Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] m-4 p-0 overflow-hidden flex flex-col gap-0">
          <div className="p-6 border-b flex-shrink-0">
            <DialogHeader>
              <DialogTitle>Add Content Section</DialogTitle>
              <DialogDescription>
                Choose a template for your email section and configure its content
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-hidden flex">
            {/* Template Selection */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">Choose Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SECTION_TEMPLATES.map(template => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer hover:shadow-md transition-all ${selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => {
                      setSelectedTemplate(template)
                      setTempFieldValues(initializeFieldValues(template))
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div className="flex-1">
                          <h5 className="font-medium">{template.name}</h5>
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {template.preview}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Configuration Panel */}
            {selectedTemplate && (
              <div className="w-80 border-l bg-muted/30 overflow-y-auto p-6">
                <h3 className="text-lg font-semibold mb-4">Configure Section</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4 p-3 bg-background rounded-lg border">
                    <span className="text-2xl">{selectedTemplate.icon}</span>
                    <div>
                      <h4 className="font-medium">{selectedTemplate.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedTemplate.fields.map(field => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderFieldInput(
                          field,
                          tempFieldValues[field.id],
                          (value) => setTempFieldValues(prev => ({ ...prev, [field.id]: value }))
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="p-6 border-t flex-shrink-0">
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsTemplateDialogOpen(false)
                setSelectedTemplate(null)
                setTempFieldValues({})
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedTemplate && addSection(selectedTemplate)}
                disabled={!selectedTemplate}
              >
                Add Section
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>
              Modify the configuration for this section
            </DialogDescription>
          </DialogHeader>

          {editingSection && (() => {
            const template = getSectionTemplate(editingSection.templateId)
            return template ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {template.fields.map(field => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderFieldInput(
                        field,
                        tempFieldValues[field.id],
                        (value) => setTempFieldValues(prev => ({ ...prev, [field.id]: value }))
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Template not found</p>
            )
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false)
              setEditingSection(null)
              setTempFieldValues({})
            }}>
              Cancel
            </Button>
            <Button onClick={saveEditedSection}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewSection} onOpenChange={() => setPreviewSection(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Section Preview</DialogTitle>
            <DialogDescription>
              Preview of how this section will appear in the email
            </DialogDescription>
          </DialogHeader>

          <div className="border rounded p-4 bg-muted/30">
            <div 
              className="email-section-content"
              dangerouslySetInnerHTML={{ __html: previewSection || '' }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewSection(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}