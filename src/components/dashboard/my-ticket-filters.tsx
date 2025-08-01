'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-system'
import { useCache } from '@/lib/cache-context'

interface CustomStatus {
  id: string
  name: string
  icon: string
  color: string
  order: number
  isDefault: boolean
}

interface CustomPriority {
  id: string
  name: string
  icon: string
  color: string
  order: number
  isDefault: boolean
}

interface Queue {
  id: string
  name: string
  color: string
  icon: string
  order: number
  isDefault: boolean
}


export default function MyTicketFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { statuses, priorities } = useCache()
  const [queues, setQueues] = useState<Queue[]>([])
  
  // Get filter values from URL params first, then fallback to localStorage
  const getFilterValue = (key: string, defaultValue: string) => {
    const urlValue = searchParams.get(key)
    if (urlValue) return urlValue
    
    if (typeof window !== 'undefined') {
      const savedValue = localStorage.getItem(`my-tickets-filter-${key}`)
      return savedValue || defaultValue
    }
    return defaultValue
  }
  
  const [searchValue, setSearchValue] = useState(() => getFilterValue('search', ''))
  const currentStatus = getFilterValue('status', 'ALL')
  const currentPriority = getFilterValue('priority', 'ALL')
  const currentQueue = getFilterValue('queue', 'ALL')

  useEffect(() => {
    // Load queues (statuses and priorities come from cache)
    const fetchData = async () => {
      try {
        const queuesResponse = await fetch('/api/users/queues') // Get user's assigned queues + default queues
        
        if (queuesResponse.ok) {
          const userQueueData = await queuesResponse.json()
          // Extract just the queue data from user queue assignments
          const queueData = userQueueData.map((uq: { queue: Queue }) => uq.queue)
          setQueues(queueData)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    fetchData()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'ALL') {
      params.set(key, value)
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`my-tickets-filter-${key}`, value)
      }
    } else {
      params.delete(key)
      // Remove from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`my-tickets-filter-${key}`)
      }
    }
    router.push(`/dashboard/my-tickets?${params.toString()}`)
  }

  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('my-tickets-filter-search', searchTerm.trim())
        }
      } else {
        params.delete('search')
        // Remove from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('my-tickets-filter-search')
        }
      }
      router.push(`/dashboard/my-tickets?${params.toString()}`)
    }, 500),
    [searchParams, router]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  // Simple debounce function
  function debounce<T extends unknown[]>(
    func: (...args: T) => void,
    wait: number
  ): (...args: T) => void {
    let timeout: NodeJS.Timeout
    return (...args: T) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search my tickets..."
            value={searchValue}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Select
          defaultValue={currentStatus}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className={`w-auto min-w-[100px] ${currentStatus !== 'ALL' ? statuses.find(s => s.name === currentStatus)?.color || '' : ''}`}>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              <span className="flex items-center gap-2">
                <span>All Status</span>
              </span>
            </SelectItem>
            {statuses.map((status) => {
              const IconComponent = getIconComponent(status.icon)
              return (
                <SelectItem key={status.id} value={status.name}>
                  <span className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <span>{status.name}</span>
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <Select
          defaultValue={currentPriority}
          onValueChange={(value) => handleFilterChange('priority', value)}
        >
          <SelectTrigger className={`w-auto min-w-[100px] ${currentPriority !== 'ALL' ? priorities.find(p => p.name === currentPriority)?.color || '' : ''}`}>
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              <span className="flex items-center gap-2">
                <span>All Priority</span>
              </span>
            </SelectItem>
            {priorities.map((priority) => {
              const IconComponent = getIconComponent(priority.icon)
              return (
                <SelectItem key={priority.id} value={priority.name}>
                  <span className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <span>{priority.name}</span>
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <Select
          defaultValue={currentQueue}
          onValueChange={(value) => handleFilterChange('queue', value)}
        >
          <SelectTrigger className={`w-auto min-w-[100px] ${currentQueue !== 'ALL' ? queues.find(q => q.id === currentQueue)?.color || '' : ''}`}>
            <SelectValue placeholder="All Queues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              <span className="flex items-center gap-2">
                <span>All Queues</span>
              </span>
            </SelectItem>
            {queues.map((queue) => {
              const IconComponent = getIconComponent(queue.icon)
              return (
                <SelectItem key={queue.id} value={queue.id}>
                  <span className="flex items-center gap-2">
                    <div style={{ color: queue.color }}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span>{queue.name}</span>
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}