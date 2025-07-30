'use client'

import { useState, useEffect } from 'react'

interface AppSettings {
  id: string
  appName: string
  slogan?: string | null
  logoUrl?: string | null
  hideAppName?: boolean
  themeColor: string
  ticketPrefix: string
  ticketNumberType: string
  ticketNumberLength: number
  lastTicketNumber: number
  createdAt: Date
  updatedAt: Date
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        } else {
          // Fallback default settings
          setSettings({
            id: 'default',
            appName: 'Support Dashboard',
            slogan: null,
            logoUrl: null,
            hideAppName: false,
            themeColor: 'default',
            ticketPrefix: 'TICKET',
            ticketNumberType: 'sequential',
            ticketNumberLength: 6,
            lastTicketNumber: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch settings')
        // Fallback default settings
        setSettings({
          id: 'default',
          appName: 'Support Dashboard',
          slogan: null,
          logoUrl: null,
          hideAppName: false,
          themeColor: 'default',
          ticketPrefix: 'TICKET',
          ticketNumberType: 'sequential',
          ticketNumberLength: 6,
          lastTicketNumber: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { settings, isLoading, error }
}