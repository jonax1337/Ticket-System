"use client"

import { useState, useEffect } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { CalendarIcon, Download } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

interface TicketVolumeData {
  date: string
  created: number
  closed: number
}

interface Queue {
  id: string
  name: string
  color: string
}

const chartConfig = {
  created: {
    label: 'Created',
    color: 'hsl(var(--chart-1))',
  },
  closed: {
    label: 'Closed',
    color: 'hsl(var(--chart-2))',
  },
}

export function TicketVolumeChart() {
  const [data, setData] = useState<TicketVolumeData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedQueue, setSelectedQueue] = useState<string>('all')
  const [queues, setQueues] = useState<Queue[]>([])
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>()
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>()
  const [totalCreated, setTotalCreated] = useState(0)
  const [totalClosed, setTotalClosed] = useState(0)
  const [changePercentage, setChangePercentage] = useState(0)

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

        const response = await fetch(`/api/analytics/ticket-volume?${params}`)
        if (response.ok) {
          const chartData = await response.json()
          setData(chartData)
          
          // Calculate totals and change percentage
          const created = chartData.reduce((sum: number, item: TicketVolumeData) => sum + item.created, 0)
          const closed = chartData.reduce((sum: number, item: TicketVolumeData) => sum + item.closed, 0)
          setTotalCreated(created)
          setTotalClosed(closed)
          
          // Calculate change percentage (closed vs created)
          const change = created > 0 ? ((closed - created) / created) * 100 : 0
          setChangePercentage(change)
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange, selectedQueue, customStartDate, customEndDate])

  const handleExportCSV = () => {
    const csvContent = [
      ['Date', 'Created', 'Closed'],
      ...data.map(item => [item.date, item.created.toString(), item.closed.toString()])
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

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Ticket Volume - Created vs. Closed</CardTitle>
          <CardDescription>
            Comparing ticket creation and closure rates over the selected period
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2 px-6 py-4 sm:px-8 sm:py-6">
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
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
              <SelectTrigger className="w-[140px]">
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
                className="w-[140px]"
              />
              <DatePicker
                date={customEndDate}
                setDate={setCustomEndDate}
                placeholder="End date"
                className="w-[140px]"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {loading ? (
          <div className="h-[300px] w-full">
            <Skeleton className="h-full w-full" />
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
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
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              <Area
                dataKey="created"
                type="monotone"
                fill="var(--color-created)"
                fillOpacity={0.4}
                stroke="var(--color-created)"
                strokeWidth={2}
              />
              <Area
                dataKey="closed"
                type="monotone"
                fill="var(--color-closed)"
                fillOpacity={0.4}
                stroke="var(--color-closed)"
                strokeWidth={2}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {changePercentage >= 0 ? (
                <span className="text-green-600">
                  Closure rate increased by {changePercentage.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-600">
                  Closure rate decreased by {Math.abs(changePercentage).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              {getDateRangeLabel()} • {totalCreated} created, {totalClosed} closed
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}