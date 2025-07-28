import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { startOfDay, endOfDay, subDays, subMonths, format, eachDayOfInterval, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns'

interface TicketVolumeData {
  date: string
  created: number
  closed: number
}

interface QueryParams {
  timeRange?: string
  queueId?: string
  customStart?: string
  customEnd?: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'
    const queueId = searchParams.get('queueId') || undefined
    const customStart = searchParams.get('customStart')
    const customEnd = searchParams.get('customEnd')

    // Calculate date range
    let startDate: Date
    let endDate: Date = new Date()
    let intervalType: 'day' | 'month' = 'day'

    if (timeRange === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart)
      endDate = new Date(customEnd)
    } else {
      switch (timeRange) {
        case '7d':
          startDate = subDays(endDate, 6)
          break
        case '30d':
          startDate = subDays(endDate, 29)
          break
        case '3m':
          startDate = subMonths(endDate, 3)
          intervalType = 'month'
          break
        case '6m':
          startDate = subMonths(endDate, 6)
          intervalType = 'month'
          break
        case '1y':
          startDate = subMonths(endDate, 12)
          intervalType = 'month'
          break
        default:
          startDate = subDays(endDate, 6)
      }
    }

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

    // Get created tickets data
    const createdTickets = await prisma.ticket.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      select: {
        createdAt: true,
      },
    })

    // Get closed tickets data (tickets with status 'CLOSED' and updatedAt in range)
    const closedTickets = await prisma.ticket.findMany({
      where: {
        ...whereClause,
        status: 'CLOSED',
        updatedAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      select: {
        updatedAt: true,
      },
    })

    // Generate date intervals
    const intervals = intervalType === 'day' 
      ? eachDayOfInterval({ start: startDate, end: endDate })
      : eachMonthOfInterval({ start: startOfMonth(startDate), end: endOfMonth(endDate) })

    // Aggregate data by intervals
    const data: TicketVolumeData[] = intervals.map(date => {
      const dateStr = intervalType === 'day' 
        ? format(date, 'yyyy-MM-dd')
        : format(date, 'yyyy-MM')

      const created = createdTickets.filter(ticket => {
        const ticketDate = intervalType === 'day'
          ? format(ticket.createdAt, 'yyyy-MM-dd')
          : format(ticket.createdAt, 'yyyy-MM')
        return ticketDate === dateStr
      }).length

      const closed = closedTickets.filter(ticket => {
        const ticketDate = intervalType === 'day'
          ? format(ticket.updatedAt, 'yyyy-MM-dd')
          : format(ticket.updatedAt, 'yyyy-MM')
        return ticketDate === dateStr
      }).length

      return {
        date: intervalType === 'day' 
          ? format(date, 'MMM dd')
          : format(date, 'MMM yyyy'),
        created,
        closed,
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching ticket volume data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket volume data' },
      { status: 500 }
    )
  }
}