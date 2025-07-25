import { prisma } from '@/lib/prisma'
import TicketsList from '@/components/dashboard/tickets-list'
import TicketFilters from '@/components/dashboard/ticket-filters'
import { CreateTicketDialog } from '@/components/dashboard/create-ticket-dialog'
// Removed enum imports - now using dynamic string values
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DashboardPageProps {
  searchParams: Promise<{
    status?: string
    priority?: string
    search?: string
    assigned?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const { status, priority, search } = params
  const assigned = params.assigned || 'UNASSIGNED'

  const where = {
    ...(status && { status }),
    ...(priority && { priority }),
    ...(search && (() => {
      const words = search.trim().split(/\s+/).filter(word => word.length > 0)
      
      if (words.length > 1) {
        // Multiple words: all words must be found (AND logic)
        return {
          AND: words.map(word => ({
            OR: [
              { subject: { contains: word } },
              { description: { contains: word } },
              { fromEmail: { contains: word } },
              { fromName: { contains: word } },
            ]
          }))
        }
      } else {
        // Single word: simple OR search
        return {
          OR: [
            { subject: { contains: search } },
            { description: { contains: search } },
            { fromEmail: { contains: search } },
            { fromName: { contains: search } },
          ]
        }
      }
    })()),
    // Only add assignment filter if not 'ALL'
    ...(assigned === 'UNASSIGNED' ? { assignedToId: null } : {}),
    ...(assigned && assigned !== 'ALL' && assigned !== 'UNASSIGNED' ? { assignedToId: assigned } : {}),
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      comments: {
        select: {
          id: true,
        },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  const stats = {
    total: await prisma.ticket.count(),
    open: await prisma.ticket.count({ where: { status: 'OPEN' } }),
    inProgress: await prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
    closed: await prisma.ticket.count({ where: { status: 'CLOSED' } }),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Manage and track all support tickets
          </p>
        </div>
        <CreateTicketDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{stats.open}</div>
              <Badge variant="outline" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                Open
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                Processing
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{stats.closed}</div>
              <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                Done
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <TicketFilters />
        <TicketsList tickets={tickets} />
      </div>
    </div>
  )
}