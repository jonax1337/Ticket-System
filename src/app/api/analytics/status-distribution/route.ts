import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface StatusDistributionData {
  status: string
  count: number
  percentage: number
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queueId = searchParams.get('queueId') || undefined

    // Get user's accessible queues for non-admin users
    let userQueueIds: string[] = []
    if (session.user.role !== 'ADMIN') {
      const userQueues = await prisma.userQueue.findMany({
        where: { userId: session.user.id },
        select: { queueId: true }
      })
      const assignedQueueIds = userQueues.map(uq => uq.queueId)
      
      const defaultQueues = await prisma.queue.findMany({
        where: { isDefault: true },
        select: { id: true }
      })
      const defaultQueueIds = defaultQueues.map(q => q.id)
      
      userQueueIds = [...new Set([...assignedQueueIds, ...defaultQueueIds])]
      
      if (userQueueIds.length === 0) {
        return NextResponse.json([])
      }
    }

    // Build where clause for tickets
    const whereClause = {
      ...(queueId && { queueId }),
      ...(session.user.role !== 'ADMIN' && {
        queueId: { in: userQueueIds }
      }),
    }

    // Get status distribution
    const statusGroups = await prisma.ticket.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true,
      },
    })

    const totalCount = statusGroups.reduce((sum, group) => sum + group._count.id, 0)

    const data: StatusDistributionData[] = statusGroups.map(group => ({
      status: group.status,
      count: group._count.id,
      percentage: totalCount > 0 ? Math.round((group._count.id / totalCount) * 100) : 0,
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching status distribution data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status distribution data' },
      { status: 500 }
    )
  }
}