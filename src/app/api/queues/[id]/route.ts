import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const queue = await prisma.queue.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tickets: true,
            userQueues: true
          }
        }
      }
    })

    if (!queue) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 })
    }

    return NextResponse.json(queue)
  } catch (error) {
    console.error('Failed to fetch queue:', error)
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, color, icon, isDefault, order } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // If this is being set as default, remove default from others
    if (isDefault) {
      await prisma.queue.updateMany({
        where: { 
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    const queue = await prisma.queue.update({
      where: { id },
      data: {
        name,
        description: description || null,
        color: color || '#2563eb',
        icon: icon || 'Inbox',
        isDefault: isDefault || false,
        order: order || 0
      }
    })

    return NextResponse.json(queue)
  } catch (error) {
    console.error('Failed to update queue:', error)
    return NextResponse.json({ error: 'Failed to update queue' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if queue has tickets
    const ticketCount = await prisma.ticket.count({
      where: { queueId: id }
    })

    if (ticketCount > 0) {
      // Find default queue to move tickets to
      const defaultQueue = await prisma.queue.findFirst({
        where: { isDefault: true }
      })
  
      // Move tickets to default queue or set to null
      await prisma.ticket.updateMany({
        where: { queueId: id },
        data: { queueId: defaultQueue?.id || null }
      })
    }

    await prisma.queue.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete queue:', error)
    return NextResponse.json({ error: 'Failed to delete queue' }, { status: 500 })
  }
}