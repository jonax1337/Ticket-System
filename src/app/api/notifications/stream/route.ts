import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { addConnection, removeConnection } from '@/lib/sse-connections'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('[SSE DEBUG] Unauthorized SSE connection attempt')
      return new Response('Unauthorized', { status: 401 })
    }

    console.log(`[SSE DEBUG] Setting up SSE connection for user ${session.user.id}`)

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Store the connection
        const connectionId = Math.random().toString(36).substring(7)
        addConnection(connectionId, controller, session.user.id)

        // Send initial connection message
        const data = JSON.stringify({ 
          type: 'connected', 
          timestamp: new Date().toISOString() 
        })
        controller.enqueue(`data: ${data}\n\n`)
        console.log(`[SSE DEBUG] Sent connection confirmation for ${connectionId}`)

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            const heartbeatData = JSON.stringify({ 
              type: 'heartbeat', 
              timestamp: new Date().toISOString() 
            })
            controller.enqueue(`data: ${heartbeatData}\n\n`)
            console.log(`[SSE DEBUG] Sent heartbeat for connection ${connectionId}`)
          } catch (error) {
            // Connection closed, cleanup
            console.log(`[SSE DEBUG] Heartbeat failed for connection ${connectionId}, cleaning up:`, error)
            clearInterval(heartbeat)
            removeConnection(connectionId)
          }
        }, 30000)

        // Handle connection cleanup
        request.signal.addEventListener('abort', () => {
          console.log(`[SSE DEBUG] Connection aborted for ${connectionId}`)
          clearInterval(heartbeat)
          removeConnection(connectionId)
          try {
            controller.close()
          } catch {
            // Connection already closed
          }
        })
      },
    })

    console.log(`[SSE DEBUG] SSE stream created successfully for user ${session.user.id}`)
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
    console.error('[SSE DEBUG] Error setting up SSE stream:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}