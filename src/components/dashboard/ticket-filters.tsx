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
import { X, CheckCircle2, Timer, AlertTriangle, Clock, AlertCircle, Circle, User, UserX, Users, ArrowRight, Zap, TrendingUp } from 'lucide-react'

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

const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Timer,
    AlertTriangle,
    Circle,
    Zap,
    TrendingUp
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
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const currentStatus = searchParams.get('status') || 'ALL'
  const currentPriority = searchParams.get('priority') || 'ALL'
  const currentAssigned = searchParams.get('assigned') || 'UNASSIGNED'

  useEffect(() => {
    // Load users, statuses, and priorities
    const fetchData = async () => {
      try {
        const [usersResponse, statusesResponse, prioritiesResponse] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/statuses'),
          fetch('/api/priorities')
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
    } else {
      params.delete(key)
    }
    router.push(`/dashboard?${params.toString()}`)
  }

  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      } else {
        params.delete('search')
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

  const handleAssignedChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('assigned', value)
    router.push(`/dashboard?${params.toString()}`)
  }


  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex-1">
        <Input
          placeholder="Search tickets..."
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
          <SelectTrigger className={`w-[140px] ${currentStatus !== 'ALL' ? statuses.find(s => s.name === currentStatus)?.color || '' : ''}`}>
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
          <SelectTrigger className={`w-[140px] ${currentPriority !== 'ALL' ? priorities.find(p => p.name === currentPriority)?.color || '' : ''}`}>
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
          defaultValue={currentAssigned}
          onValueChange={handleAssignedChange}
        >
          <ComboboxTrigger className="w-[180px]">
            {currentAssigned === 'ALL' ? (
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
          <ComboboxContent className="p-0">
            <ComboboxInput placeholder="Search users..." />
            <ComboboxEmpty>No users found</ComboboxEmpty>
            <ComboboxList>
              <ComboboxGroup>
                <ComboboxItem value="ALL">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>All Tickets</span>
                  </div>
                </ComboboxItem>
                <ComboboxItem value="UNASSIGNED">
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    <span>Unassigned</span>
                  </div>
                </ComboboxItem>
                {users.map((user) => (
                  <ComboboxItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{user.name}</span>
                    </div>
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </div>
  )
}