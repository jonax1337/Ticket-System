import { NextRequest, NextResponse } from 'next/server'
import { checkTicketDueDates } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
  try {
    // Optional: Check for authorization header for external cron jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await checkTicketDueDates()
    
    return NextResponse.json({
      success: true,
      message: `Due date check completed. Created ${result.dueSoonCount} due soon notifications and ${result.overdueCount} overdue notifications.`,
      ...result,
    })
  } catch (error) {
    console.error('Error in due date check cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}