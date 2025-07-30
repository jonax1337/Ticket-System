import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateTicketNumber, ensureUniqueTicketNumber } from '@/lib/ticket-number-generator'
import { normalizeDateToMidnight } from '@/lib/date-utils'

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()
    const { subject, description, fromEmail, fromName, status, priority, htmlContent, attachments, dueDate, reminderDate, queueId } = body

    // Validate required fields
    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      )
    }

    // Sanitize and validate inputs
    const sanitizedSubject = subject.toString().trim().substring(0, 255)
    const sanitizedDescription = description.toString().trim().substring(0, 10000)
    const sanitizedFromEmail = fromEmail ? fromEmail.toString().trim().substring(0, 255) : 'internal@support.com'
    const sanitizedFromName = fromName ? fromName.toString().trim().substring(0, 255) : 'Internal Support'
    const sanitizedStatus = status ? status.toString().trim().substring(0, 50) : 'Open'
    const sanitizedPriority = priority ? priority.toString().trim().substring(0, 50) : 'Medium'
    
    // Validate email format if provided
    if (fromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedFromEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (sanitizedSubject.length === 0 || sanitizedDescription.length === 0) {
      return NextResponse.json(
        { error: 'Subject and description cannot be empty' },
        { status: 400 }
      )
    }

    // If no queue specified, try to get default queue
    let finalQueueId = queueId
    if (!finalQueueId) {
      const defaultQueue = await prisma.queue.findFirst({
        where: { isDefault: true }
      })
      finalQueueId = defaultQueue?.id || null
    }

    // Generate unique ticket number
    const generatedTicketNumber = await generateTicketNumber()
    const uniqueTicketNumber = await ensureUniqueTicketNumber(generatedTicketNumber)

    // Create ticket in database
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: uniqueTicketNumber,
        subject: sanitizedSubject,
        description: sanitizedDescription,
        htmlContent: htmlContent || null,
        fromEmail: sanitizedFromEmail,
        fromName: sanitizedFromName,
        status: sanitizedStatus,
        priority: sanitizedPriority,
        queueId: finalQueueId,
        dueDate: normalizeDateToMidnight(dueDate),
        reminderDate: reminderDate ? new Date(reminderDate) : null,
      },
    })

    // Create attachments if provided
    if (attachments && attachments.length > 0) {
      await prisma.ticketAttachment.createMany({
        data: attachments.map((attachment: { filename: string; filepath: string; mimetype: string; size: number }) => ({
          filename: attachment.filename,
          filepath: attachment.filepath,
          mimetype: attachment.mimetype,
          size: attachment.size,
          ticketId: ticket.id,
        })),
      })
    }

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}
