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
 */
export const BASE_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{headerTitle}}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f4f4f4; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff; 
    }
    .header { 
      background-color: {{headerColor}}; 
      color: white; 
      padding: 20px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0 0 5px 0; 
      font-size: 24px; 
      font-weight: bold; 
    }
    .header p { 
      margin: 0; 
      font-size: 14px; 
      opacity: 0.9; 
    }
    .content { 
      padding: 30px; 
    }
    .greeting { 
      font-size: 18px; 
      font-weight: 600; 
      margin-bottom: 15px; 
    }
    .intro-text { 
      margin-bottom: 25px; 
      font-size: 16px; 
    }
    .section { 
      margin: 20px 0; 
      padding: 15px; 
      border-left: 4px solid #e5e7eb; 
    }
    .section.info { 
      background-color: #f0f9ff; 
      border-left-color: #0891b2; 
    }
    .section.success { 
      background-color: #f0fdf4; 
      border-left-color: #059669; 
    }
    .section.warning { 
      background-color: #fef3c7; 
      border-left-color: #f59e0b; 
    }
    .section.error { 
      background-color: #fee2e2; 
      border-left-color: #dc2626; 
    }
    .section.default { 
      background-color: #f8fafc; 
      border-left-color: #2563eb; 
    }
    .section-title { 
      font-size: 16px; 
      font-weight: 600; 
      margin: 0 0 10px 0; 
      display: flex; 
      align-items: center; 
      gap: 8px; 
    }
    .section-content { 
      font-size: 14px; 
      margin: 0; 
    }
    .section-content p { 
      margin: 8px 0; 
    }
    .section-content ul { 
      margin: 8px 0; 
      padding-left: 20px; 
    }
    .action-button { 
      display: inline-block; 
      background-color: {{buttonColor}}; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin: 20px 0; 
      font-weight: 600; 
    }
    .footer { 
      background-color: #f8fafc; 
      padding: 20px; 
      text-align: center; 
      font-size: 12px; 
      color: #666; 
    }
    .footer p { 
      margin: 5px 0; 
    }
    .divider { 
      height: 1px; 
      background-color: #e5e7eb; 
      margin: 20px 0; 
    }
    @media only screen and (max-width: 600px) {
      .container { 
        width: 100% !important; 
      }
      .content { 
        padding: 20px !important; 
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{headerTitle}}</h1>
      <p>{{headerSubtitle}}</p>
    </div>
    
    <div class="content">
      <div class="greeting">{{greeting}}</div>
      
      <div class="intro-text">{{introText}}</div>
      
      {{sections}}
      
      {{actionButton}}
      
      <div class="divider"></div>
      
      <p>{{footerText}}</p>
    </div>
    
    <div class="footer">
      <p>{{disclaimerText}}</p>
      <p>This email was sent from {{systemName}} support system.</p>
      <p>If you believe you received this email in error, please contact us at {{supportEmail}}</p>
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
    footerText: 'Best regards,<br>{{systemName}} Support Team'
  },
  status_changed: {
    headerTitle: '{{systemName}}',
    headerSubtitle: 'Ticket Status Updated',
    headerColor: '#059669',
    greeting: 'Hello {{customerName}},',
    introText: 'The status of your support ticket has been updated.',
    footerText: 'Best regards,<br>{{systemName}} Support Team'
  },
  comment_added: {
    headerTitle: '{{systemName}}',
    headerSubtitle: 'New Comment Added',
    headerColor: '#7c3aed',
    greeting: 'Hello {{customerName}},',
    introText: 'A new comment has been added to your support ticket by {{commentAuthor}}.',
    footerText: 'Best regards,<br>{{systemName}} Support Team'
  },
  participant_added: {
    headerTitle: '{{systemName}}',
    headerSubtitle: 'Added as Participant',
    headerColor: '#0891b2',
    greeting: 'Hello {{participantName}},',
    introText: 'You have been added as a participant to a support ticket and will receive updates about its progress.',
    footerText: 'Best regards,<br>{{systemName}} Support Team'
  },
  automation_warning: {
    headerTitle: '{{systemName}}',
    headerSubtitle: '⚠️ Action Required - Ticket Auto-Close Warning',
    headerColor: '#f59e0b',
    greeting: 'Hello {{customerName}},',
    introText: 'This is a reminder that your support ticket has been inactive and will be automatically closed if no response is received soon.',
    footerText: 'Thank you for using our support system!<br><br>Best regards,<br>{{systemName}} Support Team'
  },
  automation_closed: {
    headerTitle: '{{systemName}}',
    headerSubtitle: '✅ Ticket Automatically Closed',
    headerColor: '#6b7280',
    greeting: 'Hello {{customerName}},',
    introText: 'Your support ticket has been automatically closed due to inactivity. We hope your issue has been resolved!',
    footerText: 'Thank you for choosing {{systemName}}!<br><br>Best regards,<br>{{systemName}} Support Team'
  }
}

/**
 * Generate sections content for specific email types
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
 * Generate action button for specific email types
 */
export function generateActionButton(type: string, variables: Record<string, unknown>): { text: string; url: string; color: string } | null {
  if (variables.ticketUrl && typeof variables.ticketUrl === 'string') {
    switch (type) {
      case 'ticket_created':
        return {
          text: 'View Ticket',
          url: variables.ticketUrl,
          color: '#2563eb'
        }
      case 'status_changed':
        return {
          text: 'View Ticket',
          url: variables.ticketUrl,
          color: '#059669'
        }
      case 'comment_added':
        return {
          text: 'View Ticket & Reply',
          url: variables.ticketUrl,
          color: '#7c3aed'
        }
      case 'participant_added':
        return {
          text: 'View Ticket',
          url: variables.ticketUrl,
          color: '#0891b2'
        }
      case 'automation_warning':
        return {
          text: 'View & Update Ticket',
          url: variables.ticketUrl,
          color: '#f59e0b'
        }
      case 'automation_closed':
        return {
          text: 'View Closed Ticket',
          url: variables.ticketUrl,
          color: '#2563eb'
        }
    }
  }
  return null
}

/**
 * Render sections into HTML
 */
export function renderSections(sections: EmailContentSection[]): string {
  return sections.map(section => {
    const sectionClass = section.style ? `section ${section.style}` : 'section default'
    return `
      <div class="${sectionClass}">
        <h3 class="section-title">${section.title}</h3>
        <div class="section-content">${section.content}</div>
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