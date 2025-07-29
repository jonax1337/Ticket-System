/**
 * Test script to verify real-time notification functionality
 * This creates test notifications and verifies they are broadcast via SSE
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createNotification, NotificationType } from '@/lib/notification-service'
import { getActiveConnectionCount } from '@/lib/sse-connections'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await request.json()

    // Create a test notification
    const notification = await createNotification({
      type: 'comment_added' as NotificationType, // Use a valid notification type
      title: 'Test Notification',
      message: message || 'This is a test notification to verify real-time updates',
      userId: session.user.id,
      actorId: session.user.id,
    })

    const activeConnections = getActiveConnectionCount()

    return NextResponse.json({ 
      success: true, 
      notification,
      activeConnections,
      message: `Test notification created and broadcast to ${activeConnections} active connections`
    })
  } catch (error) {
    console.error('Error creating test notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeConnections = getActiveConnectionCount()

    return NextResponse.json({ 
      activeConnections,
      userId: session.user.id,
      message: `There are currently ${activeConnections} active SSE connections`
    })
  } catch (error) {
    console.error('Error getting connection status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}