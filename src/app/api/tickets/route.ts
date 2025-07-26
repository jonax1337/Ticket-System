import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateTicketNumber, ensureUniqueTicketNumber } from '@/lib/ticket-number-generator'

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()
    const { subject, description, fromEmail, fromName, priority, htmlContent, attachments } = body

    // Validate required fields
    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      )
    }

    // Generate unique ticket number
    const generatedTicketNumber = await generateTicketNumber()
    const uniqueTicketNumber = await ensureUniqueTicketNumber(generatedTicketNumber)

    // Create ticket in database
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: uniqueTicketNumber,
        subject,
        description,
        htmlContent: htmlContent || null,
        fromEmail: fromEmail || 'internal@support.com',
        fromName: fromName || 'Internal Support',
        priority: priority || 'Medium',
        status: 'Open',
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
