"use client"

import { useState, useEffect } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Download, Settings } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { useCache } from '@/lib/cache-context'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface TicketVolumeData {
  date: string
  [key: string]: number | string // Dynamic status keys
}

interface Queue {
  id: string
  name: string
  color: string
}

// Status-based color mapping
const getStatusColor = (status: string): string => {
  const normalizedStatus = status.toLowerCase()
  switch (normalizedStatus) {
    case 'open':
      return 'hsl(var(--chart-status-open))'
    case 'closed':
      return 'hsl(var(--chart-status-closed))'
    case 'in_progress':
    case 'in-progress':
      return 'hsl(var(--chart-status-in-progress))'
    case 'created':
      return 'hsl(var(--chart-status-created))'
    default:
      // Fallback to a calculated color based on the status name
      const hash = normalizedStatus.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a
      }, 0)
      const hue = Math.abs(hash) % 360
      return `hsl(${hue}, 70%, 50%)`
  }
}

export function TicketVolumeChart() {
  const [data, setData] = useState<TicketVolumeData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedQueue, setSelectedQueue] = useState<string>('all')
  const [queues, setQueues] = useState<Queue[]>([])
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>()
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>()
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['Created', 'Closed'])
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([])
  const { statuses } = useCache()

  // Load saved preferences
  useEffect(() => {
    const savedStatuses = localStorage.getItem('ticketVolumeChart.selectedStatuses')
    if (savedStatuses) {
      try {
        setSelectedStatuses(JSON.parse(savedStatuses))
      } catch (error) {
        console.error('Error loading saved statuses:', error)
        // Set default fallback if loading fails
        setSelectedStatuses(['Created', 'Closed'])
      }
    }
  }, [])

  // Get available statuses from the cache
  useEffect(() => {
    if (statuses.length > 0) {
      const statusNames = statuses.map(s => s.name)
      setAvailableStatuses(['Created', ...statusNames])
    }
  }, [statuses])

  // Fetch available queues
  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const response = await fetch('/api/queues')
        if (response.ok) {
          const queuesData = await response.json()
          setQueues(queuesData)
        }
      } catch (error) {
        console.error('Error fetching queues:', error)
      }
    }
    fetchQueues()
  }, [])

  // Fetch chart data
  useEffect(() => {
    const fetchData = async () => {
      if (selectedStatuses.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams()
        
        if (timeRange === 'custom' && customStartDate && customEndDate) {
          params.append('timeRange', 'custom')
          params.append('customStart', format(customStartDate, 'yyyy-MM-dd'))
          params.append('customEnd', format(customEndDate, 'yyyy-MM-dd'))
        } else {
          params.append('timeRange', timeRange)
        }
        
        if (selectedQueue && selectedQueue !== 'all') {
          params.append('queueId', selectedQueue)
        }

        params.append('statuses', selectedStatuses.join(','))

        const response = await fetch(`/api/analytics/ticket-volume?${params}`)
        if (response.ok) {
          const chartData = await response.json()
          setData(chartData)
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange, selectedQueue, customStartDate, customEndDate, selectedStatuses])

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...selectedStatuses, status]
      : selectedStatuses.filter(s => s !== status)
    
    setSelectedStatuses(newStatuses)
    
    // Save preferences
    localStorage.setItem('ticketVolumeChart.selectedStatuses', JSON.stringify(newStatuses))
  }

  const handleExportCSV = () => {
    if (data.length === 0) return

    const headers = ['Date', ...selectedStatuses]
    const csvContent = [
      headers,
      ...data.map(item => [
        item.date,
        ...selectedStatuses.map(status => item[status.toLowerCase()]?.toString() || '0')
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ticket-volume-${timeRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getDateRangeLabel = () => {
    if (timeRange === 'custom' && customStartDate && customEndDate) {
      return `${format(customStartDate, 'MMM dd')} - ${format(customEndDate, 'MMM dd, yyyy')}`
    }
    
    const endDate = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case '7d':
        startDate = subDays(endDate, 6)
        return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`
      case '30d':
        startDate = subDays(endDate, 29)
        return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`
      default:
        return ''
    }
  }

  // Generate chart config dynamically based on selected statuses
  const chartConfig = selectedStatuses.reduce((config, status) => {
    const normalizedStatus = status.toLowerCase()
    config[normalizedStatus] = {
      label: status,
      color: getStatusColor(status),
    }
    return config
  }, {} as Record<string, { label: string; color: string }>)

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4">
          <CardTitle className="text-lg">Ticket Volume Analytics</CardTitle>
          <CardDescription>
            Compare ticket volumes across selected statuses over time
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2 px-6 py-4">
          <div className="flex gap-2 flex-wrap">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedQueue} onValueChange={setSelectedQueue}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="All queues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All queues</SelectItem>
                {queues.map(queue => (
                  <SelectItem key={queue.id} value={queue.id}>
                    {queue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Select Statuses to Compare</h4>
                  <div className="space-y-2">
                    {availableStatuses.map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={status}
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                        />
                        <Label htmlFor={status} className="text-sm">
                          {status}
                        </Label>
                        <div
                          className="w-3 h-3 rounded-full ml-auto"
                          style={{ backgroundColor: getStatusColor(status) }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          {timeRange === 'custom' && (
            <div className="flex gap-2 mt-2">
              <DatePicker
                date={customStartDate}
                setDate={setCustomStartDate}
                placeholder="Start date"
                className="w-[120px]"
              />
              <DatePicker
                date={customEndDate}
                setDate={setCustomEndDate}
                placeholder="End date"
                className="w-[120px]"
              />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-2 sm:p-6">
        {loading ? (
          <div className="h-[200px] w-full">
            <Skeleton className="h-full w-full" />
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[200px] w-full"
          >
            <AreaChart
              data={data}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <defs>
                {selectedStatuses.map(status => {
                  const normalizedStatus = status.toLowerCase()
                  return (
                    <linearGradient key={status} id={`fill${status}`} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={getStatusColor(status)}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={getStatusColor(status)}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  )
                })}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 6)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              {selectedStatuses.map((status, index) => {
                return (
                  <Area
                    key={status}
                    dataKey={status.toLowerCase()}
                    type="monotone"
                    fill={`url(#fill${status})`}
                    fillOpacity={0.4}
                    stroke={getStatusColor(status)}
                    strokeWidth={2}
                    stackId={undefined}
                    connectNulls={false}
                  />
                )
              })}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
      
      <div className="px-6 pb-4">
        <div className="text-sm text-muted-foreground">
          {getDateRangeLabel()} • Comparing {selectedStatuses.join(', ')}
        </div>
      </div>
    </Card>
  )
}