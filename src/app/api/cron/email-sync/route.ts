import { NextRequest, NextResponse } from 'next/server'
import { syncAllActiveEmailAccounts } from '@/lib/email-service'

// This endpoint can be called by external cron services like Vercel Cron or external cron jobs
export async function GET(request: NextRequest) {
  try {
    // Optional: Add a simple authentication check
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting scheduled email sync...')
    await syncAllActiveEmailAccounts()
    console.log('Scheduled email sync completed')

    return NextResponse.json({ 
      success: true, 
      message: 'Email sync completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron email sync failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Also support POST for webhook-style cron services
export async function POST(request: NextRequest) {
  return GET(request)
}