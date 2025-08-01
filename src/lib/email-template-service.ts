import { prisma } from './prisma'
import { 
  BASE_EMAIL_TEMPLATE, 
  EMAIL_TYPE_CONFIGS, 
  generateEmailSections, 
  generateActionButton, 
  renderSections, 
  renderActionButton,
  UnifiedEmailData,
  EmailContentSection
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
  variables: TemplateVariables,
  preservePlaceholders?: string[]
): string {
  let processedContent = content

  // Replace all variables in the format {{variableName}}
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      const matches = processedContent.match(regex)
      if (matches && matches.length > 0) {
        processedContent = processedContent.replace(regex, String(value))
      }
    }
  })

  // Clean up any remaining unreplaced variables, but preserve specified placeholders
  if (preservePlaceholders && preservePlaceholders.length > 0) {
    // Create a regex that matches any {{placeholder}} except the ones we want to preserve
    const preservePattern = preservePlaceholders.map(p => `{{\\s*${p}\\s*}}`).join('|')
    const replacePattern = new RegExp(`{{(?!\\s*(?:${preservePlaceholders.join('|')})\\s*}})[^}]+}}`, 'g')
    processedContent = processedContent.replace(replacePattern, '')
  } else {
    // Clean up any remaining unreplaced variables
    processedContent = processedContent.replace(/{{[^}]+}}/g, '')
  }

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
    const isUnifiedTemplate = template.htmlContent === 'unified_template' || 
                             (!template.htmlContent.includes('<!DOCTYPE html>') && 
                              !template.htmlContent.includes('<html>'))
    
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
    
    // Add prefix if not already present (check for exact prefix pattern)
    const prefixPattern = fullVariables.emailSubjectPrefix || '[Ticket {{ticketNumber}}]'
    const renderedPrefix = replaceTemplateVariables(prefixPattern, fullVariables)
    if (!renderedSubject.startsWith(renderedPrefix)) {
      renderedSubject = `${renderedPrefix} ${renderedSubject}`
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
 * Render email logo HTML if logo should be shown
 */
function renderEmailLogo(logoUrl: string | null, showLogo: boolean, monochromeLogo: boolean = false, headerColor: string = '#2563eb'): string {
  if (!showLogo || !logoUrl) {
    return ''
  }
  
  const logoStyle = monochromeLogo 
    ? `filter: brightness(0) saturate(100%) invert(1) sepia(1) saturate(2) hue-rotate(210deg) brightness(0.8);` 
    : '';
  
  return `
    <div class="email-logo">
      <img src="${logoUrl}" alt="Logo" style="${logoStyle}" />
    </div>
  `
}

/**
 * Render email app name HTML if not hidden
 */
function renderEmailAppName(appName: string, hideAppName: boolean): string {
  if (hideAppName) {
    return ''
  }
  
  return `<div class="app-name"><h2 style="margin: 5px 0; font-size: 20px; font-weight: 600;">${appName}</h2></div>`
}

/**
 * Render email slogan HTML if available and not hidden
 */
function renderEmailSlogan(slogan: string | null, hideSlogan: boolean): string {
  if (hideSlogan || !slogan) {
    return ''
  }
  
  return `<div class="slogan"><p style="margin: 5px 0; font-size: 14px; opacity: 0.8;">${slogan}</p></div>`
}

/**
 * Render email header title HTML if not hidden
 */
function renderEmailHeaderTitle(headerTitle: string, hideHeaderTitle: boolean): string {
  if (hideHeaderTitle) {
    return ''
  }
  
  return `<h1>${headerTitle}</h1>`
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
      try {
        sections = JSON.parse(config.sections) as EmailContentSection[]
        // Disable action buttons - no self-service portal available
        actionButton = null
      } catch (parseError) {
        console.error('Error parsing email configuration JSON:', parseError)
        sections = generateEmailSections(type, variables as Record<string, unknown>)
        actionButton = null // No action buttons
      }
    } else {
      // Fallback to hardcoded configuration
      baseConfig = EMAIL_TYPE_CONFIGS[type] || {}
      sections = generateEmailSections(type, variables as Record<string, unknown>)
      actionButton = null // No action buttons
    }
  } catch (error) {
    console.error('Error fetching email configuration from database:', error)
    // Fallback to hardcoded configuration
    baseConfig = EMAIL_TYPE_CONFIGS[type] || {}
    sections = generateEmailSections(type, variables as Record<string, unknown>)
    actionButton = null // No action buttons
  }
  
  // Get email logo configuration from system settings
  const systemSettings = await prisma.systemSettings.findFirst()
  const emailLogoHtml = renderEmailLogo(
    systemSettings?.logoUrl || null,
    systemSettings?.emailShowLogo ?? true,
    systemSettings?.emailMonochromeLogo ?? false,
    systemSettings?.emailHeaderColor ?? '#2563eb'
  )
  const emailAppNameHtml = renderEmailAppName(
    systemSettings?.appName || 'Support Dashboard',
    systemSettings?.emailHideAppName ?? true  // Default to hidden since no self-service portal
  )
  const emailSloganHtml = renderEmailSlogan(
    systemSettings?.slogan || null,
    systemSettings?.emailHideSlogan ?? false
  )
  
  // Determine header color - use fixed color if enabled, otherwise use type-specific color
  const effectiveHeaderColor = systemSettings?.emailFixedHeaderColor 
    ? systemSettings.emailHeaderColor 
    : (baseConfig.headerColor || '#2563eb')

  // Create unified email data
  const emailData: UnifiedEmailData = {
    headerTitle: baseConfig.headerTitle || '{{systemName}}',
    headerSubtitle: baseConfig.headerSubtitle || 'Notification',
    headerColor: effectiveHeaderColor,
    greeting: baseConfig.greeting || 'Hello {{customerName}},',
    introText: baseConfig.introText || '',
    sections,
    actionButton: actionButton || undefined,
    footerText: baseConfig.footerText || 'Best regards,<br>{{systemName}} Team',
    disclaimerText: systemSettings?.emailDisclaimerText || 'This email was sent from {{systemName}} support system.'
  }

  // Start with base template
  let html = BASE_EMAIL_TEMPLATE

  // Render header title with hide option
  const emailHeaderTitleHtml = renderEmailHeaderTitle(
    replaceTemplateVariables(emailData.headerTitle, variables),
    systemSettings?.emailHideAppName ?? true  // Use same setting as app name
  )

  // First, replace variables in the email data strings themselves
  const processedEmailData = {
    headerTitle: replaceTemplateVariables(emailData.headerTitle, variables),
    headerSubtitle: replaceTemplateVariables(emailData.headerSubtitle, variables),
    headerColor: emailData.headerColor,
    greeting: replaceTemplateVariables(emailData.greeting, variables),
    introText: replaceTemplateVariables(emailData.introText, variables),
    footerText: replaceTemplateVariables(emailData.footerText, variables),
    disclaimerText: replaceTemplateVariables(emailData.disclaimerText, variables)
  }

  // Create extended variables with processed template data
  const extendedVariables: TemplateVariables = {
    ...variables,
    headerTitle: processedEmailData.headerTitle,
    headerSubtitle: processedEmailData.headerSubtitle,
    headerColor: processedEmailData.headerColor,
    greeting: processedEmailData.greeting,
    introText: processedEmailData.introText,
    footerText: processedEmailData.footerText,
    disclaimerText: processedEmailData.disclaimerText,
    buttonColor: actionButton?.color || '#2563eb',
    emailLogo: emailLogoHtml,
    emailAppName: emailAppNameHtml,
    emailSlogan: emailSloganHtml,
    emailHeaderTitle: emailHeaderTitleHtml
  }

  // Replace all placeholders in the template, but preserve sections and actionButton for manual replacement
  html = replaceTemplateVariables(html, extendedVariables, ['sections', 'actionButton'])

  // Replace sections placeholder with variable-replaced content
  const sectionsHtml = renderSections(emailData.sections, variables)
  html = html.replace('{{sections}}', sectionsHtml)

  // Replace action button placeholder
  const buttonHtml = renderActionButton(emailData.actionButton || null)
  html = html.replace('{{actionButton}}', buttonHtml)

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

  text += `${replaceTemplateVariables(baseConfig.footerText?.replace('<br>', '\n') || 'Best regards,\n{{systemName}} Team', variables)}\n\n`
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
    
    // Get outbound email configuration for support email
    const emailConfig = await prisma.emailConfiguration.findFirst({
      where: {
        isActive: true
      },
      orderBy: [
        { isOutbound: 'desc' }, // Prioritize outbound accounts
        { createdAt: 'asc' }    // Fallback to oldest if no outbound set
      ]
    })
    
    return {
      systemName: systemSettings?.appName || 'Support System',
      supportEmail: emailConfig?.username || 'support@example.com',
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
  // Add system defaults if not provided
  const systemDefaults = await getSystemDefaults()
  const fullVariables: TemplateVariables = {
    ...systemDefaults,
    ...variables
  }
  
  const baseConfig = EMAIL_TYPE_CONFIGS[type] || {}
  const sections = generateEmailSections(type, fullVariables as Record<string, unknown>)
  const actionButton = generateActionButton(type, fullVariables as Record<string, unknown>)
  
  // Get system settings for email logo configuration
  const systemSettings = await prisma.systemSettings.findFirst()
  const emailLogoHtml = renderEmailLogo(
    systemSettings?.logoUrl || null,
    systemSettings?.emailShowLogo ?? true,
    systemSettings?.emailMonochromeLogo ?? false,
    systemSettings?.emailHeaderColor ?? '#2563eb'
  )
  const emailAppNameHtml = renderEmailAppName(
    systemSettings?.appName || 'Support Dashboard',
    systemSettings?.emailHideAppName ?? true  // Default to hidden since no self-service portal
  )
  const emailSloganHtml = renderEmailSlogan(
    systemSettings?.slogan || null,
    systemSettings?.emailHideSlogan ?? false
  )
  
  // Determine header color - use fixed color if enabled, otherwise use type-specific color
  const effectiveHeaderColor = systemSettings?.emailFixedHeaderColor 
    ? systemSettings.emailHeaderColor 
    : (baseConfig.headerColor || '#2563eb')
  
  const emailData: UnifiedEmailData = {
    headerTitle: baseConfig.headerTitle || '{{systemName}}',
    headerSubtitle: baseConfig.headerSubtitle || 'Notification',
    headerColor: effectiveHeaderColor,
    greeting: baseConfig.greeting || 'Hello {{customerName}},',
    introText: baseConfig.introText || '',
    sections,
    actionButton: actionButton || undefined,
    footerText: baseConfig.footerText || 'Best regards,<br>{{systemName}} Team',
    disclaimerText: systemSettings?.emailDisclaimerText || 'This email was sent from {{systemName}} support system.'
  }

  let html = BASE_EMAIL_TEMPLATE

  // Render header title with hide option
  const emailHeaderTitleHtml = renderEmailHeaderTitle(
    replaceTemplateVariables(emailData.headerTitle, fullVariables),
    systemSettings?.emailHideAppName ?? true  // Use same setting as app name
  )

  // First, replace variables in the email data strings themselves
  const processedEmailData = {
    headerTitle: replaceTemplateVariables(emailData.headerTitle, fullVariables),
    headerSubtitle: replaceTemplateVariables(emailData.headerSubtitle, fullVariables),
    headerColor: emailData.headerColor,
    greeting: replaceTemplateVariables(emailData.greeting, fullVariables),
    introText: replaceTemplateVariables(emailData.introText, fullVariables),
    footerText: replaceTemplateVariables(emailData.footerText, fullVariables),
    disclaimerText: replaceTemplateVariables(emailData.disclaimerText, fullVariables)
  }

  // Create extended variables with processed template data
  const extendedVariables: TemplateVariables = {
    ...fullVariables,
    headerTitle: processedEmailData.headerTitle,
    headerSubtitle: processedEmailData.headerSubtitle,
    headerColor: processedEmailData.headerColor,
    greeting: processedEmailData.greeting,
    introText: processedEmailData.introText,
    footerText: processedEmailData.footerText,
    disclaimerText: processedEmailData.disclaimerText,
    buttonColor: actionButton?.color || '#2563eb',
    emailLogo: emailLogoHtml,
    emailAppName: emailAppNameHtml,
    emailSlogan: emailSloganHtml,
    emailHeaderTitle: emailHeaderTitleHtml
  }

  // Replace all placeholders in the template, but preserve sections and actionButton for manual replacement
  html = replaceTemplateVariables(html, extendedVariables, ['sections', 'actionButton'])

  // Replace sections placeholder with variable-replaced content
  const sectionsHtml = renderSections(emailData.sections, fullVariables)
  html = html.replace('{{sections}}', sectionsHtml)

  // Replace action button placeholder
  const buttonHtml = renderActionButton(emailData.actionButton || null)
  html = html.replace('{{actionButton}}', buttonHtml)

  return html
}