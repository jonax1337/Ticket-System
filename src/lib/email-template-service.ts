import { prisma } from './prisma'
import { 
  BASE_EMAIL_TEMPLATE, 
  EMAIL_TYPE_CONFIGS, 
  generateEmailSections, 
  generateActionButton, 
  renderSections, 
  renderActionButton,
  UnifiedEmailData 
} from './email-base-template'

export type EmailTemplateType = 
  | 'ticket_created'
  | 'status_changed' 
  | 'comment_added'
  | 'participant_added'
  | 'automation_warning'
  | 'automation_closed'

interface TemplateVariables {
  // Ticket information
  ticketNumber?: string
  ticketSubject?: string
  ticketDescription?: string
  ticketStatus?: string
  ticketPriority?: string
  ticketCreatedAt?: string
  ticketUpdatedAt?: string
  ticketUrl?: string
  
  // User/Customer information
  customerName?: string
  customerEmail?: string
  assignedToName?: string
  assignedToEmail?: string
  actorName?: string // Person who performed the action
  actorEmail?: string
  
  // Status change specific
  previousStatus?: string
  newStatus?: string
  statusChangeReason?: string
  
  // Comment specific
  commentContent?: string
  commentAuthor?: string
  commentCreatedAt?: string
  
  // Participant specific
  participantName?: string
  participantEmail?: string
  participantType?: string
  
  // System information
  systemName?: string
  supportEmail?: string
  supportUrl?: string
  unsubscribeUrl?: string
  emailSubjectPrefix?: string
  
  // Additional context
  additionalNotes?: string
  currentDate?: string
  currentTime?: string

  // Index signature to allow additional properties
  [key: string]: string | undefined
}

interface EmailTemplate {
  id: string
  type: string
  name: string
  subject: string
  htmlContent: string
  textContent: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Get email template by type
 */
export async function getEmailTemplate(type: EmailTemplateType): Promise<EmailTemplate | null> {
  try {
    // First try to get active custom template
    let template = await prisma.emailTemplate.findFirst({
      where: {
        type,
        isActive: true,
        isDefault: false
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // If no custom template, get default template
    if (!template) {
      template = await prisma.emailTemplate.findFirst({
        where: {
          type,
          isDefault: true,
          isActive: true
        }
      })
    }

    return template
  } catch (error) {
    console.error('Error fetching email template:', error)
    return null
  }
}

/**
 * Replace variables in template content
 */
export function replaceTemplateVariables(
  content: string, 
  variables: TemplateVariables
): string {
  let processedContent = content

  // Replace all variables in the format {{variableName}}
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      processedContent = processedContent.replace(regex, String(value))
    }
  })

  // Clean up any remaining unreplaced variables
  processedContent = processedContent.replace(/{{[^}]+}}/g, '')

  return processedContent
}

/**
 * Render email template with variables using unified template system
 */
export async function renderEmailTemplate(
  type: EmailTemplateType,
  variables: TemplateVariables
): Promise<{ subject: string; htmlContent: string; textContent?: string } | null> {
  try {
    const template = await getEmailTemplate(type)
    
    if (!template) {
      console.error(`No template found for type: ${type}`)
      return null
    }

    // Add system defaults if not provided
    const systemDefaults = await getSystemDefaults()
    const fullVariables: TemplateVariables = {
      ...systemDefaults,
      ...variables,
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString()
    }

    // Check if template uses unified template system or legacy format
    const isUnifiedTemplate = !template.htmlContent.includes('<!DOCTYPE html>')
    
    let renderedHtmlContent: string

    if (isUnifiedTemplate) {
      // Use unified template system
      renderedHtmlContent = await renderUnifiedTemplate(type, template, fullVariables)
    } else {
      // Legacy template format
      renderedHtmlContent = replaceTemplateVariables(template.htmlContent, fullVariables)
    }

    // Apply subject prefix from system settings
    let renderedSubject = replaceTemplateVariables(template.subject, fullVariables)
    const subjectPrefix = replaceTemplateVariables(fullVariables.emailSubjectPrefix || '[Ticket {{ticketNumber}}]', fullVariables)
    
    // Add prefix if not already present
    if (!renderedSubject.includes(subjectPrefix.replace(/{{[^}]+}}/g, ''))) {
      renderedSubject = `${subjectPrefix} ${renderedSubject}`
    }
    
    const renderedTextContent = template.textContent 
      ? replaceTemplateVariables(template.textContent, fullVariables)
      : generatePlainTextFromUnified(type, fullVariables)

    return {
      subject: renderedSubject,
      htmlContent: renderedHtmlContent,
      textContent: renderedTextContent
    }
  } catch (error) {
    console.error('Error rendering email template:', error)
    return null
  }
}

