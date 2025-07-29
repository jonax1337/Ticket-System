import { broadcastNotificationToUser, broadcastUnreadCountToUser } from '@/lib/sse-connections'
import { getUnreadNotificationCount } from './notification-service'

/**
 * Broadcast a new notification to the user in real-time
 */
export async function broadcastNewNotification(userId: string, notification: Record<string, unknown>) {
  try {
    console.log(`[NOTIFICATION DEBUG] Broadcasting new notification to user ${userId}:`, {
      notificationId: notification.id,
      type: notification.type,
      title: notification.title
    })
    
    // Broadcast the notification
    broadcastNotificationToUser(userId, notification)
    
    // Also broadcast updated unread count
    const unreadCount = await getUnreadNotificationCount(userId)
    console.log(`[NOTIFICATION DEBUG] Broadcasting unread count ${unreadCount} to user ${userId}`)
    broadcastUnreadCountToUser(userId, unreadCount)
  } catch (error) {
    console.error('[NOTIFICATION DEBUG] Error broadcasting notification:', error)
  }
}

/**
 * Broadcast updated unread count to the user
 */
export async function broadcastUnreadCount(userId: string) {
  try {
    const unreadCount = await getUnreadNotificationCount(userId)
    broadcastUnreadCountToUser(userId, unreadCount)
  } catch (error) {
    console.error('Error broadcasting unread count:', error)
  }
}

/**
 * Real-time notification types for the frontend
 */
export interface RealtimeNotificationEvent {
  type: 'connected' | 'heartbeat' | 'notification' | 'unread_count'
  data?: Record<string, unknown>
  timestamp: string
}