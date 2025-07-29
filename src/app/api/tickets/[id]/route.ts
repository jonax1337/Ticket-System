import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTemplatedEmail } from '@/lib/email-service'
import { normalizeDateToMidnight } from '@/lib/date-utils'
import { createTicketAssignedNotification, createTicketUnassignedNotification } from '@/lib/notification-service'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { status, priority, assignedToId, fromName, fromEmail, dueDate, reminderDate, queueId, subject, description, attachments } = await request.json()

    const updateData: Record<string, unknown> = {}
    
    if (status) {
      updateData.status = status
    }
    
    if (priority) {
      updateData.priority = priority
    }
    
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId
    }
    
    if (fromName !== undefined) {
      updateData.fromName = fromName
    }
    
    if (fromEmail !== undefined) {
      updateData.fromEmail = fromEmail
    }
    
    if (dueDate !== undefined) {
      updateData.dueDate = normalizeDateToMidnight(dueDate)
    }
    
    if (reminderDate !== undefined) {
      updateData.reminderDate = reminderDate ? new Date(reminderDate) : null
    }

    if (queueId !== undefined) {
      updateData.queueId = queueId
    }

    if (subject !== undefined) {
      updateData.subject = subject
    }

    if (description !== undefined) {
      updateData.description = description
    }

    if (Object.keys(updateData).length === 0 && !attachments) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const params = await context.params

    // Get current ticket state before update to check for assignment changes
    const currentTicket = await prisma.ticket.findUnique({
      where: { id: params.id },
      select: {
        assignedToId: true,
        ticketNumber: true,
        subject: true,
        status: true,
        priority: true,
        fromEmail: true,
        fromName: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!currentTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Update ticket if there are fields to update
    let ticket
    if (Object.keys(updateData).length > 0) {
      ticket = await prisma.ticket.update({
        where: { id: params.id },
        data: updateData,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          queue: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
          attachments: true,
          participants: {
            orderBy: [
              { type: 'asc' },
              { createdAt: 'asc' }
            ]
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              attachments: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })
    } else {
      // If no fields to update but we have attachments, get the current ticket
      ticket = await prisma.ticket.findUnique({
        where: { id: params.id },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          queue: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
          attachments: true,
          participants: {
            orderBy: [
              { type: 'asc' },
              { createdAt: 'asc' }
            ]
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              attachments: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })
    }

    // Handle attachments if provided
    if (attachments && Array.isArray(attachments)) {
      try {
        // Validate attachment data before creating records
        const validAttachments = attachments.filter(attachment => 
          attachment && 
          typeof attachment.filename === 'string' && 
          typeof attachment.filepath === 'string' && 
          typeof attachment.mimetype === 'string' && 
          typeof attachment.size === 'number' &&
          attachment.filename.trim() !== '' &&
          attachment.filepath.trim() !== '' &&
          attachment.size > 0
        )
    
        if (validAttachments.length > 0) {
          const attachmentPromises = validAttachments.map((attachment) =>
            prisma.ticketAttachment.create({
              data: {
                filename: attachment.filename,
                filepath: attachment.filepath,
                mimetype: attachment.mimetype,
                size: attachment.size,
                ticketId: params.id,
              },
            })
          )
      
          await Promise.all(attachmentPromises)
        }
      } catch (attachmentError) {
        console.error('Error creating attachments:', attachmentError)
        // Don't fail the main request if attachments fail
      }
    }

    // Handle assignment notifications
    if (assignedToId !== undefined) {
      const previousAssigneeId = currentTicket.assignedToId
      const newAssigneeId = assignedToId || null

      // If assignment changed
      if (previousAssigneeId !== newAssigneeId) {
        try {
          // Notify previous assignee that ticket was unassigned
          if (previousAssigneeId && previousAssigneeId !== session.user.id) {
            await createTicketUnassignedNotification(
              params.id,
              previousAssigneeId,
              session.user.id,
              currentTicket.ticketNumber || undefined,
              currentTicket.subject,
              newAssigneeId || undefined
            )
          }

          // Notify new assignee that ticket was assigned
          if (newAssigneeId && newAssigneeId !== session.user.id) {
            await createTicketAssignedNotification(
              params.id,
              newAssigneeId,
              session.user.id,
              currentTicket.ticketNumber || undefined,
              currentTicket.subject
            )
          }
        } catch (notificationError) {
          console.error('Error creating notifications:', notificationError)
          // Don't fail the main request if notifications fail
        }
      }
    }

    // Handle status change notifications
    if (status && status !== currentTicket.status) {
      try {
        // Send status change notification to customer using template
        await sendTemplatedEmail({
          templateType: 'status_changed',
          to: currentTicket.fromEmail,
          toName: currentTicket.fromName || undefined,
          ticketId: params.id,
          variables: {
            previousStatus: currentTicket.status,
            newStatus: status,
            actorName: session.user.name,
            actorEmail: session.user.email,
            statusChangeReason: undefined // Could be added to request body in future
          }
        })
        console.log(`Status change notification sent for ticket ${currentTicket.ticketNumber}`)
      } catch (emailError) {
        console.error('Error sending status change notification:', emailError)
        // Don't fail the main request if email sending fails
      }
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Ticket update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const params = await context.params

    // Check if ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: params.id }
    })

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Delete related comments first (cascade delete)
    await prisma.comment.deleteMany({
      where: { ticketId: params.id }
    })

    // Delete the ticket
    await prisma.ticket.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ticket delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}