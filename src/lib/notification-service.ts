import { prisma } from './prisma'

export type NotificationType = 'ticket_assigned' | 'ticket_unassigned' | 'comment_added' | 'mentioned_in_comment' | 'ticket_due_soon' | 'ticket_overdue' | 'ticket_auto_close_warning' | 'ticket_auto_closed'

interface CreateNotificationParams {
  type: NotificationType
  title: string
  message: string
  userId: string
  actorId?: string // Made optional for system notifications
  ticketId?: string
  commentId?: string
}

/**
 * Create a new notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  // Don't create notification if user is acting on themselves (skip for system notifications)
  if (params.actorId && params.userId === params.actorId) {
    return null
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message,
        userId: params.userId,
        actorId: params.actorId || null, // Allow null for system notifications
        ticketId: params.ticketId,
        commentId: params.commentId,
      },
      include: {
        actor: params.actorId ? {
          select: {
            id: true,
            name: true,
            email: true,
          },
        } : false,
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
 * Create notification when a user is mentioned in a comment
 */
export async function createMentionNotification(
  commentId: string,
  ticketId: string,
  mentionedUserId: string,
  actorId: string,
  ticketNumber?: string,
  ticketSubject?: string
) {
  const displayTicketNumber = ticketNumber || `#${ticketId.slice(-6).toUpperCase()}`
  
  return createNotification({
    type: 'mentioned_in_comment',
    title: 'You were mentioned',
    message: `You were mentioned in a comment on ticket ${displayTicketNumber}: ${ticketSubject || 'Untitled'}`,
    userId: mentionedUserId,
    actorId,
    ticketId,
    commentId,
  })
}

/**
 * Create notification when a ticket is due soon
 */
export async function createTicketDueSoonNotification(
  ticketId: string,
  assignedUserId: string,
  dueDate: Date,
  ticketNumber?: string,
  ticketSubject?: string
) {
  const displayTicketNumber = ticketNumber || `#${ticketId.slice(-6).toUpperCase()}`
  const dueDateStr = dueDate.toLocaleDateString()
  
  return createNotification({
    type: 'ticket_due_soon',
    title: 'Ticket Due Soon',
    message: `Ticket ${displayTicketNumber} is due on ${dueDateStr}: ${ticketSubject || 'Untitled'}`,
    userId: assignedUserId,
    actorId: assignedUserId, // System notification, use same user as actor
    ticketId,
  })
}

/**
 * Create notification when a ticket is overdue
 */
export async function createTicketOverdueNotification(
  ticketId: string,
  assignedUserId: string,
  dueDate: Date,
  ticketNumber?: string,
  ticketSubject?: string
) {
  const displayTicketNumber = ticketNumber || `#${ticketId.slice(-6).toUpperCase()}`
  const dueDateStr = dueDate.toLocaleDateString()
  
  return createNotification({
    type: 'ticket_overdue',
    title: 'Ticket Overdue',
    message: `Ticket ${displayTicketNumber} was due on ${dueDateStr} and is now overdue: ${ticketSubject || 'Untitled'}`,
    userId: assignedUserId,
    actorId: assignedUserId, // System notification, use same user as actor
    ticketId,
  })
}

/**
 * Parse @ mentions from comment content and return user IDs
 */
