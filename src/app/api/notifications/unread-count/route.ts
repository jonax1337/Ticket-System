import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUnreadNotificationCount } from '@/lib/notification-service'

// GET - Get unread notification count
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('Unread count API: No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Unread count API: Getting count for user:', session.user.id)
    const count = await getUnreadNotificationCount(session.user.id)

    console.log('Unread count API: Returning count:', count)
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error in unread count API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
