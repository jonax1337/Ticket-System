import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's queue assignments
    const userQueues = await prisma.userQueue.findMany({
      where: { userId: session.user.id },
      include: {
        queue: true
      },
      orderBy: {
        queue: {
          order: 'asc'
        }
      }
    })

    return NextResponse.json(userQueues)
  } catch (error) {
    console.error('Failed to fetch user queues:', error)
    return NextResponse.json({ error: 'Failed to fetch user queues' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { queueId, userId } = await request.json()

    // Only admins can assign queues to other users
    const targetUserId = userId || session.user.id
    if (targetUserId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!queueId) {
      return NextResponse.json({ error: 'Queue ID is required' }, { status: 400 })
    }

    // Check if queue exists
    const queue = await prisma.queue.findUnique({
      where: { id: queueId }
    })

    if (!queue) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 })
    }

    // Create user-queue assignment (upsert to handle duplicates)
    const userQueue = await prisma.userQueue.upsert({
      where: {
        userId_queueId: {
          userId: targetUserId,
          queueId: queueId
        }
      },
      update: {},
      create: {
        userId: targetUserId,
        queueId: queueId
      },
      include: {
        queue: true
      }
    })

    return NextResponse.json(userQueue)
  } catch (error) {
    console.error('Failed to assign queue:', error)
    return NextResponse.json({ error: 'Failed to assign queue' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queueId = searchParams.get('queueId')
    const userId = searchParams.get('userId')

    // Only admins can remove queue assignments from other users
    const targetUserId = userId || session.user.id
    if (targetUserId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!queueId) {
      return NextResponse.json({ error: 'Queue ID is required' }, { status: 400 })
    }

    await prisma.userQueue.delete({
      where: {
        userId_queueId: {
          userId: targetUserId,
          queueId: queueId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove queue assignment:', error)
    return NextResponse.json({ error: 'Failed to remove queue assignment' }, { status: 500 })
  }
}