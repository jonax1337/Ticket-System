import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ticketAutomationManager } from '@/lib/automation-service'

// This endpoint can be called by external cron services or for manual triggers
export async function GET(request: NextRequest) {
  try {
    // Check for cron secret authorization OR admin session
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // First, try cron secret authorization (for external cron jobs)
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Authorized via cron secret - proceed
    } else {
      // If not authorized via cron secret, check for admin session (for manual test runs)
      const session = await getServerSession(authOptions)
      
      if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
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