import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createTestEmailTemplate, EmailTemplateType } from '@/lib/email-template-service'

// POST - Generate test email using unified template system
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

    // Generate test email HTML
    const htmlContent = await createTestEmailTemplate(type as EmailTemplateType, defaultVariables)

    return NextResponse.json({
      type,
      htmlContent,
      variables: defaultVariables,
      message: 'Test email generated successfully using unified template system'
    })
  } catch (error) {
    console.error('Error generating test email:', error)
    return NextResponse.json(
      { error: 'Internal server error while generating test email' },
      { status: 500 }
    )
  }
}