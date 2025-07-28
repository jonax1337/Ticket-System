"use client"

import { useState, useEffect } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
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
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface PriorityDistributionData {
  priority: string
  count: number
  percentage: number
}

interface Queue {
  id: string
  name: string
  color: string
}

// Define colors for different priorities
const priorityColors: Record<string, string> = {
  'LOW': '#51cf66',
  'MEDIUM': '#ffd43b',
  'HIGH': '#ff8cc8',
  'URGENT': '#ff6b6b',
  'CRITICAL': '#e03131',
}

const getPriorityColor = (priority: string, index: number) => {
  return priorityColors[priority] || `hsl(${(index * 137.5) % 360}, 70%, 60%)`
}

const chartConfig = {
  count: {
    label: 'Count',
  },
}

export function PriorityDistributionChart() {
  const [data, setData] = useState<PriorityDistributionData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQueue, setSelectedQueue] = useState<string>('all')
  const [queues, setQueues] = useState<Queue[]>([])

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
        
        if (selectedQueue && selectedQueue !== 'all') {
          params.append('queueId', selectedQueue)
        }

        const response = await fetch(`/api/analytics/priority-distribution?${params}`)
        if (response.ok) {
          const chartData = await response.json()
          // Sort by priority order (URGENT > HIGH > MEDIUM > LOW)
          const priorityOrder = ['URGENT', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
          const sortedData = chartData.sort((a: PriorityDistributionData, b: PriorityDistributionData) => {
            const aIndex = priorityOrder.indexOf(a.priority)
            const bIndex = priorityOrder.indexOf(b.priority)
            if (aIndex === -1 && bIndex === -1) return a.priority.localeCompare(b.priority)
            if (aIndex === -1) return 1
            if (bIndex === -1) return -1
            return aIndex - bIndex
          })
          setData(sortedData)
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedQueue])

  const handleExportCSV = () => {
    const csvContent = [
      ['Priority', 'Count', 'Percentage'],
      ...data.map(item => [item.priority, item.count.toString(), `${item.percentage}%`])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ticket-priority-distribution.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const chartData = data.map((item, index) => ({
    ...item,
    fill: getPriorityColor(item.priority, index),
  }))

  const totalTickets = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Ticket Distribution by Priority</CardTitle>
          <CardDescription>
            Current distribution of tickets across different priority levels
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2 px-6 py-4 sm:px-8 sm:py-6">
          <div className="flex gap-2">
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
            <BarChart
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="priority"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Priority
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {label}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Count
                            </span>
                            <span className="font-bold">
                              {data.count} tickets ({data.percentage}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
        
        {/* Summary */}
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold">{totalTickets}</div>
            <div className="text-muted-foreground">Total Tickets</div>
          </div>
          {chartData.map((item) => (
            <div key={item.priority} className="text-center">
              <div className="flex items-center justify-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: item.fill }}
                />
                <div className="font-semibold">{item.count}</div>
              </div>
              <div className="text-muted-foreground text-xs">
                {item.priority} ({item.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}