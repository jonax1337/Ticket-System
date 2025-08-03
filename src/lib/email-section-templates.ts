/**
 * Simplified Section Template System for Email Templates
 * Allows users to create email sections without HTML knowledge
 */

// Types for the simplified section system
export interface SectionField {
  id: string
  type: 'text' | 'textarea' | 'variable' | 'checkbox' | 'list' | 'multiselect'
  label: string
  placeholder?: string
  defaultValue?: string | string[] | boolean
  required?: boolean
  variables?: string[] // For variable dropdowns
  options?: { value: string; label: string }[] // For select/multiselect
  maxItems?: number // For list fields
}

export interface SectionTemplate {
  id: string
  name: string
  description: string
  category: 'basic' | 'ticket' | 'comment' | 'status' | 'participant' | 'automation' | 'custom'
  icon: string
  preview: string
  fields: SectionField[]
  generateHtml: (fieldValues: Record<string, unknown>) => string
}

export interface EmailContentSectionNew {
  id: string
  templateId: string
  title: string
  fieldValues: Record<string, unknown>
  style: 'default' | 'info' | 'success' | 'warning' | 'error'
  enabled: boolean
  order: number
}

// Available variables for all email types
export const AVAILABLE_VARIABLES = {
  // Ticket information
  'ticketNumber': 'Unique ticket identifier (e.g., T-123456)',
  'ticketSubject': 'Subject/title of the ticket',
  'ticketDescription': 'Original ticket description/content',
  'ticketStatus': 'Current status of the ticket',
  'ticketPriority': 'Priority level of the ticket',
  'ticketCreatedAt': 'When the ticket was created',
  'ticketUpdatedAt': 'When the ticket was last updated',
  
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
  
  // Date/Time
  'currentDate': 'Current date when email is sent',
  'currentTime': 'Current time when email is sent'
}


// Helper function to replace variables in text
function replaceVariables(text: string, variables: Record<string, unknown> = {}): string {
  let result = text
  
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      result = result.replace(regex, String(value))
    }
  })
  
  // Clean up any remaining unreplaced variables
  result = result.replace(/{{[^}]+}}/g, '')
  
  return result
}

