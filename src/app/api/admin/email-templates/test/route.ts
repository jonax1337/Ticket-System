import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { renderEmailTemplate, EmailTemplateType } from '@/lib/email-template-service'
import { prisma } from '@/lib/prisma'

// POST - Generate test email using actual email template service for accurate testing
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
    const { type, variables } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Email template type is required' },
        { status: 400 }
      )
    }

    // Default test variables if none provided
    const defaultVariables = {
      systemName: 'Support Dashboard',
      customerName: 'John Doe',
      ticketNumber: 'T-123456',
      ticketSubject: 'Test ticket for unified template',
      ticketStatus: 'Open',
      ticketPriority: 'Medium',
      ticketCreatedAt: new Date().toLocaleString(),
      ticketUpdatedAt: new Date().toLocaleString(),
      ticketUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tickets/T-123456`,
      supportEmail: 'support@example.com',
      assignedToName: 'Support Agent',
      actorName: 'Support Agent',
      commentAuthor: 'Support Agent',
      commentContent: 'This is a test comment to demonstrate the unified template system.',
      commentCreatedAt: new Date().toLocaleString(),
      participantName: 'Jane Smith',
      participantEmail: 'jane@example.com',
      participantType: 'added_manually',
      previousStatus: 'Open',
      newStatus: 'In Progress',
      statusChangeReason: 'Agent started working on the issue',
      ...variables
    }

    // Check email type configuration for debugging
    const emailTypeConfig = await prisma.emailTypeConfig.findUnique({
      where: { type }
    })

    // Use the actual email template service (same as real emails) with debugging
    const renderedTemplate = await renderEmailTemplate(type as EmailTemplateType, defaultVariables, true)
    
    if (!renderedTemplate) {
      return NextResponse.json(
        { error: `Failed to render template for type: ${type}` },
        { status: 500 }
      )
    }

    console.log(`[TEST_DEBUG] Generated test email for ${type}:`)
    console.log(`- Subject: ${renderedTemplate.subject}`)
    console.log(`- HTML length: ${renderedTemplate.htmlContent.length}`)
    if (renderedTemplate.debugInfo) {
      console.log(`- Config source: ${renderedTemplate.debugInfo.configSource}`)
      console.log(`- Sections count: ${renderedTemplate.debugInfo.finalSectionsCount}`)
    }

    return NextResponse.json({
      type,
      renderedTemplate: {
        subject: renderedTemplate.subject,
        htmlContent: renderedTemplate.htmlContent,
        textContent: renderedTemplate.textContent
      },
      variables: defaultVariables,
      debugInfo: {
        hasEmailTypeConfig: !!emailTypeConfig,
        emailTypeConfigId: emailTypeConfig?.id,
        sectionsCount: emailTypeConfig ? JSON.parse(emailTypeConfig.sections).length : 0,
        hasActionButton: emailTypeConfig ? !!emailTypeConfig.actionButton : false,
        sections: emailTypeConfig ? JSON.parse(emailTypeConfig.sections) : null,
        templateDebugInfo: renderedTemplate.debugInfo
      },
      message: 'Test email generated using actual email template service (same as real emails)'
    })
  } catch (error) {
    console.error('Error generating test email:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error while generating test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}