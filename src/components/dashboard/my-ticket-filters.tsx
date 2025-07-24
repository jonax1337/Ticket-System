'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Timer, AlertTriangle, Clock, AlertCircle, Circle } from 'lucide-react'

const statusColors = {
  OPEN: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  CLOSED: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  ALL: ''
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  URGENT: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  ALL: ''
}

const statusIcons = {
  OPEN: <Circle className="h-4 w-4" />,
  IN_PROGRESS: <Timer className="h-4 w-4" />,
  CLOSED: <CheckCircle2 className="h-4 w-4" />,
  ALL: null
}

const priorityIcons = {
  LOW: <Clock className="h-4 w-4" />,
  MEDIUM: <Timer className="h-4 w-4" />,
  HIGH: <AlertCircle className="h-4 w-4" />,
  URGENT: <AlertTriangle className="h-4 w-4" />,
  ALL: null
}

export default function MyTicketFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const currentStatus = searchParams.get('status') || 'ALL'
  const currentPriority = searchParams.get('priority') || 'ALL'

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'ALL') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/dashboard/my-tickets?${params.toString()}`)
  }

  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      } else {
        params.delete('search')
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
  function debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex-1">
        <Input
          placeholder="Search my tickets..."
          value={searchValue}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
      </div>
      <div className="flex gap-2">
        <Select
          defaultValue={currentStatus}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className={`w-[140px] ${statusColors[currentStatus as keyof typeof statusColors]}`}>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              <span className="flex items-center gap-2">
                <span>All Status</span>
              </span>
            </SelectItem>
            <SelectItem value="OPEN">
              <span className="flex items-center gap-2">
                {statusIcons.OPEN}
                <span>Open</span>
              </span>
            </SelectItem>
            <SelectItem value="IN_PROGRESS">
              <span className="flex items-center gap-2">
                {statusIcons.IN_PROGRESS}
                <span>In Progress</span>
              </span>
            </SelectItem>
            <SelectItem value="CLOSED">
              <span className="flex items-center gap-2">
                {statusIcons.CLOSED}
                <span>Closed</span>
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          defaultValue={currentPriority}
          onValueChange={(value) => handleFilterChange('priority', value)}
        >
          <SelectTrigger className={`w-[140px] ${priorityColors[currentPriority as keyof typeof priorityColors]}`}>
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              <span className="flex items-center gap-2">
                <span>All Priority</span>
              </span>
            </SelectItem>
            <SelectItem value="LOW">
              <span className="flex items-center gap-2">
                {priorityIcons.LOW}
                <span>Low</span>
              </span>
            </SelectItem>
            <SelectItem value="MEDIUM">
              <span className="flex items-center gap-2">
                {priorityIcons.MEDIUM}
                <span>Medium</span>
              </span>
            </SelectItem>
            <SelectItem value="HIGH">
              <span className="flex items-center gap-2">
                {priorityIcons.HIGH}
                <span>High</span>
              </span>
            </SelectItem>
            <SelectItem value="URGENT">
              <span className="flex items-center gap-2">
                {priorityIcons.URGENT}
                <span>Urgent</span>
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}