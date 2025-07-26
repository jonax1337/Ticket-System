import { prisma } from './prisma'

export type NotificationType = 'ticket_assigned' | 'ticket_unassigned' | 'comment_added'

interface CreateNotificationParams {
  type: NotificationType
  title: string
  message: string
  userId: string
  actorId: string
  ticketId?: string
  commentId?: string
}

/**
 * Create a new notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  // Don't create notification if user is acting on themselves
  if (params.userId === params.actorId) {
    return null
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message,
        userId: params.userId,
        actorId: params.actorId,
        ticketId: params.ticketId,
        commentId: params.commentId,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
          },
        },
      },
    })

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

/**
 * Create notification when a ticket is assigned to a user
 */
export async function createTicketAssignedNotification(
  ticketId: string,
  assignedUserId: string,
  actorId: string,
  ticketNumber?: string,
  ticketSubject?: string
) {
  const displayTicketNumber = ticketNumber || `#${ticketId.slice(-6).toUpperCase()}`
  
  return createNotification({
    type: 'ticket_assigned',
    title: 'Ticket Assigned',
    message: `You have been assigned to ticket ${displayTicketNumber}: ${ticketSubject || 'Untitled'}`,
    userId: assignedUserId,
    actorId,
    ticketId,
  })
}

/**
 * Create notification when a ticket is unassigned from a user
 */
export async function createTicketUnassignedNotification(
  ticketId: string,
  previousUserId: string,
  actorId: string,
  ticketNumber?: string,
  ticketSubject?: string,
  newAssigneeId?: string
) {
  const displayTicketNumber = ticketNumber || `#${ticketId.slice(-6).toUpperCase()}`
  
  let message = `Ticket ${displayTicketNumber} has been unassigned from you`
  
  if (newAssigneeId) {
    // Get new assignee name
    const newAssignee = await prisma.user.findUnique({
      where: { id: newAssigneeId },
      select: { name: true },
    })
    
    if (newAssignee) {
      message = `Ticket ${displayTicketNumber} has been reassigned from you to ${newAssignee.name}`
    }
  }
  
  return createNotification({
    type: 'ticket_unassigned',
    title: 'Ticket Unassigned',
    message,
    userId: previousUserId,
    actorId,
    ticketId,
  })
}

/**
 * Create notification when a comment is added to an assigned ticket
 */
export async function createCommentNotification(
  commentId: string,
  ticketId: string,
  assignedUserId: string,
  actorId: string,
  ticketNumber?: string,
  ticketSubject?: string
) {
  const displayTicketNumber = ticketNumber || `#${ticketId.slice(-6).toUpperCase()}`
  
  return createNotification({
    type: 'comment_added',
    title: 'New Comment',
    message: `A new comment was added to your ticket ${displayTicketNumber}: ${ticketSubject || 'Untitled'}`,
    userId: assignedUserId,
    actorId,
    ticketId,
    commentId,
  })
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean
    limit?: number
    offset?: number
  } = {}
) {
  const { unreadOnly = false, limit = 50, offset = 0 } = options

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    return notifications
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })

    return count
  } catch (error) {
    console.error('Error fetching unread notification count:', error)
    return 0
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user can only mark their own notifications as read
      },
      data: {
        isRead: true,
      },
    })

    return notification.count > 0
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return result.count
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return 0
  }
}

/**
 * Delete old read notifications (cleanup function)
 */
export async function cleanupOldNotifications(daysOld: number = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  try {
    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
    })

    return result.count
  } catch (error) {
    console.error('Error cleaning up old notifications:', error)
    return 0
  }
}
