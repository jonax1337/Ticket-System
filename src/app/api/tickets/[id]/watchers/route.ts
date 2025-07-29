import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/tickets/[id]/watchers - Get all watchers for a ticket
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Verify ticket exists and user has access
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get all watchers for the ticket
    const watchers = await prisma.ticketWatcher.findMany({
      where: { ticketId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(watchers)
  } catch (error) {
    console.error('Error fetching watchers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/tickets/[id]/watchers - Add current user as watcher
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if user is already watching
    const existingWatcher = await prisma.ticketWatcher.findUnique({
      where: {
        ticketId_userId: {
          ticketId: id,
          userId: session.user.id
        }
      }
    })

    if (existingWatcher) {
      return NextResponse.json({ error: 'Already watching this ticket' }, { status: 400 })
    }

    // Add user as watcher
    const watcher = await prisma.ticketWatcher.create({
      data: {
        ticketId: id,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json(watcher, { status: 201 })
  } catch (error) {
    console.error('Error adding watcher:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}