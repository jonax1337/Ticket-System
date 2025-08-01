'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CustomStatus, CustomPriority } from '@/types/ticket'

interface CacheContextType {
  statuses: CustomStatus[]
  priorities: CustomPriority[]
  isLoading: boolean
  refreshCache: () => Promise<void>
}

const CacheContext = createContext<CacheContextType | undefined>(undefined)

interface CacheProviderProps {
  children: ReactNode
}

export function CacheProvider({ children }: CacheProviderProps) {
  const [statuses, setStatuses] = useState<CustomStatus[]>([])
  const [priorities, setPriorities] = useState<CustomPriority[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<number>(0)

  // Cache for 30 seconds to avoid unnecessary refetches
  const CACHE_DURATION = 30 * 1000

  const fetchData = async (force = false) => {
    const now = Date.now()
    
    // Don't refetch if cache is still valid and not forced
    if (!force && now - lastFetch < CACHE_DURATION && statuses.length > 0 && priorities.length > 0) {
      return
    }

    setIsLoading(true)
    try {
      const [statusesResponse, prioritiesResponse] = await Promise.all([
        fetch('/api/statuses'),
        fetch('/api/priorities')
      ])
  
      let statusSuccess = false
      let prioritySuccess = false
  
      if (statusesResponse.ok) {
        const statusData = await statusesResponse.json()
        setStatuses(statusData)
        statusSuccess = true
      }
  
      if (prioritiesResponse.ok) {
        const priorityData = await prioritiesResponse.json()
        setPriorities(priorityData)
        prioritySuccess = true
      }
  
      // Only update lastFetch if both requests succeeded
      if (statusSuccess && prioritySuccess) {
        setLastFetch(now)
      }
    } catch (error) {
      console.error('Failed to fetch cache data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshCache = async () => {
    await fetchData(true)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const value = {
    statuses,
    priorities,
    isLoading,
    refreshCache
  }

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>
}

export function useCache() {
  const context = useContext(CacheContext)
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider')
  }
  return context
}