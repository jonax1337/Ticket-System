/**
 * Server-Side Events (SSE) connection manager
 * Handles active SSE connections and broadcasting
 */

// Store active SSE connections
const connections = new Map<string, { controller: ReadableStreamDefaultController; userId: string }>()

/**
 * Register a new SSE connection
 */
export function registerConnection(userId: string, controller: ReadableStreamDefaultController): string {
  const connectionId = `${userId}-${Date.now()}`
  connections.set(connectionId, { controller, userId })
  return connectionId
}

/**
 * Remove an SSE connection
 */
export function removeConnection(connectionId: string): void {
  connections.delete(connectionId)
}

/**
 * Broadcast notification updates to specific user
 */
export function broadcastToUser(userId: string, data: object): void {
  const userConnections = Array.from(connections.entries()).filter(
    ([, connection]) => connection.userId === userId
  )

  userConnections.forEach(([connectionId, connection]) => {
    try {
      const message = JSON.stringify(data)
      connection.controller.enqueue(`data: ${message}\n\n`)
    } catch (error) {
      console.error('Error broadcasting to user:', error)
      // Remove failed connection
      connections.delete(connectionId)
    }
  })
}

/**
 * Get active connection count (for debugging)
 */
export function getActiveConnectionCount(): number {
  return connections.size
}

/**
 * Get connections for a specific user (for debugging)
 */
export function getUserConnectionCount(userId: string): number {
  return Array.from(connections.values()).filter(conn => conn.userId === userId).length
}