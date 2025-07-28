"use client"

import { useState, useEffect } from 'react'
import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from 'recharts'
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

interface StatusDistributionData {
  status: string
  count: number
  percentage: number
}

interface Queue {
  id: string
  name: string
  color: string
}

// Define colors for different statuses
const statusColors: Record<string, string> = {
  'OPEN': '#ff6b6b',
  'IN_PROGRESS': '#4dabf7',
  'CLOSED': '#51cf66',
  'PENDING': '#ffd43b',
  'RESOLVED': '#69db7c',
}

const getStatusColor = (status: string, index: number) => {
  return statusColors[status] || `hsl(${(index * 137.5) % 360}, 70%, 60%)`
}

export function StatusDistributionChart() {
  const [data, setData] = useState<StatusDistributionData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQueue, setSelectedQueue] = useState<string>('')
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
        
        if (selectedQueue) {
          params.append('queueId', selectedQueue)
        }

        const response = await fetch(`/api/analytics/status-distribution?${params}`)
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
  }, [selectedQueue])

  const handleExportCSV = () => {
    const csvContent = [
      ['Status', 'Count', 'Percentage'],
      ...data.map(item => [item.status, item.count.toString(), `${item.percentage}%`])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ticket-status-distribution.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const chartData = data.map((item, index) => ({
    ...item,
    fill: getStatusColor(item.status, index),
  }))

  const totalTickets = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Ticket Distribution by Status</CardTitle>
          <CardDescription>
            Current distribution of tickets across different status categories
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2 px-6 py-4 sm:px-8 sm:py-6">
          <div className="flex gap-2">
            <Select value={selectedQueue} onValueChange={setSelectedQueue}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All queues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All queues</SelectItem>
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
      <CardContent className="flex-1 pb-0">
        {loading ? (
          <div className="h-[300px] w-full flex items-center justify-center">
            <Skeleton className="h-[250px] w-[250px] rounded-full" />
          </div>
        ) : (
          <div className="mx-auto aspect-square max-h-[300px]">
            <ChartContainer
              config={{}}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Status
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {data.status}
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
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  outerRadius={100}
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            
            {/* Custom Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
              {chartData.map((entry, index) => (
                <div key={entry.status} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-muted-foreground">
                    {entry.status} ({entry.count})
                  </span>
                </div>
              ))}
            </div>
            
            {/* Total in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalTickets}</div>
                <div className="text-sm text-muted-foreground">Total Tickets</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}