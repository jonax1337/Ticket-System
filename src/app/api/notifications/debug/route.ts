import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getConnectionsDebugInfo } from '@/lib/sse-connections'

// GET - Debug SSE connections (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const debugInfo = getConnectionsDebugInfo()
    
    return NextResponse.json({
      ...debugInfo,
      serverTime: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching SSE debug info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}