/**
 * Render email using unified template system
 */
async function renderUnifiedTemplate(
  type: EmailTemplateType,
  template: EmailTemplate,
  variables: TemplateVariables
): Promise<string> {
  // Try to get configuration from database first
  let baseConfig: Partial<UnifiedEmailData>
  let sections: EmailContentSection[]
  let actionButton: { text: string; url: string; color: string } | null

  try {
    const config = await prisma.emailTypeConfig.findUnique({
      where: { type }
    })

    if (config) {
      // Use database configuration
      baseConfig = {
        headerTitle: config.headerTitle,
        headerSubtitle: config.headerSubtitle,
        headerColor: config.headerColor,
        greeting: config.greeting,
        introText: config.introText,
        footerText: config.footerText
      }
      sections = JSON.parse(config.sections) as EmailContentSection[]
      actionButton = config.actionButton ? JSON.parse(config.actionButton) : null
    } else {
      // Fallback to hardcoded configuration
      baseConfig = EMAIL_TYPE_CONFIGS[type] || {}
      sections = generateEmailSections(type, variables as Record<string, unknown>)
      actionButton = generateActionButton(type, variables as Record<string, unknown>)
    }
  } catch (error) {
    console.error('Error fetching email configuration from database:', error)
    // Fallback to hardcoded configuration
    baseConfig = EMAIL_TYPE_CONFIGS[type] || {}
    sections = generateEmailSections(type, variables as Record<string, unknown>)
    actionButton = generateActionButton(type, variables as Record<string, unknown>)
  }
  
  // Create unified email data
  const emailData: UnifiedEmailData = {
    headerTitle: baseConfig.headerTitle || '{{systemName}}',
    headerSubtitle: baseConfig.headerSubtitle || 'Notification',
    headerColor: baseConfig.headerColor || '#2563eb',
    greeting: baseConfig.greeting || 'Hello {{customerName}},',
    introText: baseConfig.introText || '',
    sections,
    actionButton: actionButton || undefined,
    footerText: baseConfig.footerText || 'Best regards,<br>{{systemName}} Support Team',
    disclaimerText: 'This email was sent from {{systemName}} support system.'
  }

  // Start with base template
  let html = BASE_EMAIL_TEMPLATE

  // Create extended variables with additional template data
  const extendedVariables: TemplateVariables = {
    ...variables,
    headerTitle: emailData.headerTitle,
    headerSubtitle: emailData.headerSubtitle,
    headerColor: emailData.headerColor,
    greeting: emailData.greeting,
    introText: emailData.introText,
    footerText: emailData.footerText,
    disclaimerText: emailData.disclaimerText,
    buttonColor: actionButton?.color || '#2563eb'
  }

  // Replace main placeholders
  html = replaceTemplateVariables(html, extendedVariables)

  // Replace sections placeholder
  const sectionsHtml = renderSections(emailData.sections)
  html = html.replace('{{sections}}', sectionsHtml)

  // Replace action button placeholder
  const buttonHtml = renderActionButton(emailData.actionButton || null)
  html = html.replace('{{actionButton}}', buttonHtml)

  // Final variable replacement
  html = replaceTemplateVariables(html, variables)

  return html
}

