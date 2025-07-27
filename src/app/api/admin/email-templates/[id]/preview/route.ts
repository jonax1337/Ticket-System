import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { replaceTemplateVariables } from '@/lib/email-template-service'

// POST - Preview email template with sample data
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const params = await context.params
    const body = await request.json()
    const { customVariables } = body

    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.id }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Default sample data for preview
    const sampleData = {
      // Ticket information
      ticketNumber: 'T-123456',
      ticketSubject: 'Login issue with user account',
      ticketDescription: 'I am unable to login to my account. I keep getting an error message saying "Invalid credentials" even though I am sure my password is correct.',
      ticketStatus: 'Open',
      ticketPriority: 'High',
      ticketCreatedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      ticketUpdatedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      ticketUrl: `${process.env.NEXTAUTH_URL || 'https://localhost:3000'}/dashboard/tickets/sample-ticket-id`,
      
      // User/Customer information
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      assignedToName: 'Sarah Smith',
      assignedToEmail: 'sarah.smith@company.com',
      actorName: 'Support Agent',
      actorEmail: 'support@company.com',
      
      // Status change specific
      previousStatus: 'Open',
      newStatus: 'In Progress',
      statusChangeReason: 'Assigned to technical team for investigation',
      
      // Comment specific
      commentContent: 'Thank you for reporting this issue. I have reviewed your account and found that there was a temporary lock due to multiple failed login attempts. I have now unlocked your account. Please try logging in again and let me know if you continue to experience any issues.',
      commentAuthor: 'Sarah Smith',
      commentCreatedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      
      // Participant specific
      participantName: 'Jane Wilson',
      participantEmail: 'jane.wilson@example.com',
      participantType: 'CC Recipient',
      
      // System information
      systemName: 'Support System',
      supportEmail: 'support@company.com',
      supportUrl: process.env.NEXTAUTH_URL || 'https://localhost:3000',
      unsubscribeUrl: `${process.env.NEXTAUTH_URL || 'https://localhost:3000'}/unsubscribe`,
      
      // Additional context
      additionalNotes: 'This is a sample preview of the email template.',
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString(),
      
      // Override with any custom variables provided
      ...customVariables
    }

    const renderedSubject = replaceTemplateVariables(template.subject, sampleData)
    const renderedHtmlContent = replaceTemplateVariables(template.htmlContent, sampleData)
    const renderedTextContent = template.textContent 
      ? replaceTemplateVariables(template.textContent, sampleData)
      : null

    return NextResponse.json({
      subject: renderedSubject,
      htmlContent: renderedHtmlContent,
      textContent: renderedTextContent,
      sampleData
    })
  } catch (error) {
    console.error('Error previewing email template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}