// Predefined section templates
export const SECTION_TEMPLATES: SectionTemplate[] = [
  // Basic Information Template
  {
    id: 'ticket_info',
    name: 'Ticket Information',
    description: 'Display basic ticket details like number, subject, status, and priority',
    category: 'ticket',
    icon: '🎫',
    preview: 'Shows ticket number, subject, status, priority, and creation date',
    fields: [
      {
        id: 'title',
        type: 'text',
        label: 'Section Title',
        defaultValue: 'Ticket Details',
        required: true
      },
      {
        id: 'showTicketNumber',
        type: 'checkbox',
        label: 'Show Ticket Number',
        defaultValue: true
      },
      {
        id: 'showSubject',
        type: 'checkbox',
        label: 'Show Subject',
        defaultValue: true
      },
      {
        id: 'showStatus',
        type: 'checkbox',
        label: 'Show Status',
        defaultValue: true
      },
      {
        id: 'showPriority',
        type: 'checkbox',
        label: 'Show Priority',
        defaultValue: true
      },
      {
        id: 'showCreatedAt',
        type: 'checkbox',
        label: 'Show Creation Date',
        defaultValue: true
      },
      {
        id: 'showAssignedTo',
        type: 'checkbox',
        label: 'Show Assigned Agent',
        defaultValue: false
      }
    ],
    generateHtml: (fieldValues) => {
      const lines: string[] = []
      
      if (fieldValues.showTicketNumber) {
        lines.push('<p><strong>Ticket Number:</strong> {{ticketNumber}}</p>')
      }
      if (fieldValues.showSubject) {
        lines.push('<p><strong>Subject:</strong> {{ticketSubject}}</p>')
      }
      if (fieldValues.showStatus) {
        lines.push('<p><strong>Status:</strong> {{ticketStatus}}</p>')
      }
      if (fieldValues.showPriority) {
        lines.push('<p><strong>Priority:</strong> {{ticketPriority}}</p>')
      }
      if (fieldValues.showCreatedAt) {
        lines.push('<p><strong>Created:</strong> {{ticketCreatedAt}}</p>')
      }
      if (fieldValues.showAssignedTo) {
        lines.push('{{#assignedToName}}<p><strong>Assigned to:</strong> {{assignedToName}}</p>{{/assignedToName}}')
      }
      
      return lines.join('\n')
    }
  },

  // Status Change Template
  {
    id: 'status_change',
    name: 'Status Change Information',
    description: 'Display information about status changes including previous and new status',
    category: 'status',
    icon: '🔄',
    preview: 'Shows previous status, new status, who changed it, and when',
    fields: [
      {
        id: 'title',
        type: 'text',
        label: 'Section Title',
        defaultValue: 'Status Change',
        required: true
      },
      {
        id: 'showPreviousStatus',
        type: 'checkbox',
        label: 'Show Previous Status',
        defaultValue: true
      },
      {
        id: 'showNewStatus',
        type: 'checkbox',
        label: 'Show New Status',
        defaultValue: true
      },
      {
        id: 'showActor',
        type: 'checkbox',
        label: 'Show Who Changed It',
        defaultValue: true
      },
      {
        id: 'showTimestamp',
        type: 'checkbox',
        label: 'Show When Changed',
        defaultValue: true
      },
      {
        id: 'showReason',
        type: 'checkbox',
        label: 'Show Reason (if provided)',
        defaultValue: true
      }
    ],
    generateHtml: (fieldValues) => {
      const lines: string[] = []
      
      if (fieldValues.showPreviousStatus) {
        lines.push('<p><strong>Previous Status:</strong> {{previousStatus}}</p>')
      }
      if (fieldValues.showNewStatus) {
        lines.push('<p><strong>New Status:</strong> {{newStatus}}</p>')
      }
      if (fieldValues.showActor) {
        lines.push('<p><strong>Updated by:</strong> {{actorName}}</p>')
      }
      if (fieldValues.showTimestamp) {
        lines.push('<p><strong>Updated on:</strong> {{currentDate}} at {{currentTime}}</p>')
      }
      if (fieldValues.showReason) {
        lines.push('{{#statusChangeReason}}<p><strong>Reason:</strong> {{statusChangeReason}}</p>{{/statusChangeReason}}')
      }
      
      return lines.join('\n')
    }
  },

  // Comment Display Template
  {
    id: 'comment_display',
    name: 'Comment Display',
    description: 'Show new comment content with author and timestamp',
    category: 'comment',
    icon: '💬',
    preview: 'Displays comment content, author, and when it was posted',
    fields: [
      {
        id: 'title',
        type: 'text',
        label: 'Section Title',
        defaultValue: 'New Comment',
        required: true
      },
      {
        id: 'showAuthor',
        type: 'checkbox',
        label: 'Show Comment Author',
        defaultValue: true
      },
      {
        id: 'showTimestamp',
        type: 'checkbox',
        label: 'Show Timestamp',
        defaultValue: true
      },
      {
        id: 'showDivider',
        type: 'checkbox',
        label: 'Show Divider Before Content',
        defaultValue: true
      }
    ],
    generateHtml: (fieldValues) => {
      const lines: string[] = []
      
      if (fieldValues.showAuthor) {
        lines.push('<p><strong>From:</strong> {{commentAuthor}}</p>')
      }
      if (fieldValues.showTimestamp) {
        lines.push('<p><strong>Posted:</strong> {{commentCreatedAt}}</p>')
      }
      
      if (fieldValues.showDivider) {
        lines.push('<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">')
        lines.push('{{commentContent}}')
        lines.push('</div>')
      } else {
        lines.push('<div style="margin-top: 15px;">')
        lines.push('{{commentContent}}')
        lines.push('</div>')
      }
      
      return lines.join('\n')
    }
  },

  // Custom Text Template
  {
    id: 'custom_text',
    name: 'Custom Text Block',
    description: 'Add custom text content with optional variables',
    category: 'custom',
    icon: '📝',
    preview: 'Allows you to add any custom text with variables',
    fields: [
      {
        id: 'title',
        type: 'text',
        label: 'Section Title',
        placeholder: 'Enter section title...',
        required: true
      },
      {
        id: 'content',
        type: 'textarea',
        label: 'Content',
        placeholder: 'Enter your custom content here...\n\nYou can use variables like {{customerName}}, {{ticketNumber}}, etc.',
        required: true
      },
      {
        id: 'includedVariables',
        type: 'multiselect',
        label: 'Variables to Include (Optional)',
        options: Object.entries(AVAILABLE_VARIABLES).map(([key, desc]) => ({
          value: key,
          label: `${key} - ${desc}`
        }))
      }
    ],
    generateHtml: (fieldValues) => {
      const content = fieldValues.content as string || ''
      return `<p>${content.replace(/\n/g, '</p><p>')}</p>`
    }
  },

  // Action Instructions Template
  {
    id: 'action_instructions',
    name: 'Action Instructions',
    description: 'Provide a list of actions the customer can take',
    category: 'basic',
    icon: '📋',
    preview: 'Shows a bulleted list of actions or instructions',
    fields: [
      {
        id: 'title',
        type: 'text',
        label: 'Section Title',
        defaultValue: 'What you can do:',
        required: true
      },
      {
        id: 'instructions',
        type: 'list',
        label: 'Instructions',
        placeholder: 'Add instruction...',
        maxItems: 10,
        defaultValue: [
          'Reply to this email if you need further assistance',
          'Contact us if you have any questions'
        ]
      }
    ],
    generateHtml: (fieldValues) => {
      const instructions = fieldValues.instructions as string[] || []
      if (instructions.length === 0) return '<p>No instructions provided.</p>'
      
      const listItems = instructions.map(instruction => 
        `<li><strong>${instruction}</strong></li>`
      ).join('\n')
      
      return `<ul>\n${listItems}\n</ul>`
    }
  },

  // Warning Notice Template
  {
    id: 'warning_notice',
    name: 'Warning Notice',
    description: 'Display important warnings or notices with emphasis',
    category: 'automation',
    icon: '⚠️',
    preview: 'Shows highlighted warning text for important notices',
    fields: [
      {
        id: 'title',
        type: 'text',
        label: 'Warning Title',
        defaultValue: '⚠️ Important Notice',
        required: true
      },
      {
        id: 'message',
        type: 'textarea',
        label: 'Warning Message',
        placeholder: 'Enter the warning message...',
        required: true
      },
      {
        id: 'showTimestamp',
        type: 'checkbox',
        label: 'Show Current Date/Time',
        defaultValue: false
      }
    ],
    generateHtml: (fieldValues) => {
      const message = fieldValues.message as string || ''
      const lines = [message.replace(/\n/g, '</p><p>')]
      
      if (fieldValues.showTimestamp) {
        lines.push('<p><em>Date: {{currentDate}} at {{currentTime}}</em></p>')
      }
      
      return `<p>${lines.join('</p><p>')}</p>`
    }
  },

  // Contact Information Template
  {
    id: 'contact_info',
    name: 'Contact Information',
    description: 'Display contact information and support options',
    category: 'basic',
    icon: '📞',
    preview: 'Shows contact details and support options',
    fields: [
      {
        id: 'title',
        type: 'text',
        label: 'Section Title',
        defaultValue: 'Need Help?',
        required: true
      },
      {
        id: 'showSupportEmail',
        type: 'checkbox',
        label: 'Show Support Email',
        defaultValue: true
      },
      {
        id: 'showReplyOption',
        type: 'checkbox',
        label: 'Show Reply Option',
        defaultValue: true
      },
      {
        id: 'customMessage',
        type: 'textarea',
        label: 'Custom Message (Optional)',
        placeholder: 'Add any additional contact information...'
      }
    ],
    generateHtml: (fieldValues) => {
      const lines: string[] = []
      
      if (fieldValues.showReplyOption) {
        lines.push('<p><strong>Reply to this email</strong> to continue the conversation</p>')
      }
      if (fieldValues.showSupportEmail) {
        lines.push('<p><strong>Contact us directly</strong> at {{supportEmail}}</p>')
      }
      
      if (fieldValues.customMessage) {
        lines.push(`<p>${(fieldValues.customMessage as string).replace(/\n/g, '</p><p>')}</p>`)
      }
      
      return lines.join('\n')
    }
  },

  // Participant Information Template
  {
    id: 'participant_info',
    name: 'Participant Information',
    description: 'Display information about participants being added to tickets',
    category: 'participant',
    icon: '👥',
    preview: 'Shows participant details and participation type',
    fields: [
      {
        id: 'title',
        type: 'text',
        label: 'Section Title',
        defaultValue: 'Participation Details',
        required: true
      },
      {
        id: 'showParticipantName',
        type: 'checkbox',
        label: 'Show Participant Name',
        defaultValue: true
      },
      {
        id: 'showParticipantEmail',
        type: 'checkbox',
        label: 'Show Participant Email',
        defaultValue: false
      },
      {
        id: 'showParticipantType',
        type: 'checkbox',
        label: 'Show Participation Type',
        defaultValue: true
      },
      {
        id: 'showActor',
        type: 'checkbox',
        label: 'Show Who Added Them',
        defaultValue: true
      },
      {
        id: 'showTimestamp',
        type: 'checkbox',
        label: 'Show When Added',
        defaultValue: true
      }
    ],
    generateHtml: (fieldValues) => {
      const lines: string[] = []
      
      if (fieldValues.showParticipantName) {
        lines.push('<p><strong>Participant:</strong> {{participantName}}</p>')
      }
      if (fieldValues.showParticipantEmail) {
        lines.push('<p><strong>Email:</strong> {{participantEmail}}</p>')
      }
      if (fieldValues.showParticipantType) {
        lines.push('<p><strong>Type:</strong> {{participantType}}</p>')
      }
      if (fieldValues.showActor) {
        lines.push('<p><strong>Added by:</strong> {{actorName}}</p>')
      }
      if (fieldValues.showTimestamp) {
        lines.push('<p><strong>Added on:</strong> {{currentDate}} at {{currentTime}}</p>')
      }
      
      return lines.join('\n')
    }
  }
]

