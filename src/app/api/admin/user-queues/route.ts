import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userQueues = await prisma.userQueue.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        queue: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        }
      },
      orderBy: [
        { user: { name: 'asc' } },
        { queue: { order: 'asc' } }
      ]
    })

    return NextResponse.json(userQueues)
  } catch (error) {
    console.error('Failed to fetch user-queue assignments:', error)
    return NextResponse.json({ error: 'Failed to fetch user-queue assignments' }, { status: 500 })
  }
}