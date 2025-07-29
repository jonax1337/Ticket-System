// Keep track of active connections
const connections = new Map<string, { controller: ReadableStreamDefaultController; userId: string; createdAt: Date }>()

// Function to broadcast notification to specific user
export function broadcastNotificationToUser(userId: string, notification: Record<string, unknown>) {
  console.log(`[SSE DEBUG] Broadcasting notification to user ${userId}, active connections: ${connections.size}`)
  
  let sentCount = 0
  for (const [connectionId, { controller, userId: connUserId }] of connections) {
    if (connUserId === userId) {
      try {
        const data = JSON.stringify({
          type: 'notification',
          data: notification,
          timestamp: new Date().toISOString()
        })
        controller.enqueue(`data: ${data}\n\n`)
        sentCount++
        console.log(`[SSE DEBUG] Sent notification to connection ${connectionId}`)
      } catch (error) {
        console.log(`[SSE DEBUG] Failed to send to connection ${connectionId}, removing:`, error)
        // Connection closed, remove it
        connections.delete(connectionId)
      }
    }
  }
  
  console.log(`[SSE DEBUG] Notification sent to ${sentCount} connections for user ${userId}`)
}

// Function to broadcast unread count update to specific user
export function broadcastUnreadCountToUser(userId: string, count: number) {
  console.log(`[SSE DEBUG] Broadcasting unread count ${count} to user ${userId}`)
  
  let sentCount = 0
  for (const [connectionId, { controller, userId: connUserId }] of connections) {
    if (connUserId === userId) {
      try {
        const data = JSON.stringify({
          type: 'unread_count',
          data: { count },
          timestamp: new Date().toISOString()
        })
        controller.enqueue(`data: ${data}\n\n`)
        sentCount++
      } catch (error) {
        console.log(`[SSE DEBUG] Failed to send unread count to connection ${connectionId}, removing:`, error)
        // Connection closed, remove it
        connections.delete(connectionId)
      }
    }
  }
  
  console.log(`[SSE DEBUG] Unread count sent to ${sentCount} connections for user ${userId}`)
}

// Function to get active connections count (for debugging)
export function getActiveConnectionsCount(): number {
  return connections.size
}

// Function to add a connection
export function addConnection(connectionId: string, controller: ReadableStreamDefaultController, userId: string) {
  connections.set(connectionId, { controller, userId, createdAt: new Date() })
  console.log(`[SSE DEBUG] Added connection ${connectionId} for user ${userId}. Total connections: ${connections.size}`)
}

// Function to remove a connection
export function removeConnection(connectionId: string) {
  const connection = connections.get(connectionId)
  connections.delete(connectionId)
  console.log(`[SSE DEBUG] Removed connection ${connectionId}${connection ? ` for user ${connection.userId}` : ''}. Total connections: ${connections.size}`)
}

// Function to get debug info about connections
export function getConnectionsDebugInfo() {
  const connectionsArray = Array.from(connections.entries()).map(([id, { userId, createdAt }]) => ({
    connectionId: id,
    userId,
    createdAt: createdAt.toISOString(),
    ageMinutes: Math.round((Date.now() - createdAt.getTime()) / 60000)
  }))
  
  return {
    totalConnections: connections.size,
    connections: connectionsArray
  }
}