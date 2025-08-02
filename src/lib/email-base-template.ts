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
 * Modern, app-consistent design with enhanced typography and theming
 */
export const BASE_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{{headerTitle}}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Modern email-safe reset */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    /* Main body styling - consistent with app */
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: hsl(222.2, 84%, 4.9%); /* --foreground */
      margin: 0; 
      padding: 20px 0; 
      background: hsl(210, 40%, 96.1%); /* --muted */
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      width: 100% !important;
      min-width: 100%;
    }
    
    /* Main container - app-consistent card styling */
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: hsl(0, 0%, 100%); /* --background */
      border-radius: 0.75rem; /* --radius xl */
      border: 1px solid hsl(214.3, 31.8%, 91.4%); /* --border */
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }
    
    /* Header section - consistent with app header design */
    .email-header { 
      background: linear-gradient(135deg, {{headerColor}} 0%, {{headerColor}}ee 100%);
      color: white; 
      padding: 2rem 2rem 1.75rem 2rem; 
      text-align: center; 
      position: relative;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Subtle pattern overlay */
    .email-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10 10-4.5 10-10 10-10-4.5-10-10 4.5-10 10-10 10 4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E") repeat;
      opacity: 0.5;
    }
    
    /* Logo styling */
    .email-logo {
      margin-bottom: 1rem;
      position: relative;
      z-index: 2;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .email-logo img {
      max-height: 48px;
      max-width: 200px;
      height: auto;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
    }
    
    /* Header text - consistent with app typography */
    .email-header h1 { 
      margin: 0 0 0.5rem 0; 
      font-size: 1.75rem; 
      font-weight: 700; 
      letter-spacing: -0.025em;
      position: relative;
      z-index: 2;
    }
    
    .email-header .subtitle { 
      margin: 0; 
      font-size: 1rem; 
      opacity: 0.9; 
      font-weight: 500;
      position: relative;
      z-index: 2;
    }
    
    /* Content area - consistent with app card content */
    .email-content { 
      padding: 2rem 2rem 1.5rem 2rem; 
      background-color: hsl(0, 0%, 100%); /* --background */
    }
    
    /* Greeting - consistent with app headings */
    .email-greeting { 
      font-size: 1.25rem; 
      font-weight: 600; 
      margin-bottom: 1.5rem; 
      color: hsl(222.2, 84%, 4.9%); /* --foreground */
    }
    
    /* Intro text - consistent with app descriptions */
    .email-intro { 
      margin-bottom: 2rem; 
      font-size: 1rem; 
      line-height: 1.7;
      color: hsl(215.4, 16.3%, 46.9%); /* --muted-foreground */
    }
    
    /* Section cards - consistent with app card components */
    .email-section { 
      margin: 0; 
      padding: 1.5rem; 
      border-radius: 0.5rem; /* --radius */
      border: 1px solid hsl(214.3, 31.8%, 91.4%); /* --border */
      position: relative;
      background-color: hsl(0, 0%, 100%); /* --background */
      overflow: hidden;
    }
    
    /* Section accent borders */
    .email-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 3px;
      background: {{sectionColor}};
      border-radius: 0 0.25rem 0.25rem 0;
    }
    
    /* Section variants - consistent with app status colors */
    .email-section.info { 
      background: hsl(210, 40%, 98%); /* --secondary light */
      border-color: hsl(210, 40%, 91%);
    }
    .email-section.info::before { background: hsl(221, 83%, 53%); } /* info blue */
    
    .email-section.success { 
      background: hsl(142, 76%, 96%);
      border-color: hsl(142, 76%, 88%);
    }
    .email-section.success::before { background: hsl(142, 76%, 36%); } /* success green */
    
    .email-section.warning { 
      background: hsl(25, 95%, 96%);
      border-color: hsl(25, 95%, 88%);
    }
    .email-section.warning::before { background: hsl(25, 95%, 53%); } /* warning orange */
    
    .email-section.error { 
      background: hsl(0, 84%, 96%);
      border-color: hsl(0, 84%, 88%);
    }
    .email-section.error::before { background: hsl(0, 84.2%, 60.2%); } /* --destructive */
    
    .email-section.default { 
      background: hsl(210, 40%, 98%); /* --secondary */
      border-color: hsl(214.3, 31.8%, 91.4%); /* --border */
    }
    .email-section.default::before { background: hsl(222.2, 47.4%, 11.2%); } /* --primary */
    
    /* Section titles - consistent with app card titles */
    .email-section-title { 
      font-size: 1.125rem; 
      font-weight: 600; 
      margin: 0 0 0.75rem 0; 
      color: hsl(222.2, 84%, 4.9%); /* --foreground */
      line-height: 1.25;
    }
    
    /* Section content - consistent with app text */
    .email-section-content { 
      font-size: 0.9375rem; 
      margin: 0; 
      color: hsl(215.4, 16.3%, 46.9%); /* --muted-foreground */
      line-height: 1.6;
    }
    
    .email-section-content p { 
      margin: 0.75rem 0; 
    }
    
    .email-section-content p:first-child {
      margin-top: 0;
    }
    
    .email-section-content p:last-child {
      margin-bottom: 0;
    }
    
    .email-section-content ul { 
      margin: 0.75rem 0; 
      padding-left: 1.5rem; 
    }
    
    .email-section-content li {
      margin: 0.375rem 0;
    }
    
    .email-section-content strong {
      color: hsl(222.2, 84%, 4.9%); /* --foreground */
      font-weight: 600;
    }
    
    /* Action button - consistent with app primary button */
    .email-action-button { 
      display: inline-block; 
      background: linear-gradient(135deg, {{buttonColor}} 0%, {{buttonColor}}dd 100%);
      color: hsl(210, 40%, 98%); /* --primary-foreground */
      padding: 0.875rem 2rem; 
      text-decoration: none; 
      border-radius: 0.5rem; /* --radius */
      margin: 2rem 0 1.5rem 0; 
      font-weight: 600;
      font-size: 0.9375rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      transition: all 0.15s ease;
      letter-spacing: 0.025em;
      line-height: 1.25;
    }
    
    .email-action-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
    }
    
    /* Divider - consistent with app separators */
    .email-divider { 
      height: 1px; 
      background: hsl(214.3, 31.8%, 91.4%); /* --border */
      margin: 2rem 0; 
      border: none;
    }
    
    /* Section divider - same styling as main divider */
    .email-section-divider { 
      height: 1px; 
      background: hsl(214.3, 31.8%, 91.4%); /* --border */
      margin: 2rem 0; 
      border: none;
    }
    
    /* Footer text styling */
    .email-footer-text {
      color: hsl(215.4, 16.3%, 46.9%); /* --muted-foreground */
      font-size: 0.9375rem;
      line-height: 1.6;
    }
    
    /* Footer - consistent with app muted sections */
    .email-footer { 
      background: hsl(210, 40%, 98%); /* --secondary */
      padding: 2rem; 
      text-align: center; 
      font-size: 0.8125rem; 
      color: hsl(215.4, 16.3%, 46.9%); /* --muted-foreground */
      border-top: 1px solid hsl(214.3, 31.8%, 91.4%); /* --border */
    }
    
    .email-footer p { 
      margin: 0.5rem 0; 
      line-height: 1.5;
    }
    
    .email-footer a {
      color: {{headerColor}};
      text-decoration: none;
      font-weight: 500;
    }
    
    .email-footer a:hover {
      text-decoration: underline;
    }
    
    /* Responsive design - app-consistent breakpoints */
    @media only screen and (max-width: 640px) {
      body {
        padding: 0.75rem 0 !important;
      }
      
      .email-container { 
        width: calc(100% - 1.5rem) !important; 
        margin: 0 0.75rem !important;
        border-radius: 0.5rem !important;
      }
      
      .email-header {
        padding: 1.5rem 1.25rem 1.25rem 1.25rem !important;
      }
      
      .email-header h1 {
        font-size: 1.5rem !important;
      }
      
      .email-content { 
        padding: 1.5rem 1.25rem 1.25rem 1.25rem !important; 
      }
      
      .email-section {
        padding: 1.25rem !important;
        margin: 0 !important;
      }
      
      .email-divider {
        margin: 1.5rem 0 !important;
      }
      
      .email-section-divider {
        margin: 1.5rem 0 !important;
      }
      
      .email-section-title {
        font-size: 1rem !important;
      }
      
      .email-footer {
        padding: 1.5rem 1.25rem !important;
      }
      
      .email-action-button {
        padding: 0.75rem 1.5rem !important;
        font-size: 0.875rem !important;
        display: block !important;
        text-align: center !important;
        width: calc(100% - 3rem) !important;
        margin: 1.5rem 0 !important;
      }
    }
    
    /* Dark mode support - consistent with app dark theme */
    @media (prefers-color-scheme: dark) {
      body {
        background: hsl(0, 0%, 3.9%) !important; /* --background dark */
      }
      
      .email-container {
        background-color: hsl(0, 0%, 3.9%) !important; /* --background dark */
        border-color: hsl(0, 0%, 14.9%) !important; /* --border dark */
      }
      
      .email-content {
        background-color: hsl(0, 0%, 3.9%) !important; /* --background dark */
      }
      
      .email-greeting {
        color: hsl(0, 0%, 98%) !important; /* --foreground dark */
      }
      
      .email-intro {
        color: hsl(0, 0%, 63.9%) !important; /* --muted-foreground dark */
      }
      
      .email-footer-text {
        color: hsl(0, 0%, 63.9%) !important; /* --muted-foreground dark */
      }
      
      .email-section {
        background-color: hsl(0, 0%, 3.9%) !important; /* --background dark */
        border-color: hsl(0, 0%, 14.9%) !important; /* --border dark */
      }
      
      .email-section.info,
      .email-section.success,
      .email-section.warning,
      .email-section.error,
      .email-section.default {
        background-color: hsl(0, 0%, 3.9%) !important; /* --background dark */
        border-color: hsl(0, 0%, 14.9%) !important; /* --border dark */
      }
      
      .email-section-content {
        color: hsl(0, 0%, 63.9%) !important; /* --muted-foreground dark */
      }
      
      .email-section-content strong {
        color: hsl(0, 0%, 98%) !important; /* --foreground dark */
      }
      
      .email-section-title {
        color: hsl(0, 0%, 98%) !important; /* --foreground dark */
      }
      
      .email-footer {
        background: hsl(0, 0%, 14.9%) !important; /* --secondary dark */
        border-color: hsl(0, 0%, 14.9%) !important; /* --border dark */
        color: hsl(0, 0%, 63.9%) !important; /* --muted-foreground dark */
      }
      
      .email-divider {
        background: hsl(0, 0%, 14.9%) !important; /* --border dark */
      }
      
      .email-section-divider {
        background: hsl(0, 0%, 14.9%) !important; /* --border dark */
      }
    }
    
    /* Outlook-specific fixes */
    .outlook-only {
      mso-hide: all;
    }
    
    /* High DPI display support */
    @media only screen and (-webkit-min-device-pixel-ratio: 2) {
      .email-logo img {
        max-height: 48px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header Section -->
    <div class="email-header">
      {{emailLogo}}
      {{emailAppName}}
      {{emailSlogan}}
      {{emailHeaderTitle}}
      <p class="subtitle">{{headerSubtitle}}</p>
    </div>
    
    <!-- Main Content -->
    <div class="email-content">
      <div class="email-greeting">{{greeting}}</div>
      
      <div class="email-intro">{{introText}}</div>
      
      <!-- Dynamic Sections -->
      {{sections}}
      
      <!-- Action Button (if available) -->
      {{actionButton}}
      
      <!-- Divider -->
      <hr class="email-divider">
      
      <!-- Footer Text -->
      <div class="email-footer-text">{{footerText}}</div>
    </div>
    
    <!-- Footer -->
    <div class="email-footer">
      <p><strong>{{disclaimerText}}</strong></p>
      <p>If you believe you received this email in error, please contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
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
  
  const renderedSections = sections.map(section => {
    const sectionClass = section.style ? `email-section ${section.style}` : 'email-section default'
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
        <h3 class="email-section-title">${title}</h3>
        <div class="email-section-content">${content}</div>
      </div>
    `
  })
  
  // Join sections with dividers between them (but not after the last section)
  // Use inline styles for dividers to work with custom templates
  const divider = '<hr style="height: 1px; background: #e5e7eb; margin: 2rem 0; border: none;">'
  
  return `<div style="margin-top: 1.5rem; margin-bottom: 1.5rem;">
    ${renderedSections.join(divider)}
  </div>`
}

/**
 * Render action button into HTML
 */
export function renderActionButton(button: { text: string; url: string; color: string } | null): string {
  if (!button) return ''
  
  return `<a href="${button.url}" class="email-action-button" style="background-color: ${button.color};">${button.text}</a>`
}