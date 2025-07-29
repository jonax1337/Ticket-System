// Keep track of active connections
const connections = new Map<string, { controller: ReadableStreamDefaultController; userId: string; createdAt: Date }>()

// Function to broadcast notification to specific user
export function broadcastNotificationToUser(userId: string, notification: Record<string, unknown>) {
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
      } catch (error) {
        // Connection closed, remove it
        connections.delete(connectionId)
      }
    }
  }
}

// Function to broadcast unread count update to specific user
export function broadcastUnreadCountToUser(userId: string, count: number) {
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
        // Connection closed, remove it
        connections.delete(connectionId)
      }
    }
  }
}

// Function to get active connections count (for debugging)
export function getActiveConnectionsCount(): number {
  return connections.size
}

// Function to add a connection
export function addConnection(connectionId: string, controller: ReadableStreamDefaultController, userId: string) {
  connections.set(connectionId, { controller, userId, createdAt: new Date() })
}

// Function to remove a connection
export function removeConnection(connectionId: string) {
  const connection = connections.get(connectionId)
  connections.delete(connectionId)
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