import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { startOfDay, endOfDay, subDays, subMonths, format, eachDayOfInterval, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns'

interface TicketVolumeData {
  date: string
  [key: string]: number | string // Dynamic status keys
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
    const statusesParam = searchParams.get('statuses') || 'Open,Closed' // Default to Open vs Closed
    const selectedStatuses = statusesParam.split(',').map(s => s.trim())

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

    // Build where clause for tickets - no queue access control for analytics
    // Analytics should show data from all tickets regardless of queue permissions
    const baseWhereClause = {
      ...(queueId && { queueId }),
    }

    // Generate date intervals
    const intervals = intervalType === 'day' 
      ? eachDayOfInterval({ start: startDate, end: endDate })
      : eachMonthOfInterval({ start: startOfMonth(startDate), end: endOfMonth(endDate) })

    // Get tickets data for each status
    const statusData: { [status: string]: Array<{createdAt?: Date, updatedAt?: Date}> } = {}
    
    const statusQueries = selectedStatuses.map(async (status) => {
      if (status.toLowerCase() === 'created') {
        // Special case for "created" - count by creation date
        const data = await prisma.ticket.findMany({
          where: {
            ...baseWhereClause,
            createdAt: {
              gte: startOfDay(startDate),
              lte: endOfDay(endDate),
            },
          },
          select: {
            createdAt: true,
          },
        })
        return { status, data }
      } else {
        // For status-based counts - count by when ticket was last updated to that status
        const data = await prisma.ticket.findMany({
          where: {
            ...baseWhereClause,
            status: status,
            updatedAt: {
              gte: startOfDay(startDate),
              lte: endOfDay(endDate),
            },
          },
          select: {
            updatedAt: true,
          },
        })
        return { status, data }
      }
    })

    const results = await Promise.all(statusQueries)
    results.forEach(({ status, data }) => {
      statusData[status] = data
    })

    // Aggregate data by intervals
    const data: TicketVolumeData[] = intervals.map(date => {
      const dateStr = intervalType === 'day' 
        ? format(date, 'yyyy-MM-dd')
        : format(date, 'yyyy-MM')

      const result: TicketVolumeData = {
        date: intervalType === 'day' 
          ? format(date, 'MMM dd')
          : format(date, 'MMM yyyy'),
      }

      // Count tickets for each status
      for (const status of selectedStatuses) {
        const tickets = statusData[status] || []
        const count = tickets.filter(ticket => {
          const ticketDate = status.toLowerCase() === 'created' && ticket.createdAt
            ? (intervalType === 'day'
                ? format(ticket.createdAt, 'yyyy-MM-dd')
                : format(ticket.createdAt, 'yyyy-MM'))
            : ticket.updatedAt
            ? (intervalType === 'day'
                ? format(ticket.updatedAt, 'yyyy-MM-dd')
                : format(ticket.updatedAt, 'yyyy-MM'))
            : null
          return ticketDate === dateStr
        }).length
        
        result[status.toLowerCase()] = Math.max(0, count) // Ensure non-negative values
      }

      return result
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