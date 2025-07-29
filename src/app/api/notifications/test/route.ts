import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createNotification } from '@/lib/notification-service'

// POST - Create a test notification for debugging (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetUserId } = body
    
    // Use current user if no target specified
    const userId = targetUserId || session.user.id

    console.log(`[TEST DEBUG] Creating test notification for user ${userId}`)

    const notification = await createNotification({
      type: 'ticket_assigned',
      title: 'Test Notification',
      message: `This is a test notification created at ${new Date().toLocaleString()}`,
      userId,
      actorId: session.user.id,
    })

    if (notification) {
      console.log(`[TEST DEBUG] Test notification created successfully:`, notification.id)
      return NextResponse.json({ 
        success: true, 
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          userId: notification.userId
        }
      })
    } else {
      console.log(`[TEST DEBUG] Failed to create test notification`)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }
  } catch (error) {
    console.error('[TEST DEBUG] Error creating test notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}