// Helper function to get template by ID
export function getSectionTemplate(templateId: string): SectionTemplate | undefined {
  return SECTION_TEMPLATES.find(template => template.id === templateId)
}

// Helper function to get templates by category
export function getSectionTemplatesByCategory(category: SectionTemplate['category']): SectionTemplate[] {
  return SECTION_TEMPLATES.filter(template => template.category === category)
}

// Convert new section format to old format for backward compatibility
export function convertNewSectionToOld(section: EmailContentSectionNew, variables?: Record<string, unknown>): { title: string; content: string; style: 'default' | 'info' | 'success' | 'warning' | 'error' } {
  const template = getSectionTemplate(section.templateId)
  if (!template) {
    return {
      title: section.title,
      content: '<p>Template not found</p>',
      style: section.style
    }
  }
  
  let content = template.generateHtml(section.fieldValues)
  
  // Replace variables if provided
  if (variables) {
    content = replaceVariables(content, variables)
  }
  
  return {
    title: section.title,
    content,
    style: section.style
  }
}

// Convert old section format to new format (best effort)
export function convertOldSectionToNew(section: { title: string; content: string; style: string }): EmailContentSectionNew {
  // Try to detect which template this might be based on content
  let templateId = 'custom_text'
  const fieldValues: Record<string, unknown> = {
    title: section.title,
    content: section.content
  }
  
  // Simple pattern matching to detect template type
  if (section.content.includes('Ticket Number') && section.content.includes('Status')) {
    templateId = 'ticket_info'
    fieldValues.showTicketNumber = section.content.includes('{{ticketNumber}}')
    fieldValues.showSubject = section.content.includes('{{ticketSubject}}')
    fieldValues.showStatus = section.content.includes('{{ticketStatus}}')
    fieldValues.showPriority = section.content.includes('{{ticketPriority}}')
    fieldValues.showCreatedAt = section.content.includes('{{ticketCreatedAt}}')
    fieldValues.showAssignedTo = section.content.includes('{{assignedToName}}')
  } else if (section.content.includes('Previous Status') && section.content.includes('New Status')) {
    templateId = 'status_change'
    fieldValues.showPreviousStatus = section.content.includes('{{previousStatus}}')
    fieldValues.showNewStatus = section.content.includes('{{newStatus}}')
    fieldValues.showActor = section.content.includes('{{actorName}}')
    fieldValues.showTimestamp = section.content.includes('{{currentDate}}')
    fieldValues.showReason = section.content.includes('{{statusChangeReason}}')
  } else if (section.content.includes('{{commentContent}}')) {
    templateId = 'comment_display'
    fieldValues.showAuthor = section.content.includes('{{commentAuthor}}')
    fieldValues.showTimestamp = section.content.includes('{{commentCreatedAt}}')
    fieldValues.showDivider = section.content.includes('border-top')
  }
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    templateId,
    title: section.title,
    fieldValues,
    style: section.style as 'default' | 'info' | 'success' | 'warning' | 'error',
    enabled: true,
    order: 0
  }
}