import { prisma } from './prisma'

export type EmailTemplateType = 
  | 'ticket_created'
  | 'status_changed' 
  | 'comment_added'
  | 'participant_added'

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
  
  // Additional context
  additionalNotes?: string
  currentDate?: string
  currentTime?: string
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
 * Render email template with variables
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

    const renderedSubject = replaceTemplateVariables(template.subject, fullVariables)
    const renderedHtmlContent = replaceTemplateVariables(template.htmlContent, fullVariables)
    const renderedTextContent = template.textContent 
      ? replaceTemplateVariables(template.textContent, fullVariables)
      : undefined

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
 * Get system default variables
 */
async function getSystemDefaults(): Promise<TemplateVariables> {
  try {
    const systemSettings = await prisma.systemSettings.findFirst()
    
    return {
      systemName: systemSettings?.appName || 'Support System',
      supportEmail: 'support@example.com', // This should come from email config
      supportUrl: process.env.NEXTAUTH_URL || 'https://localhost:3000',
      unsubscribeUrl: `${process.env.NEXTAUTH_URL || 'https://localhost:3000'}/unsubscribe`
    }
  } catch (error) {
    console.error('Error fetching system defaults:', error)
    return {
      systemName: 'Support System',
      supportEmail: 'support@example.com',
      supportUrl: 'https://localhost:3000',
      unsubscribeUrl: 'https://localhost:3000/unsubscribe'
    }
  }
}

/**
 * Create default email templates
 */
