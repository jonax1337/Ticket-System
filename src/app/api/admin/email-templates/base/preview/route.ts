import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { renderEmailTemplate, EmailTemplateType } from '@/lib/email-template-service'

// POST - Generate preview for base template using actual email template service
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
      // Additional variables for other template types
      commentContent: 'This is a sample comment content for preview.',
      commentAuthor: 'Support Agent',
      commentCreatedAt: new Date().toLocaleString(),
      actorName: 'Support Agent',
      actorEmail: 'agent@example.com',
      previousStatus: 'Open',
      newStatus: 'In Progress',
      participantName: 'Jane Smith',
      participantEmail: 'jane.smith@example.com',
      participantType: 'CC recipient',
      ...customVariables
    }

    // Use the actual email template service to generate preview with debugging
    // This ensures the preview matches exactly what users will receive
    const renderedTemplate = await renderEmailTemplate(templateType as EmailTemplateType, sampleData, true)
    
    if (!renderedTemplate) {
      return NextResponse.json(
        { error: `Failed to render template for type: ${templateType}` },
        { status: 500 }
      )
    }

    console.log(`[PREVIEW_DEBUG] Generated preview for ${templateType}:`)
    console.log(`- Subject: ${renderedTemplate.subject}`)
    console.log(`- HTML length: ${renderedTemplate.htmlContent.length}`)
    if (renderedTemplate.debugInfo) {
      console.log(`- Config source: ${renderedTemplate.debugInfo.configSource}`)
      console.log(`- Sections count: ${renderedTemplate.debugInfo.finalSectionsCount}`)
    }

    return NextResponse.json({
      subject: renderedTemplate.subject,
      htmlContent: renderedTemplate.htmlContent,
      textContent: renderedTemplate.textContent,
      sampleData,
      debugInfo: renderedTemplate.debugInfo
    })
  } catch (error) {
    console.error('Error generating base template preview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}