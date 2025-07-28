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

    const queues = await prisma.queue.findMany({
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            tickets: true,
            userQueues: true
          }
        }
      }
    })

    return NextResponse.json(queues)
  } catch (error) {
    console.error('Failed to fetch queues:', error)
    return NextResponse.json({ error: 'Failed to fetch queues' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    const queue = await prisma.queue.create({
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
    console.error('Failed to create queue:', error)
    return NextResponse.json({ error: 'Failed to create queue' }, { status: 500 })
  }
}