/**
 * Generate plain text content from unified template
 */
function generatePlainTextFromUnified(
  type: EmailTemplateType,
  variables: TemplateVariables
): string {
  const baseConfig = EMAIL_TYPE_CONFIGS[type] || {}
  const sections = generateEmailSections(type, variables as Record<string, unknown>)
  const actionButton = generateActionButton(type, variables as Record<string, unknown>)

  let text = `${replaceTemplateVariables(baseConfig.greeting || 'Hello {{customerName}},', variables)}\n\n`
  text += `${replaceTemplateVariables(baseConfig.introText || '', variables)}\n\n`

  // Add sections as plain text
  sections.forEach(section => {
    text += `${section.title}:\n`
    const plainContent = section.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    text += `${replaceTemplateVariables(plainContent, variables)}\n\n`
  })

  // Add action button as plain text
  if (actionButton) {
    text += `${actionButton.text}: ${actionButton.url}\n\n`
  }

  text += `${replaceTemplateVariables(baseConfig.footerText?.replace('<br>', '\n') || 'Best regards,\n{{systemName}} Support Team', variables)}\n\n`
  text += '---\n'
  text += `This email was sent from ${variables.systemName || 'Support System'} support system.\n`
  text += `If you believe you received this email in error, please contact us at ${variables.supportEmail || 'support@example.com'}`

  return text
}

/**
 * Get system default variables
 */
async function getSystemDefaults(): Promise<TemplateVariables> {
  try {
    const systemSettings = await prisma.systemSettings.findFirst()
    
    return {
      systemName: systemSettings?.appName || 'Support System',
      supportEmail: 'support@example.com', // This should come from email config
      supportUrl: process.env.NEXTAUTH_URL || 'https://localhost:3000',
      unsubscribeUrl: `${process.env.NEXTAUTH_URL || 'https://localhost:3000'}/unsubscribe`,
      emailSubjectPrefix: systemSettings?.emailSubjectPrefix || '[Ticket {{ticketNumber}}]'
    }
  } catch (error) {
    console.error('Error fetching system defaults:', error)
    return {
      systemName: 'Support System',
      supportEmail: 'support@example.com',
      supportUrl: 'https://localhost:3000',
      unsubscribeUrl: 'https://localhost:3000/unsubscribe',
      emailSubjectPrefix: '[Ticket {{ticketNumber}}]'
    }
  }
}

/**
 * Create default email templates using unified template system
 */
export async function createDefaultEmailTemplates(): Promise<void> {
  const defaultTemplates = [
    {
      type: 'ticket_created',
      name: 'Ticket Created Confirmation',
      subject: 'Ticket Created: {{ticketSubject}}',
      htmlContent: 'unified_template', // Marker to indicate unified template
      textContent: null // Will be generated automatically
    },
    {
      type: 'status_changed',
      name: 'Status Change Notification',
      subject: 'Status Updated: {{newStatus}}',
      htmlContent: 'unified_template',
      textContent: null
    },
    {
      type: 'comment_added',
      name: 'New Comment Notification',
      subject: 'New Comment: {{ticketSubject}}',
      htmlContent: 'unified_template',
      textContent: null
    },
    {
      type: 'participant_added',
      name: 'Added as Participant',
      subject: 'Added as Participant: {{ticketSubject}}',
      htmlContent: 'unified_template',
      textContent: null
    },
    {
      type: 'automation_warning',
      name: 'Automation Warning - Ticket Will Auto-Close',
      subject: 'Action Required: Will Auto-Close Soon',
      htmlContent: 'unified_template',
      textContent: null
    },
    {
      type: 'automation_closed',
      name: 'Ticket Automatically Closed',
      subject: 'Automatically Closed',
      htmlContent: 'unified_template',
      textContent: null
    }
  ]

  try {
    for (const template of defaultTemplates) {
      // Check if default template already exists
      const existing = await prisma.emailTemplate.findFirst({
        where: {
          type: template.type,
          isDefault: true
        }
      })

      if (!existing) {
        await prisma.emailTemplate.create({
          data: {
            ...template,
            isDefault: true,
            isActive: true
          }
        })
        console.log(`Created default unified email template: ${template.type}`)
      }
    }
  } catch (error) {
    console.error('Error creating default email templates:', error)
  }
}

