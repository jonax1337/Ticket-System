'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/shadcn-io/combobox'
import { Button } from '@/components/ui/button'
import { X, CheckCircle2, Timer, AlertTriangle, Clock, AlertCircle, Circle, User, UserX, Users, ArrowRight, Zap, TrendingUp, Inbox, Folder, Search } from 'lucide-react'

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

const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Timer,
    AlertTriangle,
    Circle,
    Zap,
    TrendingUp,
    Inbox,
    Folder
  }
  return iconMap[iconName] || AlertCircle
}

interface User {
  id: string
  name: string
  email: string
}

export default function TicketFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [statuses, setStatuses] = useState<CustomStatus[]>([])
  const [priorities, setPriorities] = useState<CustomPriority[]>([])
  const [queues, setQueues] = useState<Queue[]>([])
  
  
  const [mounted, setMounted] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [currentStatus, setCurrentStatus] = useState('ALL')
  const [currentPriority, setCurrentPriority] = useState('ALL')
  const [currentAssigned, setCurrentAssigned] = useState('UNASSIGNED')
  const [currentQueue, setCurrentQueue] = useState('ALL')

  useEffect(() => {
    setMounted(true)
    
    // On first load, if no URL params, restore from localStorage and update URL
    if (typeof window !== 'undefined' && !window.location.search) {
      const savedSearch = localStorage.getItem('dashboard-filter-search')
      const savedStatus = localStorage.getItem('dashboard-filter-status')
      const savedPriority = localStorage.getItem('dashboard-filter-priority')
      const savedAssigned = localStorage.getItem('dashboard-filter-assigned')
      const savedQueue = localStorage.getItem('dashboard-filter-queue')
      
      // Build URL params from localStorage
      const params = new URLSearchParams()
      if (savedSearch) params.set('search', savedSearch)
      if (savedStatus && savedStatus !== 'ALL') params.set('status', savedStatus)
      if (savedPriority && savedPriority !== 'ALL') params.set('priority', savedPriority)
      if (savedAssigned && savedAssigned !== 'UNASSIGNED') params.set('assigned', savedAssigned)
      if (savedQueue && savedQueue !== 'ALL') params.set('queue', savedQueue)
      
      // If we have saved filters, update URL
      if (params.toString()) {
        router.replace(`/dashboard?${params.toString()}`)
      }
      
      // Set state from localStorage
      setSearchValue(savedSearch || '')
      setCurrentStatus(savedStatus || 'ALL')
      setCurrentPriority(savedPriority || 'ALL')
      setCurrentAssigned(savedAssigned || 'UNASSIGNED')
      setCurrentQueue(savedQueue || 'ALL')
    } else {
      // If URL params exist, use them and update localStorage
      const urlSearch = searchParams.get('search')
      const urlStatus = searchParams.get('status')
      const urlPriority = searchParams.get('priority')
      const urlAssigned = searchParams.get('assigned')
      const urlQueue = searchParams.get('queue')
      
      const search = urlSearch || ''
      const status = urlStatus || 'ALL'
      const priority = urlPriority || 'ALL'
      const assigned = urlAssigned || 'UNASSIGNED'
      const queue = urlQueue || 'ALL'
      
      setSearchValue(search)
      setCurrentStatus(status)
      setCurrentPriority(priority)
      setCurrentAssigned(assigned)
      setCurrentQueue(queue)
      
      // Update localStorage to match URL
      if (typeof window !== 'undefined') {
        if (search) localStorage.setItem('dashboard-filter-search', search)
        else localStorage.removeItem('dashboard-filter-search')
        
        if (status !== 'ALL') localStorage.setItem('dashboard-filter-status', status)
        else localStorage.removeItem('dashboard-filter-status')
        
        if (priority !== 'ALL') localStorage.setItem('dashboard-filter-priority', priority)
        else localStorage.removeItem('dashboard-filter-priority')
        
        if (assigned !== 'UNASSIGNED') localStorage.setItem('dashboard-filter-assigned', assigned)
        else localStorage.removeItem('dashboard-filter-assigned')
        
        if (queue !== 'ALL') localStorage.setItem('dashboard-filter-queue', queue)
        else localStorage.removeItem('dashboard-filter-queue')
      }
    }
  }, [searchParams, router])

  useEffect(() => {
    // Load users, statuses, priorities, and queues
    const fetchData = async () => {
      try {
        const [usersResponse, statusesResponse, prioritiesResponse, queuesResponse] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/statuses'),
          fetch('/api/priorities'),
          fetch('/api/users/queues') // Get user's assigned queues + default queues
        ])
        
        if (usersResponse.ok) {
          const userData = await usersResponse.json()
          setUsers(userData)
        }
        
        if (statusesResponse.ok) {
          const statusData = await statusesResponse.json()
          setStatuses(statusData)
        }
        
        if (prioritiesResponse.ok) {
          const priorityData = await prioritiesResponse.json()
          setPriorities(priorityData)
        }

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
        localStorage.setItem(`dashboard-filter-${key}`, value)
      }
    } else {
      params.delete(key)
      // Remove from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`dashboard-filter-${key}`)
      }
    }
    
    // Update local state
    if (key === 'status') setCurrentStatus(value)
    if (key === 'priority') setCurrentPriority(value)
    if (key === 'queue') setCurrentQueue(value)
    
    router.push(`/dashboard?${params.toString()}`)
  }

  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('dashboard-filter-search', searchTerm.trim())
        }
      } else {
        params.delete('search')
        // Remove from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dashboard-filter-search')
        }
      }
      router.push(`/dashboard?${params.toString()}`)
    }, 500),
    [searchParams, router]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  // Simple debounce function
  function debounce<T extends (...args: string[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  const handleAssignedChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('assigned', value)
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-filter-assigned', value)
    }
    setCurrentAssigned(value)
    router.push(`/dashboard?${params.toString()}`)
  }


  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchValue}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Select
          value={currentStatus}
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
          value={currentPriority}
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
        <Combobox
          data={[
            { label: 'All Tickets', value: 'ALL' },
            { label: 'Unassigned', value: 'UNASSIGNED' },
            ...users.map(user => ({
              label: user.name,
              value: user.id
            }))
          ]}
          type="assignee"
          value={currentAssigned}
          onValueChange={handleAssignedChange}
        >
          <ComboboxTrigger className="w-auto min-w-[120px]">
            {!mounted ? (
              'Select user'
            ) : currentAssigned === 'ALL' ? (
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Tickets
              </span>
            ) : currentAssigned === 'UNASSIGNED' ? (
              <span className="flex items-center gap-2">
                <UserX className="h-4 w-4" />
                Unassigned
              </span>
            ) : (
              users.find(user => user.id === currentAssigned) ? (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {users.find(user => user.id === currentAssigned)?.name}
                </span>
              ) : (
                'Select user'
              )
            )}
          </ComboboxTrigger>
          <ComboboxContent className="p-0 min-w-[180px]">
            <ComboboxInput 
              placeholder="Search users..." 
              className="w-full"
            />
            <ComboboxEmpty>No users found</ComboboxEmpty>
            <ComboboxList>
              <ComboboxGroup>
                <ComboboxItem value="ALL">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span>All Tickets</span>
                  </div>
                </ComboboxItem>
                <ComboboxItem value="UNASSIGNED">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <UserX className="h-4 w-4 flex-shrink-0" />
                    <span>Unassigned</span>
                  </div>
                </ComboboxItem>
                {users.map((user) => (
                  <ComboboxItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span>{user.name}</span>
                    </div>
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <Select
          value={currentQueue}
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
                    <IconComponent className="h-4 w-4" />
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