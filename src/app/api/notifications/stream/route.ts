import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { registerConnection, removeConnection } from '@/lib/sse-connections'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = session.user.id

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Register connection
        const connectionId = registerConnection(userId, controller)

        // Send initial connection message
        const data = JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })
        controller.enqueue(`data: ${data}\n\n`)

        // Set up keepalive ping every 30 seconds
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`)
          } catch {
            clearInterval(keepAlive)
            removeConnection(connectionId)
          }
        }, 30000)

        // Clean up when connection closes
        request.signal.addEventListener('abort', () => {
          clearInterval(keepAlive)
          removeConnection(connectionId)
          try {
            controller.close()
          } catch {
            // Connection already closed
          }
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    })
  } catch (error) {
    console.error('Error setting up SSE connection:', error)
    return new Response('Internal server error', { status: 500 })
  }
}