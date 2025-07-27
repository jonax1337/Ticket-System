import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ticketAutomationManager } from '@/lib/automation-service'

// Reload automation configuration
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await ticketAutomationManager.reloadConfig()
    
    return NextResponse.json({
      success: true,
      message: 'Automation configuration reloaded successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error reloading automation config:', error)
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