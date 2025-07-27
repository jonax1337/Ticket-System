import { useEffect, useState, useCallback } from 'react'

interface EmailConfiguration {
  id: string
  name: string
  host: string
  port: number
  username: string
  password: string
  useSSL: boolean
  folder: string
  isActive: boolean
  lastSync: Date | null
  syncInterval: number
  emailAction: string
  moveToFolder: string | null
  processOnlyUnread: boolean
  subjectFilter: string | null
  fromFilter: string | null
  defaultPriority: string | null
  defaultStatus: string | null
  defaultAssigneeId: string | null
  enableAutoSync: boolean
  createdAt: Date
  updatedAt: Date
}

interface EmailSyncStatus {
  emailConfigs: EmailConfiguration[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

/**
 * Custom hook to monitor email sync status in real-time
 * Polls email configurations every 30 seconds to detect sync updates
 * Similar pattern to useAvatarUpdates for consistency
 */
export function useEmailSyncStatus(initialConfigs: EmailConfiguration[] = []) {
  const [status, setStatus] = useState<EmailSyncStatus>({
    emailConfigs: initialConfigs,
    loading: false,
    error: null,
    lastUpdated: null
  })

  const fetchEmailConfigs = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setStatus(prev => ({ ...prev, loading: true, error: null }))
      }
      
      const response = await fetch('/api/admin/email')
      if (!response.ok) {
        throw new Error('Failed to fetch email configurations')
      }
      
      const data = await response.json()
      
      setStatus(prev => ({
        ...prev,
        emailConfigs: Array.isArray(data) ? data : [],
        loading: false,
        lastUpdated: new Date()
      }))
      
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching email configurations:', error)
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      return []
    }
  }, [])

  useEffect(() => {
    // Initial load if no configs provided
    if (initialConfigs.length === 0) {
      fetchEmailConfigs(true) // Show loading on initial fetch
    } else {
      setStatus(prev => ({
        ...prev,
        emailConfigs: initialConfigs,
        lastUpdated: new Date()
      }))
    }

    // Poll for updates every 30 seconds - silently without loading spinner
    const interval = setInterval(() => fetchEmailConfigs(false), 30000)

    return () => clearInterval(interval)
  }, [fetchEmailConfigs, initialConfigs.length])

  // Manually trigger refresh
  const refresh = useCallback(() => {
    return fetchEmailConfigs(true) // Show loading when manually refreshed
  }, [fetchEmailConfigs])

  return {
    ...status,
    refresh
  }
}

/**
 * Hook to calculate countdown to next sync for a specific email configuration
 */
export function useEmailSyncCountdown(config: EmailConfiguration | null) {
  const [countdown, setCountdown] = useState<{
    timeToNext: number
    timeSinceLast: number
    isOverdue: boolean
  }>({
    timeToNext: 0,
    timeSinceLast: 0,
    isOverdue: false
  })

  useEffect(() => {
    if (!config || !config.isActive || !config.enableAutoSync) {
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const lastSync = config.lastSync ? new Date(config.lastSync) : null
      const syncIntervalMs = config.syncInterval * 1000

      if (lastSync) {
        const timeSinceLast = now.getTime() - lastSync.getTime()
        const timeToNext = Math.max(0, syncIntervalMs - timeSinceLast)
        const isOverdue = timeSinceLast > syncIntervalMs * 1.2 // Consider overdue if 20% past interval

        setCountdown({
          timeToNext: Math.ceil(timeToNext / 1000), // Convert to seconds
          timeSinceLast: Math.floor(timeSinceLast / 1000),
          isOverdue
        })
      } else {
        // Never synced - should sync immediately
        setCountdown({
          timeToNext: 0,
          timeSinceLast: 0,
          isOverdue: true
        })
      }
    }

    // Update immediately
    updateCountdown()

    // Update every second for real-time countdown
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [config])

  return countdown
}

/**
 * Utility function to format countdown time
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

/**
 * Utility function to format time since last sync
 */
export function formatTimeSince(seconds: number): string {
  if (seconds <= 0) return 'Just now'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m ago`
  } else if (minutes > 0) {
    return `${minutes}m ago`
  } else {
    return `${seconds}s ago`
  }
}