/**
 * Get all available template variables for documentation
 */
export function getAvailableTemplateVariables(): Record<string, string> {
  return {
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
}

/**
 * Check if template is using unified template system
 */
export function isUnifiedTemplate(template: EmailTemplate): boolean {
  return template.htmlContent === 'unified_template' || 
         !template.htmlContent.includes('<!DOCTYPE html>')
}

/**
 * Migrate legacy templates to unified template system
 * This function can be called to convert existing full HTML templates to unified system
 */
export async function migrateLegacyTemplates(): Promise<void> {
  try {
    const templates = await prisma.emailTemplate.findMany({
      where: {
        isDefault: false, // Only migrate custom templates
        htmlContent: {
          contains: '<!DOCTYPE html>' // Legacy full HTML templates
        }
      }
    })

    console.log(`Found ${templates.length} legacy templates to migrate`)

    for (const template of templates) {
      // Create a backup of the original template
      await prisma.emailTemplate.create({
        data: {
          type: template.type,
          name: `${template.name} (Legacy Backup)`,
          subject: template.subject,
          htmlContent: template.htmlContent,
          textContent: template.textContent,
          isDefault: false,
          isActive: false // Deactivate the backup
        }
      })

      // Convert to unified template
      await prisma.emailTemplate.update({
        where: { id: template.id },
        data: {
          htmlContent: 'unified_template',
          textContent: null // Will be generated automatically
        }
      })

      console.log(`Migrated template: ${template.name} (${template.type})`)
    }

    console.log(`Migration completed: ${templates.length} templates migrated`)
  } catch (error) {
    console.error('Error migrating legacy templates:', error)
  }
}

/**
 * Create a test email template for development/testing
 */
export async function createTestEmailTemplate(
  type: EmailTemplateType,
  variables: TemplateVariables
): Promise<string> {
  const baseConfig = EMAIL_TYPE_CONFIGS[type] || {}
  const sections = generateEmailSections(type, variables as Record<string, unknown>)
  const actionButton = generateActionButton(type, variables as Record<string, unknown>)
  
  const emailData: UnifiedEmailData = {
    headerTitle: baseConfig.headerTitle || '{{systemName}}',
    headerSubtitle: baseConfig.headerSubtitle || 'Notification',
    headerColor: baseConfig.headerColor || '#2563eb',
    greeting: baseConfig.greeting || 'Hello {{customerName}},',
    introText: baseConfig.introText || '',
    sections,
    actionButton: actionButton || undefined,
    footerText: baseConfig.footerText || 'Best regards,<br>{{systemName}} Support Team',
    disclaimerText: 'This email was sent from {{systemName}} support system.'
  }

  let html = BASE_EMAIL_TEMPLATE

  // Create extended variables with additional template data
  const extendedVariables: TemplateVariables = {
    ...variables,
    headerTitle: emailData.headerTitle,
    headerSubtitle: emailData.headerSubtitle,
    headerColor: emailData.headerColor,
    greeting: emailData.greeting,
    introText: emailData.introText,
    footerText: emailData.footerText,
    disclaimerText: emailData.disclaimerText,
    buttonColor: actionButton?.color || '#2563eb'
  }

  // Replace main placeholders
  html = replaceTemplateVariables(html, extendedVariables)

  // Replace sections placeholder
  const sectionsHtml = renderSections(emailData.sections)
  html = html.replace('{{sections}}', sectionsHtml)

  // Replace action button placeholder
  const buttonHtml = renderActionButton(emailData.actionButton || null)
  html = html.replace('{{actionButton}}', buttonHtml)

  // Final variable replacement
  html = replaceTemplateVariables(html, variables)

  return html
}