export async function parseMentionsFromComment(content: string): Promise<string[]> {
  // Find all @mentions in the format @[Username](userId) 
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
  const userIds: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    const userId = match[2] // Extract user ID from @[Username](userId)
    if (userId && !userIds.includes(userId)) {
      userIds.push(userId)
    }
  }

  // Also support legacy @username format for backwards compatibility
  const legacyMentionRegex = /@(?!"?\[)(\w+)/g
  const legacyMentions: string[] = []
  
  while ((match = legacyMentionRegex.exec(content)) !== null) {
    const mentionedName = match[1]
    legacyMentions.push(mentionedName)
  }

  // Find users by name for legacy mentions
  if (legacyMentions.length > 0) {
    try {
      const users = await prisma.user.findMany({
        where: {
          OR: legacyMentions.map(name => ({
            name: {
              equals: name,
              mode: 'insensitive' as const,
            },
          })),
        },
        select: {
          id: true,
          name: true,
        },
      })

      for (const user of users) {
        if (!userIds.includes(user.id)) {
          userIds.push(user.id)
        }
      }
    } catch (error) {
      console.error('Error finding mentioned users:', error)
    }
  }

  return userIds
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
 * Create notification when a ticket will be auto-closed soon
 */
export async function createAutoCloseWarningNotification(
  ticketId: string,
  assignedUserId: string,
  daysUntilClose: number,
  ticketNumber?: string,
  ticketSubject?: string
) {
  const displayTicketNumber = ticketNumber || `#${ticketId.slice(-6).toUpperCase()}`
  
  return createNotification({
    type: 'ticket_auto_close_warning',
    title: 'Ticket Auto-Close Warning',
    message: `Ticket ${displayTicketNumber} will be automatically closed in ${daysUntilClose} days due to inactivity: ${ticketSubject || 'Untitled'}`,
    userId: assignedUserId,
    ticketId,
  })
}

/**
 * Create notification when a ticket has been auto-closed
 */
export async function createAutoClosedNotification(
  ticketId: string,
  assignedUserId: string,
  ticketNumber?: string,
  ticketSubject?: string
) {
  const displayTicketNumber = ticketNumber || `#${ticketId.slice(-6).toUpperCase()}`
  
  return createNotification({
    type: 'ticket_auto_closed',
    title: 'Ticket Auto-Closed',
    message: `Ticket ${displayTicketNumber} has been automatically closed due to 14 days of inactivity: ${ticketSubject || 'Untitled'}`,
    userId: assignedUserId,
    ticketId,
  })
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

/**
 * Check for tickets that are due soon or overdue and create notifications
 */
export async function checkTicketDueDates() {
  const now = new Date()
  const dueSoonThreshold = new Date()
  dueSoonThreshold.setDate(now.getDate() + 1) // 1 day ahead
  
  try {
    // Find tickets that are due soon (within 1 day) and not yet notified
    const dueSoonTickets = await prisma.ticket.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: dueSoonThreshold,
        },
        assignedToId: {
          not: null,
        },
        status: {
          not: 'Closed', // Don't notify for closed tickets
        },
      },
      include: {
        assignedTo: true,
        notifications: {
          where: {
            type: 'ticket_due_soon',
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        },
      },
    })

    // Find tickets that are overdue and not yet notified
    const overdueTickets = await prisma.ticket.findMany({
      where: {
        dueDate: {
          lt: now,
        },
        assignedToId: {
          not: null,
        },
        status: {
          not: 'Closed', // Don't notify for closed tickets
        },
      },
      include: {
        assignedTo: true,
        notifications: {
          where: {
            type: 'ticket_overdue',
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        },
      },
    })

    let dueSoonCount = 0
    let overdueCount = 0

    // Create due soon notifications
    for (const ticket of dueSoonTickets) {
      // Only create notification if none exists in the last 24 hours
      if (ticket.notifications.length === 0 && ticket.assignedTo && ticket.dueDate) {
        await createTicketDueSoonNotification(
          ticket.id,
          ticket.assignedTo.id,
          ticket.dueDate,
          ticket.ticketNumber || undefined,
          ticket.subject
        )
        dueSoonCount++
      }
    }

    // Create overdue notifications
    for (const ticket of overdueTickets) {
      // Only create notification if none exists in the last 24 hours
      if (ticket.notifications.length === 0 && ticket.assignedTo && ticket.dueDate) {
        await createTicketOverdueNotification(
          ticket.id,
          ticket.assignedTo.id,
          ticket.dueDate,
          ticket.ticketNumber || undefined,
          ticket.subject
        )
        overdueCount++
      }
    }

    return {
      dueSoonCount,
      overdueCount,
      totalDueSoon: dueSoonTickets.length,
      totalOverdue: overdueTickets.length,
    }
  } catch (error) {
    console.error('Error checking ticket due dates:', error)
    return {
      dueSoonCount: 0,
      overdueCount: 0,
      totalDueSoon: 0,
      totalOverdue: 0,
    }
  }
}
