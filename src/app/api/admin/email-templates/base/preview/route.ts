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

    // Sample data for preview
    const sampleData = {
      ticketNumber: 'T-123456',
      ticketSubject: 'Sample Support Request',
      ticketDescription: 'This is a sample ticket description for preview purposes.',
      ticketStatus: 'Open',
      ticketPriority: 'Medium',
      ticketCreatedAt: new Date().toLocaleDateString(),
      ticketUpdatedAt: new Date().toLocaleDateString(),
      ticketUrl: 'https://example.com/tickets/T-123456',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      assignedToName: 'Support Agent',
      assignedToEmail: 'agent@example.com',
      systemName: 'Support Dashboard',
      supportEmail: 'support@example.com',
      supportUrl: 'https://example.com',
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString(),
      ...customVariables
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