import { TicketVolumeChart } from '@/components/dashboard/charts/ticket-volume-chart'
import { StatusDistributionChart } from '@/components/dashboard/charts/status-distribution-chart'
import { PriorityDistributionChart } from '@/components/dashboard/charts/priority-distribution-chart'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Track and analyze ticket metrics with interactive visualizations
        </p>
      </div>

      <div className="space-y-6">
        {/* Primary Chart - Ticket Volume Over Time */}
        <TicketVolumeChart />
        
        {/* Secondary Charts - Distribution Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <StatusDistributionChart />
          <PriorityDistributionChart />
        </div>
      </div>
    </div>
  )
}