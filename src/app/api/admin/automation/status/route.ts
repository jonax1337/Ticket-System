import { NextResponse } from 'next/server'
import { ticketAutomationManager } from '@/lib/automation-service'

// Get automation service status
export async function GET() {
  try {
    const status = ticketAutomationManager.getStatus()
    
    return NextResponse.json({
      success: true,
      automation: status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting automation status:', error)
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