/**
 * Server-Side Events (SSE) service for real-time notifications
 * This module provides functions to broadcast notification events to connected clients
 */

import { broadcastToUser } from './sse-connections'

interface NotificationEvent {
  type: 'notification_created' | 'notification_read' | 'unread_count_changed'
  userId: string
  data: object
  timestamp: string
}

/**
 * Broadcast a notification event to a specific user
 * This function is called when notifications are created or updated
 */
export async function broadcastNotificationEvent(event: NotificationEvent) {
  try {
    broadcastToUser(event.userId, {
      type: event.type,
      data: event.data,
      timestamp: event.timestamp
    })
  } catch (error) {
    console.error('Error broadcasting notification event:', error)
    // Don't throw - broadcasting is optional and shouldn't break main functionality
  }
}

/**
 * Broadcast when a new notification is created
 */
export async function broadcastNotificationCreated(userId: string, notification: object) {
  await broadcastNotificationEvent({
    type: 'notification_created',
    userId,
    data: { notification },
    timestamp: new Date().toISOString()
  })
}

/**
 * Broadcast when a notification is marked as read
 */
export async function broadcastNotificationRead(userId: string, notificationId: string) {
  await broadcastNotificationEvent({
    type: 'notification_read',
    userId,
    data: { notificationId },
    timestamp: new Date().toISOString()
  })
}

/**
 * Broadcast when unread count changes
 */
export async function broadcastUnreadCountChanged(userId: string, unreadCount: number) {
  await broadcastNotificationEvent({
    type: 'unread_count_changed',
    userId,
    data: { unreadCount },
    timestamp: new Date().toISOString()
  })
}