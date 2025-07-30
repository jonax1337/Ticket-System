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
  variables: TemplateVariables,
  debug: boolean = false
): Promise<{ subject: string; htmlContent: string; textContent?: string; debugInfo?: Record<string, unknown> } | null> {
  const debugInfo: Record<string, unknown> = {
    step: 'start',
    type,
    inputVariables: variables,
    timestamp: new Date().toISOString()
  }

  try {
    if (debug) {
      console.log(`\n========== EMAIL TEMPLATE RENDER START ==========`)
      console.log(`[EMAIL_TEMPLATE_DEBUG] Starting template render for type: ${type}`)
      console.log(`[EMAIL_TEMPLATE_DEBUG] Debug mode: ${debug}`)
      console.log(`[EMAIL_TEMPLATE_DEBUG] Input variables: ${Object.keys(variables).length} provided`)
    }
    
    const template = await getEmailTemplate(type)
    debugInfo.template = {
      found: !!template,
      id: template?.id,
      name: template?.name,
      isDefault: template?.isDefault,
      isActive: template?.isActive,
      htmlContentType: template?.htmlContent === 'unified_template' ? 'unified' : 'legacy'
    }
    
    if (!template) {
      console.error(`[EMAIL_TEMPLATE_DEBUG] ❌ ERROR: No template found for type: ${type}`)
      debugInfo.error = 'No template found'
      return null
    }

    if (debug) {
      console.log(`[EMAIL_TEMPLATE_DEBUG] ✅ Template found:`)
      console.log(`- ID: ${template.id}`)
      console.log(`- Name: ${template.name}`)
      console.log(`- Type: ${template.htmlContent === 'unified_template' ? 'Unified Template' : 'Legacy HTML'}`)
      console.log(`- Is Default: ${template.isDefault}`)
      console.log(`- Is Active: ${template.isActive}`)
    }

    // Add system defaults if not provided
    if (debug) console.log(`[EMAIL_TEMPLATE_DEBUG] Getting system defaults...`)
    const systemDefaults = await getSystemDefaults()
    const fullVariables: TemplateVariables = {
      ...systemDefaults,
      ...variables,
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString()
    }
    
    debugInfo.systemDefaults = systemDefaults
    debugInfo.fullVariables = fullVariables

    if (debug) {
      console.log(`[EMAIL_TEMPLATE_DEBUG] ✅ Full variables prepared:`)
      console.log(`- System name: ${fullVariables.systemName}`)
      console.log(`- Support email: ${fullVariables.supportEmail}`)
      console.log(`- Customer name: ${fullVariables.customerName}`)
      console.log(`- Ticket number: ${fullVariables.ticketNumber}`)
      console.log(`- Total variables: ${Object.keys(fullVariables).length}`)
    }

    // FORCE unified template system for comment_added emails to respect admin config
    const forceUnifiedForTypes = ['comment_added'] // Add more types here as needed
    const isUnifiedTemplate = forceUnifiedForTypes.includes(type) ||
                             template.htmlContent === 'unified_template' || 
                             (!template.htmlContent.includes('<!DOCTYPE html>') && 
                              !template.htmlContent.includes('<html>') &&
                              !template.htmlContent.includes('<div class='))
    
    debugInfo.isUnifiedTemplate = isUnifiedTemplate
    debugInfo.forcedUnified = forceUnifiedForTypes.includes(type)
    
    let renderedHtmlContent: string

    if (isUnifiedTemplate) {
      if (debug) {
        console.log(`[EMAIL_TEMPLATE_DEBUG] 🔄 Using unified template system (respects admin configuration)`)
        if (forceUnifiedForTypes.includes(type)) {
          console.log(`[EMAIL_TEMPLATE_DEBUG] ✅ FORCED UNIFIED: ${type} emails always use unified template to respect admin settings`)
        }
      }
      // Use unified template system - this will respect admin EmailTypeConfig
      const unifiedResult = await renderUnifiedTemplate(type, template, fullVariables, debug)
      renderedHtmlContent = unifiedResult.html
      debugInfo.unifiedTemplateDebug = unifiedResult.debugInfo
      debugInfo.renderMethod = 'unified'
    } else {
      if (debug) console.log(`[EMAIL_TEMPLATE_DEBUG] 🔄 Using legacy template format`)
      // Legacy template format
      renderedHtmlContent = replaceTemplateVariables(template.htmlContent, fullVariables)
      debugInfo.renderMethod = 'legacy'
    }

    // Apply subject prefix from system settings
    let renderedSubject = replaceTemplateVariables(template.subject, fullVariables)
    
    // Smart prefix detection - check if ticket number already exists in subject
    const ticketNumber = fullVariables.ticketNumber
    const hasTicketNumberInSubject = ticketNumber && (
      renderedSubject.includes(`[Ticket ${ticketNumber}]`) ||
      renderedSubject.includes(`Ticket ${ticketNumber}`) ||
      renderedSubject.includes(ticketNumber)
    )
    
    debugInfo.subjectProcessing = {
      originalSubject: template.subject,
      renderedSubject,
      ticketNumber,
      hasTicketNumberInSubject,
      emailSubjectPrefix: fullVariables.emailSubjectPrefix
    }
    
    // Only add prefix if ticket number is not already present in the subject
    if (!hasTicketNumberInSubject) {
      const prefixPattern = fullVariables.emailSubjectPrefix || '[Ticket {{ticketNumber}}]'
      const renderedPrefix = replaceTemplateVariables(prefixPattern, fullVariables)
      if (!renderedSubject.startsWith(renderedPrefix)) {
        renderedSubject = `${renderedPrefix} ${renderedSubject}`
      }
      const subjectProcessing = debugInfo.subjectProcessing as Record<string, unknown>
      subjectProcessing.finalSubject = renderedSubject
      subjectProcessing.prefixAdded = true
    }
    
    const renderedTextContent = template.textContent 
      ? replaceTemplateVariables(template.textContent, fullVariables)
      : generatePlainTextFromUnified(type, fullVariables)

    debugInfo.step = 'complete'
    debugInfo.success = true

    if (debug) {
      console.log(`[EMAIL_TEMPLATE_DEBUG] ✅ Template rendering complete for ${type}`)
      console.log(`- Subject: ${renderedSubject}`)
      console.log(`- HTML Content length: ${renderedHtmlContent.length}`)
      console.log(`- Text Content length: ${renderedTextContent?.length || 0}`)
      if (debugInfo.unifiedTemplateDebug) {
        const unifiedDebug = debugInfo.unifiedTemplateDebug as Record<string, unknown>
        console.log(`- Config source: ${unifiedDebug.configSource}`)
        console.log(`- Sections count: ${unifiedDebug.finalSectionsCount}`)
        console.log(`- Fallback reason: ${unifiedDebug.fallbackReason || 'None'}`)
      }
      console.log(`========== EMAIL TEMPLATE RENDER END ==========\n`)
    }

    return {
      subject: renderedSubject,
      htmlContent: renderedHtmlContent,
      textContent: renderedTextContent,
      ...(debug ? { debugInfo } : {})
    }
  } catch (error) {
    console.error('[EMAIL_TEMPLATE_DEBUG] ❌ CRITICAL ERROR: Template rendering failed:', error)
    debugInfo.error = error instanceof Error ? error.message : 'Unknown error'
    debugInfo.step = 'error'
    if (debug) {
      console.log(`========== EMAIL TEMPLATE RENDER END (ERROR) ==========\n`)
    }
    return null
  }
}

