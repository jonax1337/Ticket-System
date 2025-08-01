import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createTestEmailTemplate, EmailTemplateType } from '@/lib/email-template-service'

// POST - Generate preview for base template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { templateType = 'ticket_created', customVariables = {} } = body

    // Base sample data that's common across all templates
    const baseData = {
      ticketNumber: 'T-123456',
      ticketSubject: 'Sample Support Request - Unable to Access Dashboard',
      ticketDescription: 'I\'m having trouble accessing my dashboard. The page keeps loading but never displays my data. This started happening after the recent update.',
      ticketStatus: 'Open',
      ticketPriority: 'High',
      ticketCreatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(), // 1 day ago
      ticketUpdatedAt: new Date().toLocaleString(),
      ticketUrl: `${process.env.NEXTAUTH_URL || 'https://support.example.com'}/tickets/T-123456`,
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      assignedToName: 'Sarah Johnson',
      assignedToEmail: 'sarah.johnson@support.com',
      systemName: 'Support System',
      supportEmail: 'support@example.com',
      supportUrl: process.env.NEXTAUTH_URL || 'https://support.example.com',
      unsubscribeUrl: `${process.env.NEXTAUTH_URL || 'https://support.example.com'}/unsubscribe`,
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString(),
      emailSubjectPrefix: '[Ticket {{ticketNumber}}]'
    }

    // Template-specific sample data
    let sampleData = { ...baseData }
    
    switch (templateType) {
      case 'ticket_created':
        sampleData = {
          ...sampleData,
          ticketStatus: 'Open',
          ticketPriority: 'High',
          ...customVariables
        }
        break
        
      case 'status_changed':
        sampleData = {
          ...sampleData,
          previousStatus: 'Open',
          newStatus: 'In Progress',
          statusChangeReason: 'Our team has started investigating your issue',
          actorName: 'Sarah Johnson',
          actorEmail: 'sarah.johnson@support.com',
          ...customVariables
        }
        break
        
      case 'comment_added':
        sampleData = {
          ...sampleData,
          commentContent: `<p>Hi John,</p>
<p>Thank you for reporting this issue. I've looked into your account and I can see the problem you're experiencing.</p>
<p>I've escalated this to our technical team and they're working on a fix. In the meantime, you can try clearing your browser cache or using a different browser as a temporary workaround.</p>
<p>I'll update you as soon as we have more information.</p>
<p>Best regards,<br>Sarah</p>`,
          commentAuthor: 'Sarah Johnson',
          commentCreatedAt: new Date().toLocaleString(),
          actorName: 'Sarah Johnson',
          actorEmail: 'sarah.johnson@support.com',
          ...customVariables
        }
        break
        
      case 'participant_added':
        sampleData = {
          ...sampleData,
          participantName: 'Technical Team',
          participantEmail: 'tech@support.com',
          participantType: 'cc',
          actorName: 'Sarah Johnson',
          actorEmail: 'sarah.johnson@support.com',
          ...customVariables
        }
        break
        
      case 'automation_warning':
        sampleData = {
          ...sampleData,
          ticketStatus: 'Waiting for Customer',
          ticketUpdatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleString(), // 5 days ago
          additionalNotes: 'This ticket will be automatically closed in 2 days if no response is received.',
          ...customVariables
        }
        break
        
      case 'automation_closed':
        sampleData = {
          ...sampleData,
          ticketStatus: 'Closed',
          previousStatus: 'Waiting for Customer',
          ticketUpdatedAt: new Date().toLocaleString(),
          additionalNotes: 'This ticket was automatically closed due to inactivity.',
          ...customVariables
        }
        break
        
      default:
        sampleData = {
          ...sampleData,
          ...customVariables
        }
    }

    // Generate preview HTML
    const htmlContent = await createTestEmailTemplate(templateType as EmailTemplateType, sampleData)
    
    // Generate subject with prefix
    const subjectPrefix = '[Ticket {{ticketNumber}}]'
    const baseSubject = (() => {
      switch (templateType) {
        case 'ticket_created': return 'Ticket Created: {{ticketSubject}}'
        case 'status_changed': return 'Status Updated: {{newStatus}}'
        case 'comment_added': return 'New Comment: {{ticketSubject}}'
        case 'participant_added': return 'Added as Participant: {{ticketSubject}}'
        case 'automation_warning': return 'Action Required: Ticket Will Auto-Close Soon'
        case 'automation_closed': return 'Ticket Automatically Closed'
        default: return 'Notification: {{ticketSubject}}'
      }
    })()

    const fullSubject = `${subjectPrefix} ${baseSubject}`
      .replace(/{{ticketNumber}}/g, sampleData.ticketNumber)
      .replace(/{{ticketSubject}}/g, sampleData.ticketSubject)
      .replace(/{{newStatus}}/g, 'In Progress')

    return NextResponse.json({
      subject: fullSubject,
      htmlContent,
      sampleData
    })
  } catch (error) {
    console.error('Error generating base template preview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}