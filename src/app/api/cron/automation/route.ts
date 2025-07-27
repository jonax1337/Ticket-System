import { NextRequest, NextResponse } from 'next/server'
import { ticketAutomationManager } from '@/lib/automation-service'

// This endpoint can be called by external cron services or for manual triggers
export async function GET(request: NextRequest) {
  try {
    // Optional: Add a simple authentication check
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting ticket automation processing...')
    await ticketAutomationManager.triggerProcessing()
    console.log('Ticket automation processing completed')

    return NextResponse.json({ 
      success: true, 
      message: 'Ticket automation processing completed',
      timestamp: new Date().toISOString(),
      status: ticketAutomationManager.getStatus()
    })
  } catch (error) {
    console.error('Ticket automation processing failed:', error)
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