/**
 * Render email logo HTML if logo should be shown
 */
function renderEmailLogo(logoUrl: string | null, showLogo: boolean): string {
  if (!showLogo || !logoUrl) {
    return ''
  }
  
  return `
    <div class="logo" style="margin-bottom: 15px; text-align: center;">
      <img src="${logoUrl}" alt="Logo" style="max-height: 80px; max-width: 300px; height: auto; width: auto; display: block; margin: 0 auto;" />
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
 * Render email using unified template system
 */
async function renderUnifiedTemplate(
  type: EmailTemplateType,
  template: EmailTemplate,
  variables: TemplateVariables,
  debug: boolean = false
): Promise<{ html: string; debugInfo: Record<string, unknown> }> {
  const debugInfo: Record<string, unknown> = {
    step: 'unified_start',
    type,
    configSource: 'unknown',
    fallbackReason: null
  }

  // Try to get configuration from database first
  let baseConfig: Partial<UnifiedEmailData>
  let sections: EmailContentSection[]
  let actionButton: { text: string; url: string; color: string } | null

  try {
    if (debug) console.log(`[EMAIL_TEMPLATE_DEBUG] Looking for EmailTypeConfig for type: ${type}`)
    
    const config = await prisma.emailTypeConfig.findUnique({
      where: { type }
    })

    debugInfo.configFound = !!config
    debugInfo.configData = config

    if (config) {
      if (debug) {
        console.log(`[EMAIL_TEMPLATE_DEBUG] ✅ Found EmailTypeConfig for ${type}:`)
        console.log(`- ID: ${config.id}`)
        console.log(`- Type: ${config.type}`)
        console.log(`- Header Title: ${config.headerTitle}`)
        console.log(`- Header Subtitle: ${config.headerSubtitle}`)
        console.log(`- Greeting: ${config.greeting}`)
        console.log(`- Intro Text: ${config.introText}`)
        console.log(`- Sections (raw): ${config.sections}`)
        console.log(`- Action Button (raw): ${config.actionButton}`)
        console.log(`- Footer Text: ${config.footerText}`)
        console.log(`- Created At: ${config.createdAt}`)
        console.log(`- Updated At: ${config.updatedAt}`)
      }
      
      // Use database configuration - ALWAYS respect admin settings
      baseConfig = {
        headerTitle: config.headerTitle,
        headerSubtitle: config.headerSubtitle,
        headerColor: config.headerColor,
        greeting: config.greeting,
        introText: config.introText,
        footerText: config.footerText
      }
      
      debugInfo.configSource = 'database'
      debugInfo.baseConfig = baseConfig

      try {
        sections = JSON.parse(config.sections) as EmailContentSection[]
        actionButton = config.actionButton ? JSON.parse(config.actionButton) : null
        
        debugInfo.sectionsParseSuccess = true
        debugInfo.sectionsFromDB = sections
        debugInfo.sectionsCount = sections.length
        debugInfo.actionButtonFromDB = actionButton
        
        if (debug) {
          console.log(`[EMAIL_TEMPLATE_DEBUG] ✅ Successfully parsed admin configuration:`)
          console.log(`- Sections count: ${sections.length}`)
          if (sections.length === 0) {
            console.log(`- RESPECTING ADMIN CONFIGURATION: Empty sections (admin wants minimal email content)`)
          } else {
            console.log(`- RESPECTING ADMIN CONFIGURATION: Using ${sections.length} configured sections`)
            sections.forEach((section, index) => {
              console.log(`  ${index + 1}. ${section.title}: ${section.content.substring(0, 50)}...`)
            })
          }
          console.log(`- Action button: ${actionButton ? `Yes (${actionButton.text})` : 'No'}`)
        }
        
        // CRITICAL: NEVER override admin configuration
        // If admin configured empty sections, use empty sections
        // If admin configured specific sections, use those sections
        // NO fallback to hardcoded content unless database is completely broken
        
      } catch (parseError) {
        console.error('[EMAIL_TEMPLATE_DEBUG] ❌ ERROR: Failed to parse admin configuration JSON:', parseError)
        debugInfo.sectionsParseSuccess = false
        debugInfo.parseError = parseError instanceof Error ? parseError.message : 'Unknown parse error'
        debugInfo.fallbackReason = 'JSON parse failed - admin configuration corrupted'
        
        // Only fall back to hardcoded sections if JSON parsing completely fails (corrupted data)
        if (debug) console.log(`[EMAIL_TEMPLATE_DEBUG] ⚠️ FALLBACK: Using hardcoded sections due to corrupted admin configuration`)
        sections = generateEmailSections(type, variables as Record<string, unknown>)
        actionButton = generateActionButton(type, variables as Record<string, unknown>)
        debugInfo.configSource = 'hardcoded_fallback_corrupted'
        debugInfo.sectionsFromFallback = sections
        debugInfo.actionButtonFromFallback = actionButton
      }
    } else {
      if (debug) console.log(`[EMAIL_TEMPLATE_DEBUG] ⚠️ No EmailTypeConfig found for ${type}, creating default...`)
      
      // Create default email type config if it doesn't exist
      debugInfo.configSource = 'creating_default'
      await createDefaultEmailTypeConfigs()
      
      // Try to get the newly created config
      const newConfig = await prisma.emailTypeConfig.findUnique({
        where: { type }
      })
      
      debugInfo.newConfigCreated = !!newConfig
      debugInfo.newConfigData = newConfig
      
      if (newConfig) {
        if (debug) console.log(`[EMAIL_TEMPLATE_DEBUG] ✅ Created and retrieved new config with empty sections`)
        
        baseConfig = {
          headerTitle: newConfig.headerTitle,
          headerSubtitle: newConfig.headerSubtitle,
          headerColor: newConfig.headerColor,
          greeting: newConfig.greeting,
          introText: newConfig.introText,
          footerText: newConfig.footerText
        }
        sections = JSON.parse(newConfig.sections) as EmailContentSection[]
        actionButton = newConfig.actionButton ? JSON.parse(newConfig.actionButton) : null
        
        debugInfo.configSource = 'new_database'
        debugInfo.sectionsFromNewDB = sections
        debugInfo.actionButtonFromNewDB = actionButton
        
        if (debug) {
          console.log(`[EMAIL_TEMPLATE_DEBUG] ✅ New config created with ${sections.length} sections (admin can customize these)`)
        }
      } else {
        if (debug) console.log(`[EMAIL_TEMPLATE_DEBUG] ❌ CRITICAL: Failed to create database config, using hardcoded fallback`)
        
        // Last resort fallback to hardcoded configuration
        debugInfo.configSource = 'hardcoded_fallback_db_error'
        debugInfo.fallbackReason = 'Failed to create database config - database connection issue'
        baseConfig = EMAIL_TYPE_CONFIGS[type] || {}
        sections = generateEmailSections(type, variables as Record<string, unknown>)
        actionButton = generateActionButton(type, variables as Record<string, unknown>)
        
        debugInfo.sectionsFromHardcoded = sections
        debugInfo.actionButtonFromHardcoded = actionButton
      }
    }
  } catch (error) {
    console.error('[EMAIL_TEMPLATE_DEBUG] ❌ CRITICAL: Database error fetching email configuration:', error)
    debugInfo.error = error instanceof Error ? error.message : 'Unknown database error'
    debugInfo.configSource = 'hardcoded_error_fallback'
    debugInfo.fallbackReason = 'Database connection error'
    
    // Fallback to hardcoded configuration only on database errors
    baseConfig = EMAIL_TYPE_CONFIGS[type] || {}
    sections = generateEmailSections(type, variables as Record<string, unknown>)
    actionButton = generateActionButton(type, variables as Record<string, unknown>)
    
    debugInfo.sectionsFromErrorFallback = sections
    debugInfo.actionButtonFromErrorFallback = actionButton
  }
  
  // Get email logo configuration from system settings
  if (debug) console.log(`[EMAIL_TEMPLATE_DEBUG] Getting system settings for logos/branding...`)
  const systemSettings = await prisma.systemSettings.findFirst()
  const emailLogoHtml = renderEmailLogo(
    systemSettings?.logoUrl || null,
    systemSettings?.emailShowLogo ?? true
  )
  const emailAppNameHtml = renderEmailAppName(
    systemSettings?.appName || 'Support Dashboard',
    systemSettings?.emailHideAppName ?? false
  )
  const emailSloganHtml = renderEmailSlogan(
    systemSettings?.slogan || null,
    systemSettings?.emailHideSlogan ?? false
  )
  
  debugInfo.systemSettings = {
    logoUrl: systemSettings?.logoUrl,
    emailShowLogo: systemSettings?.emailShowLogo,
    appName: systemSettings?.appName,
    emailHideAppName: systemSettings?.emailHideAppName,
    slogan: systemSettings?.slogan,
    emailHideSlogan: systemSettings?.emailHideSlogan
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
    footerText: baseConfig.footerText || 'Best regards,<br>{{systemName}} Team',
    disclaimerText: 'This email was sent from {{systemName}} support system.'
  }

  debugInfo.finalEmailData = emailData
  debugInfo.finalSectionsCount = sections.length

  if (debug) {
    console.log(`[EMAIL_TEMPLATE_DEBUG] ✅ Final email data created:`)
    console.log(`- Header: ${emailData.headerTitle} - ${emailData.headerSubtitle}`)
    console.log(`- Greeting: ${emailData.greeting}`)
    console.log(`- Intro: ${emailData.introText}`)
    console.log(`- Sections: ${sections.length} configured`)
    console.log(`- Action button: ${actionButton ? 'Yes' : 'No'}`)
    console.log(`- Footer: ${emailData.footerText}`)
    console.log(`[EMAIL_TEMPLATE_DEBUG] 📧 Using ${sections.length} sections from ${debugInfo.configSource}`)
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
    buttonColor: actionButton?.color || '#2563eb',
    emailLogo: emailLogoHtml,
    emailAppName: emailAppNameHtml,
    emailSlogan: emailSloganHtml
  }

  debugInfo.extendedVariables = extendedVariables

  // Replace main placeholders
  html = replaceTemplateVariables(html, extendedVariables)

  // Replace sections placeholder
  const sectionsHtml = renderSections(emailData.sections)
  html = html.replace('{{sections}}', sectionsHtml)
  
  debugInfo.sectionsHtml = sectionsHtml
  debugInfo.sectionsHtmlLength = sectionsHtml.length

  // Replace action button placeholder
  const buttonHtml = renderActionButton(emailData.actionButton || null)
  html = html.replace('{{actionButton}}', buttonHtml)
  
  debugInfo.buttonHtml = buttonHtml

  // Final variable replacement
  html = replaceTemplateVariables(html, variables)

  debugInfo.step = 'unified_complete'
  debugInfo.finalHtmlLength = html.length

  if (debug) {
    console.log(`[EMAIL_TEMPLATE_DEBUG] ✅ Unified template rendering complete`)
    console.log(`- Final HTML length: ${html.length}`)
    console.log(`- Sections HTML length: ${sectionsHtml.length}`)
    console.log(`- Button HTML length: ${buttonHtml.length}`)
    console.log(`- Template content preview: ${html.substring(0, 300)}...`)
  }

  return { html, debugInfo }
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
 * Create default email templates and email type configurations
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

    // Also initialize email type configurations with empty sections for admin customization
    await createDefaultEmailTypeConfigs()
  } catch (error) {
    console.error('Error creating default email templates:', error)
  }
}

/**
 * Create default email type configurations with empty sections for admin customization
 */
async function createDefaultEmailTypeConfigs(): Promise<void> {
  const { EMAIL_TYPE_CONFIGS } = await import('./email-base-template')
  
  try {
    for (const [type, config] of Object.entries(EMAIL_TYPE_CONFIGS)) {
      // Check if email type config already exists
      const existingConfig = await prisma.emailTypeConfig.findUnique({
        where: { type }
      })

      if (!existingConfig) {
        // Create with empty sections so admins can configure them
        await prisma.emailTypeConfig.create({
          data: {
            type,
            headerTitle: config.headerTitle || '{{systemName}}',
            headerSubtitle: config.headerSubtitle || 'Notification',
            headerColor: config.headerColor || '#2563eb',
            greeting: config.greeting || 'Hello {{customerName}},',
            introText: config.introText || '',
            footerText: config.footerText || 'Best regards,<br>{{systemName}} Team',
            sections: '[]', // Empty sections array - admin can configure
            actionButton: null // No default action button
          }
        })
        console.log(`Created default email type config: ${type}`)
      }
    }
  } catch (error) {
    console.error('Error creating default email type configurations:', error)
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
    footerText: baseConfig.footerText || 'Best regards,<br>{{systemName}} Team',
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