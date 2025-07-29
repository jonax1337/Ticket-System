'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useNotifications } from '@/components/providers/notification-provider'

interface DebugInfo {
  totalConnections: number
  connections: Array<{
    connectionId: string
    userId: string
    createdAt: string
    ageMinutes: number
  }>
  serverTime: string
}

export default function NotificationDiagnostics() {
  const { data: session } = useSession()
  const { isConnected, connectionError, usePolling } = useNotifications()
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [lastEventReceived, setLastEventReceived] = useState<string>('')

  // Listen for SSE events
  useEffect(() => {
    const originalConsoleError = console.error
    console.error = (...args) => {
      const message = args.join(' ')
      if (message.includes('SSE') || message.includes('notification')) {
        setLastEventReceived(new Date().toLocaleTimeString() + ': ' + message)
      }
      originalConsoleError.apply(console, args)
    }

    return () => {
      console.error = originalConsoleError
    }
  }, [])

  const loadDebugInfo = useCallback(async () => {
    if (session?.user?.role !== 'ADMIN') return

    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications/debug')
      if (response.ok) {
        const data = await response.json()
        setDebugInfo(data)
      }
    } catch (error) {
      console.error('Failed to load debug info:', error)
    }
    setIsLoading(false)
  }, [session?.user?.role])

  const sendTestNotification = async () => {
    setIsLoading(true)
    setTestResult(null)
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      if (response.ok) {
        const data = await response.json()
        setTestResult({ success: true, message: `Test notification sent: ${data.notification?.id}` })
      } else {
        setTestResult({ success: false, message: 'Failed to send test notification' })
      }
    } catch (error) {
      setTestResult({ success: false, message: `Error: ${error}` })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      loadDebugInfo()
      const interval = setInterval(loadDebugInfo, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [session?.user?.role, loadDebugInfo])

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only administrators can access notification diagnostics.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification System Diagnostics</h1>
        <p className="text-muted-foreground">Debug real-time notification system</p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected && !usePolling ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : usePolling ? (
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected && !usePolling && "Real-time (SSE)"}
                {usePolling && "Polling Fallback"}
                {!isConnected && !usePolling && "Disconnected"}
              </Badge>
              {connectionError && (
                <span className="text-sm text-muted-foreground">{connectionError}</span>
              )}
            </div>
            {lastEventReceived && (
              <div className="text-sm text-muted-foreground">
                Last event: {lastEventReceived}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Server Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Server Connections
            <Button
              variant="ghost"
              size="sm"
              onClick={loadDebugInfo}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </CardTitle>
          <CardDescription>Active SSE connections on the server</CardDescription>
        </CardHeader>
        <CardContent>
          {debugInfo ? (
            <div className="space-y-4">
              <div className="text-sm">
                <strong>Total Connections:</strong> {debugInfo.totalConnections}
              </div>
              <div className="text-sm">
                <strong>Server Time:</strong> {new Date(debugInfo.serverTime).toLocaleString()}
              </div>
              
              {debugInfo.connections.length > 0 && (
                <div className="space-y-2">
                  <strong className="text-sm">Active Connections:</strong>
                  {debugInfo.connections.map((conn) => (
                    <div key={conn.connectionId} className="bg-muted p-2 rounded text-sm">
                      <div>Connection ID: {conn.connectionId}</div>
                      <div>User ID: {conn.userId}</div>
                      <div>Age: {conn.ageMinutes} minutes</div>
                      <div>Created: {new Date(conn.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground">Loading debug info...</div>
          )}
        </CardContent>
      </Card>

      {/* Test Notification */}
      <Card>
        <CardHeader>
          <CardTitle>Test Notification</CardTitle>
          <CardDescription>Send a test notification to yourself</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={sendTestNotification} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send Test Notification
          </Button>
          
          {testResult && (
            <div className={`p-3 rounded flex items-center gap-2 ${
              testResult.success 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {testResult.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Debugging Steps</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ol className="space-y-2">
            <li>Check the Connection Status above - it should show &quot;Real-time (SSE)&quot; for best performance</li>
            <li>If using &quot;Polling Fallback&quot;, SSE failed but notifications will still work with a delay</li>
            <li>Verify that server connections show your user ID in the active connections</li>
            <li>Send a test notification and watch for it to appear</li>
            <li>Open browser dev tools and check the Console tab for errors</li>
            <li>Check the Network tab for failed requests to /api/notifications/stream if SSE is not connecting</li>
            <li>The system automatically falls back to polling if SSE fails, so notifications should always work</li>
            <li>Debug logs have been removed to reduce console spam - errors will still be logged</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}