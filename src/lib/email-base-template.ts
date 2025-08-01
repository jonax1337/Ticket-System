/**
 * Unified base email template system
 * Single HTML template with placeholders for dynamic content
 */

export interface EmailContentSection {
  title: string
  content: string
  icon?: string
  style?: 'default' | 'info' | 'success' | 'warning' | 'error'
}

export interface UnifiedEmailData {
  headerTitle: string
  headerSubtitle: string
  headerColor: string
  greeting: string
  introText: string
  sections: EmailContentSection[]
  actionButton?: {
    text: string
    url: string
    color: string
  }
  footerText: string
  disclaimerText: string
}

/**
 * Base HTML email template with placeholders
 * Modern, professional design with enhanced typography and styling
 */
export const BASE_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{headerTitle}}</title>
  <style>
    /* Modern email-safe reset and base styles */
    * {
      margin: 0;
      padding: 0;
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1f2937; 
      margin: 0; 
      padding: 0; 
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
    }
    
    /* Main container with modern card styling */
    .container { 
      max-width: 600px; 
      margin: 20px auto; 
      background-color: #ffffff; 
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }
    
    /* Enhanced header with gradient and modern styling */
    .header { 
      background: linear-gradient(135deg, {{headerColor}} 0%, {{headerColor}}dd 100%);
      color: white; 
      padding: 40px 30px 35px 30px; 
      text-align: center; 
      position: relative;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
      opacity: 0.1;
    }
    
    .header .logo {
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    
    .header .logo img {
      max-height: 80px;
      max-width: 300px;
      height: auto;
      width: auto;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    }
    
    .header h1 { 
      margin: 0 0 8px 0; 
      font-size: 28px; 
      font-weight: 700; 
      letter-spacing: -0.025em;
      position: relative;
      z-index: 1;
    }
    
    .header p { 
      margin: 0; 
      font-size: 16px; 
      opacity: 0.9; 
      font-weight: 400;
      position: relative;
      z-index: 1;
    }
    
    /* Enhanced content area */
    .content { 
      padding: 40px 35px; 
      background-color: #ffffff;
    }
    
    .greeting { 
      font-size: 20px; 
      font-weight: 600; 
      margin-bottom: 20px; 
      color: #1f2937;
    }
    
    .intro-text { 
      margin-bottom: 30px; 
      font-size: 16px; 
      line-height: 1.7;
      color: #4b5563;
    }
    
    /* Modern section cards */
    .section { 
      margin: 24px 0; 
      padding: 24px; 
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      position: relative;
      overflow: hidden;
    }
    
    .section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, {{sectionColor}} 0%, {{sectionColor}}aa 100%);
    }
    
    .section.info { 
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-color: #bae6fd;
    }
    .section.info::before { background: linear-gradient(180deg, #0891b2 0%, #0891b2aa 100%); }
    
    .section.success { 
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-color: #bbf7d0;
    }
    .section.success::before { background: linear-gradient(180deg, #059669 0%, #059669aa 100%); }
    
    .section.warning { 
      background: linear-gradient(135deg, #fefbeb 0%, #fef3c7 100%);
      border-color: #fed7aa;
    }
    .section.warning::before { background: linear-gradient(180deg, #f59e0b 0%, #f59e0baa 100%); }
    
    .section.error { 
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border-color: #fecaca;
    }
    .section.error::before { background: linear-gradient(180deg, #dc2626 0%, #dc2626aa 100%); }
    
    .section.default { 
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-color: #cbd5e1;
    }
    .section.default::before { background: linear-gradient(180deg, #2563eb 0%, #2563ebaa 100%); }
    
    .section-title { 
      font-size: 18px; 
      font-weight: 600; 
      margin: 0 0 12px 0; 
      color: #1f2937;
      position: relative;
    }
    
    .section-content { 
      font-size: 15px; 
      margin: 0; 
      color: #4b5563;
      line-height: 1.6;
      position: relative;
    }
    
    .section-content p { 
      margin: 12px 0; 
    }
    
    .section-content ul { 
      margin: 12px 0; 
      padding-left: 24px; 
    }
    
    .section-content li {
      margin: 6px 0;
    }
    
    /* Modern action button */
    .action-button { 
      display: inline-block; 
      background: linear-gradient(135deg, {{buttonColor}} 0%, {{buttonColor}}dd 100%);
      color: white; 
      padding: 16px 32px; 
      text-decoration: none; 
      border-radius: 8px; 
      margin: 30px 0; 
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
      letter-spacing: 0.025em;
    }
    
    .action-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 25px 0 rgba(0, 0, 0, 0.15);
    }
    
    /* Enhanced footer */
    .footer { 
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 30px 35px; 
      text-align: center; 
      font-size: 13px; 
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer p { 
      margin: 8px 0; 
      line-height: 1.5;
    }
    
    /* Modern divider */
    .divider { 
      height: 1px; 
      background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
      margin: 32px 0; 
    }
    
    /* Enhanced responsive design */
    @media only screen and (max-width: 600px) {
      .container { 
        width: 100% !important; 
        margin: 10px auto !important;
        border-radius: 12px !important;
      }
      .header {
        padding: 30px 20px 25px 20px !important;
      }
      .header h1 {
        font-size: 24px !important;
      }
      .content { 
        padding: 30px 25px !important; 
      }
      .section {
        padding: 20px !important;
        margin: 20px 0 !important;
      }
      .section-title {
        font-size: 16px !important;
      }
      .footer {
        padding: 25px 20px !important;
      }
      .action-button {
        padding: 14px 28px !important;
        font-size: 15px !important;
      }
    }
    
    /* Dark mode support for modern email clients */
    @media (prefers-color-scheme: dark) {
      .container {
        background-color: #1f2937 !important;
      }
      .content {
        background-color: #1f2937 !important;
      }
      .greeting {
        color: #f9fafb !important;
      }
      .intro-text {
        color: #d1d5db !important;
      }
      .section-content {
        color: #d1d5db !important;
      }
      .section-title {
        color: #f9fafb !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      {{emailLogo}}
      {{emailAppName}}
      {{emailSlogan}}
      {{emailHeaderTitle}}
      <p>{{headerSubtitle}}</p>
    </div>
    
    <div class="content">
      <div class="greeting">{{greeting}}</div>
      
      <div class="intro-text">{{introText}}</div>
      
      {{sections}}
      
      {{actionButton}}
      
      <div class="divider"></div>
      
      <div style="color: #6b7280; font-size: 15px;">{{footerText}}</div>
    </div>
    
    <div class="footer">
      <p><strong>{{disclaimerText}}</strong></p>
      <p>If you believe you received this email in error, please contact us at <a href="mailto:{{supportEmail}}" style="color: {{headerColor}}; text-decoration: none;">{{supportEmail}}</a></p>
    </div>
  </div>
</body>
</html>
`

/**
 * Template configurations for different email types
 */
export const EMAIL_TYPE_CONFIGS: Record<string, Partial<UnifiedEmailData>> = {
  ticket_created: {
    headerTitle: '{{systemName}}',
    headerSubtitle: 'Your ticket has been created',
    headerColor: '#2563eb',
    greeting: 'Hello {{customerName}},',
    introText: 'Thank you for contacting us. We have received your request and created a support ticket for you.',
    footerText: 'Best regards,<br>{{systemName}} Team'
  },
  status_changed: {
    headerTitle: '{{systemName}}',
    headerSubtitle: 'Ticket Status Updated',
    headerColor: '#059669',
    greeting: 'Hello {{customerName}},',
    introText: 'The status of your support ticket has been updated.',
    footerText: 'Best regards,<br>{{systemName}} Team'
  },
  comment_added: {
    headerTitle: '{{systemName}}',
    headerSubtitle: 'New Comment Added',
    headerColor: '#7c3aed',
    greeting: 'Hello {{customerName}},',
    introText: 'A new comment has been added to your support ticket by {{commentAuthor}}.',
    footerText: 'Best regards,<br>{{systemName}} Team'
  },
  participant_added: {
    headerTitle: '{{systemName}}',
    headerSubtitle: 'Added as Participant',
    headerColor: '#0891b2',
    greeting: 'Hello {{participantName}},',
    introText: 'You have been added as a participant to a support ticket and will receive updates about its progress.',
    footerText: 'Best regards,<br>{{systemName}} Team'
  },
  automation_warning: {
    headerTitle: '{{systemName}}',
    headerSubtitle: '⚠️ Action Required - Ticket Auto-Close Warning',
    headerColor: '#f59e0b',
    greeting: 'Hello {{customerName}},',
    introText: 'This is a reminder that your support ticket has been inactive and will be automatically closed if no response is received soon.',
    footerText: 'Thank you for using our support system!<br><br>Best regards,<br>{{systemName}} Team'
  },
  automation_closed: {
    headerTitle: '{{systemName}}',
    headerSubtitle: '✅ Ticket Automatically Closed',
    headerColor: '#6b7280',
    greeting: 'Hello {{customerName}},',
    introText: 'Your support ticket has been automatically closed due to inactivity. We hope your issue has been resolved!',
    footerText: 'Thank you for choosing {{systemName}}!<br><br>Best regards,<br>{{systemName}} Team'
  }
}

/**
 * Generate sections content for specific email types (fallback for when DB config not available)
 */
export function generateEmailSections(type: string, variables: Record<string, unknown>): EmailContentSection[] {
  switch (type) {
    case 'ticket_created':
      return [
        {
          title: 'Ticket Details',
          style: 'default',
          content: `
            <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
            <p><strong>Subject:</strong> {{ticketSubject}}</p>
            <p><strong>Status:</strong> {{ticketStatus}}</p>
            <p><strong>Priority:</strong> {{ticketPriority}}</p>
            <p><strong>Created:</strong> {{ticketCreatedAt}}</p>
          `
        }
      ]

    case 'status_changed':
      return [
        {
          title: 'Status Change',
          style: 'success',
          content: `
            <p><strong>Previous Status:</strong> {{previousStatus}}</p>
            <p><strong>New Status:</strong> {{newStatus}}</p>
            <p><strong>Updated by:</strong> {{actorName}}</p>
            <p><strong>Updated on:</strong> {{currentDate}} at {{currentTime}}</p>
            {{#statusChangeReason}}<p><strong>Reason:</strong> {{statusChangeReason}}</p>{{/statusChangeReason}}
          `
        },
        {
          title: 'Ticket Details',
          style: 'info',
          content: `
            <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
            <p><strong>Subject:</strong> {{ticketSubject}}</p>
            <p><strong>Priority:</strong> {{ticketPriority}}</p>
            {{#assignedToName}}<p><strong>Assigned to:</strong> {{assignedToName}}</p>{{/assignedToName}}
          `
        }
      ]

    case 'comment_added':
      return [
        {
          title: 'Comment',
          style: 'info',
          content: `
            <p><strong>From:</strong> {{commentAuthor}}</p>
            <p><strong>Posted:</strong> {{commentCreatedAt}}</p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              {{commentContent}}
            </div>
          `
        },
        {
          title: 'Ticket Details',
          style: 'default',
          content: `
            <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
            <p><strong>Subject:</strong> {{ticketSubject}}</p>
            <p><strong>Status:</strong> {{ticketStatus}}</p>
            <p><strong>Priority:</strong> {{ticketPriority}}</p>
          `
        }
      ]

    case 'participant_added':
      return [
        {
          title: 'Participation Details',
          style: 'info',
          content: `
            <p><strong>Added by:</strong> {{actorName}}</p>
            <p><strong>Participant Type:</strong> {{participantType}}</p>
            <p><strong>Added on:</strong> {{currentDate}} at {{currentTime}}</p>
          `
        },
        {
          title: 'Ticket Details',
          style: 'default',
          content: `
            <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
            <p><strong>Subject:</strong> {{ticketSubject}}</p>
            <p><strong>Status:</strong> {{ticketStatus}}</p>
            <p><strong>Priority:</strong> {{ticketPriority}}</p>
            <p><strong>Created:</strong> {{ticketCreatedAt}}</p>
            {{#assignedToName}}<p><strong>Assigned to:</strong> {{assignedToName}}</p>{{/assignedToName}}
          `
        }
      ]

    case 'automation_warning':
      return [
        {
          title: '🚨 Urgent: Your ticket will be automatically closed soon',
          style: 'error',
          content: `
            <p>This is a reminder that your support ticket has been inactive and will be automatically closed if no response is received soon.</p>
          `
        },
        {
          title: 'Important Notice',
          style: 'warning',
          content: `
            <p>We haven't received a response from you regarding this ticket. If you still need assistance or if your issue is not resolved, please reply to this email as soon as possible.</p>
            <p><strong>If we don't hear from you, this ticket will be automatically closed to keep our system organized.</strong></p>
          `
        },
        {
          title: 'Ticket Details',
          style: 'default',
          content: `
            <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
            <p><strong>Subject:</strong> {{ticketSubject}}</p>
            <p><strong>Status:</strong> {{ticketStatus}}</p>
            <p><strong>Priority:</strong> {{ticketPriority}}</p>
            <p><strong>Created:</strong> {{ticketCreatedAt}}</p>
            <p><strong>Last Updated:</strong> {{ticketUpdatedAt}}</p>
          `
        },
        {
          title: 'What you can do:',
          style: 'info',
          content: `
            <ul>
              <li><strong>Reply to this email</strong> if you need further assistance</li>
              <li><strong>Update your ticket</strong> with any new information</li>
              <li><strong>Let us know if your issue is resolved</strong> so we can close the ticket properly</li>
            </ul>
          `
        }
      ]

    case 'automation_closed':
      return [
        {
          title: 'Closure Information',
          style: 'default',
          content: `
            <p><strong>Reason:</strong> Automatic closure due to customer inactivity</p>
            <p><strong>Closed on:</strong> {{currentDate}} at {{currentTime}}</p>
            <p><strong>Final Status:</strong> CLOSED</p>
          `
        },
        {
          title: 'Ticket Summary',
          style: 'info',
          content: `
            <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
            <p><strong>Subject:</strong> {{ticketSubject}}</p>
            <p><strong>Priority:</strong> {{ticketPriority}}</p>
            <p><strong>Created:</strong> {{ticketCreatedAt}}</p>
            <p><strong>Duration:</strong> From {{ticketCreatedAt}} to {{currentDate}}</p>
            {{#assignedToName}}<p><strong>Handled by:</strong> {{assignedToName}}</p>{{/assignedToName}}
          `
        },
        {
          title: 'Need Further Assistance?',
          style: 'info',
          content: `
            <p>If your issue is not resolved or if you need additional help, you can easily reopen this ticket or create a new one:</p>
            <ul>
              <li><strong>Reply to this email</strong> to reopen the existing ticket</li>
              <li><strong>Contact us</strong> at {{supportEmail}} for immediate assistance</li>
              <li><strong>Create a new ticket</strong> if you have a different issue</li>
            </ul>
          `
        }
      ]

    default:
      return []
  }
}

/**
 * Get sections from database configuration or fallback to hardcoded
 */
export async function getEmailSectionsFromConfig(type: string, variables: Record<string, unknown> = {}): Promise<EmailContentSection[]> {
  try {
    const { prisma } = await import('./prisma')
    const config = await prisma.emailTypeConfig.findUnique({
      where: { type }
    })
    
    if (config && config.sections) {
      const sections = JSON.parse(config.sections) as EmailContentSection[]
      return sections.length > 0 ? sections : generateEmailSections(type, variables)
    }
  } catch (error) {
    console.error('Error fetching email sections from config:', error)
  }
  
  // Fallback to hardcoded sections
  return generateEmailSections(type, variables)
}

/**
 * Generate action button for specific email types
 * DISABLED: No self-service portal available
 */
export function generateActionButton(type: string, variables: Record<string, unknown>): { text: string; url: string; color: string } | null {
  // Action buttons disabled - no self-service portal
  return null
}

/**
 * Process conditional content blocks (e.g., {{#variable}}content{{/variable}})
 */
function processConditionalContent(content: string, variables: Record<string, unknown>): string {
  // Process conditional blocks
  const conditionalRegex = /{{#(\w+)}}([\s\S]*?){{\/\1}}/g
  content = content.replace(conditionalRegex, (match, varName, innerContent) => {
    const value = variables[varName]
    // Show content if variable exists and is truthy
    if (value !== undefined && value !== null && value !== '' && value !== false) {
      return innerContent
    }
    return ''
  })
  
  return content
}

/**
 * Render sections into HTML with variable replacement
 */
export function renderSections(sections: EmailContentSection[], variables?: Record<string, unknown>): string {
  if (!sections || sections.length === 0) {
    return ''
  }
  
  return sections.map(section => {
    const sectionClass = section.style ? `section ${section.style}` : 'section default'
    let content = section.content
    let title = section.title
    
    // Replace variables in section content and title if variables are provided
    if (variables) {
      // First process conditional content
      content = processConditionalContent(content, variables)
      
      // Then replace variables
      Object.entries(variables).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
          content = content.replace(regex, String(value))
          title = title.replace(regex, String(value))
        }
      })
      // Clean up any remaining unreplaced variables
      content = content.replace(/{{[^}]+}}/g, '')
      title = title.replace(/{{[^}]+}}/g, '')
    }
    
    return `
      <div class="${sectionClass}">
        <h3 class="section-title">${title}</h3>
        <div class="section-content">${content}</div>
      </div>
    `
  }).join('')
}

/**
 * Render action button into HTML
 */
export function renderActionButton(button: { text: string; url: string; color: string } | null): string {
  if (!button) return ''
  
  return `<a href="${button.url}" class="action-button" style="background-color: ${button.color};">${button.text}</a>`
}