export async function createDefaultEmailTemplates(): Promise<void> {
  const defaultTemplates = [
    {
      type: 'ticket_created',
      name: 'Ticket Created Confirmation',
      subject: 'Ticket {{ticketNumber}} Created: {{ticketSubject}}',
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Created</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .ticket-info { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{systemName}}</h1>
      <p>Your ticket has been created</p>
    </div>
    
    <div class="content">
      <h2>Hello {{customerName}},</h2>
      
      <p>Thank you for contacting us. We have received your request and created a support ticket for you.</p>
      
      <div class="ticket-info">
        <h3>Ticket Details</h3>
        <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
        <p><strong>Subject:</strong> {{ticketSubject}}</p>
        <p><strong>Status:</strong> {{ticketStatus}}</p>
        <p><strong>Priority:</strong> {{ticketPriority}}</p>
        <p><strong>Created:</strong> {{ticketCreatedAt}}</p>
      </div>
      
      <p>Our support team will review your request and respond as soon as possible. You can track the progress of your ticket using the ticket number provided above.</p>
      
      {{#ticketUrl}}
      <a href="{{ticketUrl}}" class="button">View Ticket</a>
      {{/ticketUrl}}
      
      <p>If you have any additional information to add to this ticket, please reply to this email with the ticket number in the subject line.</p>
      
      <p>Best regards,<br>{{systemName}} Support Team</p>
    </div>
    
    <div class="footer">
      <p>This email was sent from {{systemName}} support system.</p>
      <p>If you believe you received this email in error, please contact us at {{supportEmail}}</p>
    </div>
  </div>
</body>
</html>`,
      textContent: `Hello {{customerName}},

Thank you for contacting us. We have received your request and created a support ticket for you.

Ticket Details:
- Ticket Number: {{ticketNumber}}
- Subject: {{ticketSubject}}
- Status: {{ticketStatus}}
- Priority: {{ticketPriority}}
- Created: {{ticketCreatedAt}}

Our support team will review your request and respond as soon as possible. You can track the progress of your ticket using the ticket number provided above.

If you have any additional information to add to this ticket, please reply to this email with the ticket number in the subject line.

Best regards,
{{systemName}} Support Team

---
This email was sent from {{systemName}} support system.
If you believe you received this email in error, please contact us at {{supportEmail}}`
    },
    {
      type: 'status_changed',
      name: 'Status Change Notification',
      subject: 'Ticket {{ticketNumber}} Status Updated: {{newStatus}}',
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Status Updated</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .status-change { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; }
    .ticket-info { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{systemName}}</h1>
      <p>Ticket Status Updated</p>
    </div>
    
    <div class="content">
      <h2>Hello {{customerName}},</h2>
      
      <p>The status of your support ticket has been updated.</p>
      
      <div class="status-change">
        <h3>Status Change</h3>
        <p><strong>Previous Status:</strong> {{previousStatus}}</p>
        <p><strong>New Status:</strong> {{newStatus}}</p>
        <p><strong>Updated by:</strong> {{actorName}}</p>
        <p><strong>Updated on:</strong> {{currentDate}} at {{currentTime}}</p>
        {{#statusChangeReason}}
        <p><strong>Reason:</strong> {{statusChangeReason}}</p>
        {{/statusChangeReason}}
      </div>
      
      <div class="ticket-info">
        <h3>Ticket Details</h3>
        <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
        <p><strong>Subject:</strong> {{ticketSubject}}</p>
        <p><strong>Priority:</strong> {{ticketPriority}}</p>
        {{#assignedToName}}
        <p><strong>Assigned to:</strong> {{assignedToName}}</p>
        {{/assignedToName}}
      </div>
      
      {{#ticketUrl}}
      <a href="{{ticketUrl}}" class="button">View Ticket</a>
      {{/ticketUrl}}
      
      <p>If you have any questions about this update, please reply to this email.</p>
      
      <p>Best regards,<br>{{systemName}} Support Team</p>
    </div>
    
    <div class="footer">
      <p>This email was sent from {{systemName}} support system.</p>
      <p>If you believe you received this email in error, please contact us at {{supportEmail}}</p>
    </div>
  </div>
</body>
</html>`,
      textContent: `Hello {{customerName}},

The status of your support ticket has been updated.

Status Change:
- Previous Status: {{previousStatus}}
- New Status: {{newStatus}}
- Updated by: {{actorName}}
- Updated on: {{currentDate}} at {{currentTime}}
{{#statusChangeReason}}
- Reason: {{statusChangeReason}}
{{/statusChangeReason}}

Ticket Details:
- Ticket Number: {{ticketNumber}}
- Subject: {{ticketSubject}}
- Priority: {{ticketPriority}}
{{#assignedToName}}
- Assigned to: {{assignedToName}}
{{/assignedToName}}

If you have any questions about this update, please reply to this email.

Best regards,
{{systemName}} Support Team

---
This email was sent from {{systemName}} support system.
If you believe you received this email in error, please contact us at {{supportEmail}}`
    },
    {
      type: 'comment_added',
      name: 'New Comment Notification',
      subject: 'New Comment on Ticket {{ticketNumber}}: {{ticketSubject}}',
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Comment Added</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #7c3aed; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .comment-content { background-color: #faf5ff; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0; }
    .ticket-info { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{systemName}}</h1>
      <p>New Comment Added</p>
    </div>
    
    <div class="content">
      <h2>Hello {{customerName}},</h2>
      
      <p>A new comment has been added to your support ticket by {{commentAuthor}}.</p>
      
      <div class="comment-content">
        <h3>Comment</h3>
        <p><strong>From:</strong> {{commentAuthor}}</p>
        <p><strong>Posted:</strong> {{commentCreatedAt}}</p>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
          {{commentContent}}
        </div>
      </div>
      
      <div class="ticket-info">
        <h3>Ticket Details</h3>
        <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
        <p><strong>Subject:</strong> {{ticketSubject}}</p>
        <p><strong>Status:</strong> {{ticketStatus}}</p>
        <p><strong>Priority:</strong> {{ticketPriority}}</p>
      </div>
      
      {{#ticketUrl}}
      <a href="{{ticketUrl}}" class="button">View Ticket & Reply</a>
      {{/ticketUrl}}
      
      <p>You can reply to this ticket by responding to this email with the ticket number in the subject line.</p>
      
      <p>Best regards,<br>{{systemName}} Support Team</p>
    </div>
    
    <div class="footer">
      <p>This email was sent from {{systemName}} support system.</p>
      <p>If you believe you received this email in error, please contact us at {{supportEmail}}</p>
    </div>
  </div>
</body>
</html>`,
      textContent: `Hello {{customerName}},

A new comment has been added to your support ticket by {{commentAuthor}}.

Comment:
From: {{commentAuthor}}
Posted: {{commentCreatedAt}}

{{commentContent}}

Ticket Details:
- Ticket Number: {{ticketNumber}}
- Subject: {{ticketSubject}}
- Status: {{ticketStatus}}
- Priority: {{ticketPriority}}

You can reply to this ticket by responding to this email with the ticket number in the subject line.

Best regards,
{{systemName}} Support Team

---
This email was sent from {{systemName}} support system.
If you believe you received this email in error, please contact us at {{supportEmail}}`
    },
    {
      type: 'participant_added',
      name: 'Added as Participant',
      subject: 'You have been added to Ticket {{ticketNumber}}: {{ticketSubject}}',
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Added as Participant</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0891b2; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .participant-info { background-color: #f0f9ff; border-left: 4px solid #0891b2; padding: 15px; margin: 20px 0; }
    .ticket-info { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{systemName}}</h1>
      <p>Added as Participant</p>
    </div>
    
    <div class="content">
      <h2>Hello {{participantName}},</h2>
      
      <p>You have been added as a participant to a support ticket and will receive updates about its progress.</p>
      
      <div class="participant-info">
        <h3>Participation Details</h3>
        <p><strong>Added by:</strong> {{actorName}}</p>
        <p><strong>Participant Type:</strong> {{participantType}}</p>
        <p><strong>Added on:</strong> {{currentDate}} at {{currentTime}}</p>
      </div>
      
      <div class="ticket-info">
        <h3>Ticket Details</h3>
        <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
        <p><strong>Subject:</strong> {{ticketSubject}}</p>
        <p><strong>Status:</strong> {{ticketStatus}}</p>
        <p><strong>Priority:</strong> {{ticketPriority}}</p>
        <p><strong>Created:</strong> {{ticketCreatedAt}}</p>
        {{#assignedToName}}
        <p><strong>Assigned to:</strong> {{assignedToName}}</p>
        {{/assignedToName}}
      </div>
      
      {{#ticketDescription}}
      <div style="background-color: #f8fafc; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h4>Original Request</h4>
        <p>{{ticketDescription}}</p>
      </div>
      {{/ticketDescription}}
      
      {{#ticketUrl}}
      <a href="{{ticketUrl}}" class="button">View Ticket</a>
      {{/ticketUrl}}
      
      <p>You will receive email notifications for any updates to this ticket. You can also reply to participate in the conversation by responding to notification emails.</p>
      
      <p>Best regards,<br>{{systemName}} Support Team</p>
    </div>
    
    <div class="footer">
      <p>This email was sent from {{systemName}} support system.</p>
      <p>If you believe you received this email in error, please contact us at {{supportEmail}}</p>
    </div>
  </div>
</body>
</html>`,
      textContent: `Hello {{participantName}},

You have been added as a participant to a support ticket and will receive updates about its progress.

Participation Details:
- Added by: {{actorName}}
- Participant Type: {{participantType}}
- Added on: {{currentDate}} at {{currentTime}}

Ticket Details:
- Ticket Number: {{ticketNumber}}
- Subject: {{ticketSubject}}
- Status: {{ticketStatus}}
- Priority: {{ticketPriority}}
- Created: {{ticketCreatedAt}}
{{#assignedToName}}
- Assigned to: {{assignedToName}}
{{/assignedToName}}

{{#ticketDescription}}
Original Request:
{{ticketDescription}}
{{/ticketDescription}}

You will receive email notifications for any updates to this ticket. You can also reply to participate in the conversation by responding to notification emails.

Best regards,
{{systemName}} Support Team

---
This email was sent from {{systemName}} support system.
If you believe you received this email in error, please contact us at {{supportEmail}}`
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
        console.log(`Created default email template: ${template.type}`)
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