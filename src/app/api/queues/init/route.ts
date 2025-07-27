import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if queues already exist
    const existingQueues = await prisma.queue.count()
    if (existingQueues > 0) {
      return NextResponse.json({ message: 'Queues already initialized' })
    }

    // Create default queues
    const defaultQueues = [
      {
        name: 'General Support',
        description: 'General customer support requests',
        color: '#2563eb',
        icon: 'Inbox',
        isDefault: true,
        order: 1
      },
      {
        name: 'Technical Issues',
        description: 'Technical problems and bug reports',
        color: '#dc2626',
        icon: 'AlertTriangle',
        isDefault: false,
        order: 2
      },
      {
        name: 'Billing',
        description: 'Billing and payment related inquiries',
        color: '#059669',
        icon: 'Folder',
        isDefault: false,
        order: 3
      }
    ]

    const createdQueues = await Promise.all(
      defaultQueues.map(queue => 
        prisma.queue.create({ data: queue })
      )
    )

    return NextResponse.json({ 
      message: 'Queues initialized successfully',
      queues: createdQueues
    })
  } catch (error) {
    console.error('Failed to initialize queues:', error)
    return NextResponse.json({ error: 'Failed to initialize queues' }, { status: 500 })
  }
}