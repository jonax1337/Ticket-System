import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/tickets/[id]/watchers/[userId] - Remove a watcher from a ticket
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, userId } = await context.params

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { 
        id: true,
        subject: true,
        ticketNumber: true
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if the watcher exists
    const watcher = await prisma.ticketWatcher.findUnique({
      where: {
        ticketId_userId: {
          ticketId: id,
          userId: userId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!watcher) {
      return NextResponse.json({ error: 'Watcher not found' }, { status: 404 })
    }

    // Only allow users to remove themselves, or admins to remove anyone
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Remove the watcher
    await prisma.ticketWatcher.delete({
      where: {
        ticketId_userId: {
          ticketId: id,
          userId: userId
        }
      }
    })

    // Create notification if someone else removed the watcher
    if (session.user.id !== userId) {
      try {
        await prisma.notification.create({
          data: {
            type: 'watcher_removed',
            title: 'Removed from watching ticket',
            message: `You have been removed from watching ticket ${ticket.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`}: ${ticket.subject}`,
            ticketId: id,
            userId: userId,
            actorId: session.user.id
          }
        })
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError)
        // Continue even if notification fails
      }
    }

    return NextResponse.json({ message: 'Watcher removed successfully' })
  } catch (error) {
    console.error('Error removing watcher:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}