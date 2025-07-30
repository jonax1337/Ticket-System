import { prisma } from '@/lib/prisma'
import TicketsList from '@/components/dashboard/tickets-list'
import TicketFilters from '@/components/dashboard/ticket-filters'
import { CreateTicketDialog } from '@/components/dashboard/create-ticket-dialog'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CollapsibleAnalytics } from '@/components/dashboard/collapsible-analytics'

interface DashboardPageProps {
  searchParams: Promise<{
    status?: string
    priority?: string
    search?: string
    assigned?: string
    queue?: string
    page?: string
    limit?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const { status, priority, search, queue } = params
  const assigned = params.assigned || 'UNASSIGNED'
  
  // Pagination parameters
  const page = Math.max(1, parseInt(params.page || '1'))
  const limit = Math.min(50, Math.max(10, parseInt(params.limit || '20'))) // Max 50, min 10, default 20
  const skip = (page - 1) * limit
  
  // Get session to check if user is admin
  const session = await getServerSession(authOptions)

  // Get user's assigned queues + default queues for access control
  let userQueueIds: string[] = []
  if (session?.user?.role !== 'ADMIN') {
    // Get explicitly assigned queues
    const userQueues = await prisma.userQueue.findMany({
      where: { userId: session?.user?.id },
      select: { queueId: true }
    })
    const assignedQueueIds = userQueues.map(uq => uq.queueId)
    
    // Get all default queues (automatically accessible to all users)
    const defaultQueues = await prisma.queue.findMany({
      where: { isDefault: true },
      select: { id: true }
    })
    const defaultQueueIds = defaultQueues.map(q => q.id)
    
    // Combine assigned and default queues
    userQueueIds = [...new Set([...assignedQueueIds, ...defaultQueueIds])]
    
    // If user has no access to any queues, they see no tickets
    if (userQueueIds.length === 0) {
      userQueueIds = ['__NO_ACCESS__'] // Semantic identifier that will never match real queue IDs
    }
  }

  const where = {
    ...(status && { status }),
    ...(priority && { priority }),
    ...(queue && { queueId: queue }),
    // Add queue access control for non-admin users
    ...(session?.user?.role !== 'ADMIN' && userQueueIds[0] !== 'no-access' && {
      queueId: { in: userQueueIds } // Remove null queue access for non-admin users
    }),
    // If user has no queue access, show nothing
    ...(session?.user?.role !== 'ADMIN' && userQueueIds[0] === 'no-access' && {
      id: 'no-access'
    }),
    ...(search && (() => {
      // Sanitize search input to prevent SQL injection
      const sanitizedSearch = search.trim().replace(/[%_\\]/g, '\\$&').substring(0, 100)
      const words = sanitizedSearch.split(/\s+/).filter(word => word.length > 0 && word.length >= 2)
      
      if (words.length === 0) return {}
      
      if (words.length > 1) {
        // Multiple words: all words must be found (AND logic)
        return {
          AND: words.map(word => ({
            OR: [
              { subject: { contains: word, mode: 'insensitive' } },
              { description: { contains: word, mode: 'insensitive' } },
              { fromEmail: { contains: word, mode: 'insensitive' } },
              { fromName: { contains: word, mode: 'insensitive' } },
              { ticketNumber: { contains: word, mode: 'insensitive' } },
            ]
          }))
        }
      } else {
        // Single word: simple OR search
        const word = words[0]
        return {
          OR: [
            { subject: { contains: word, mode: 'insensitive' } },
            { description: { contains: word, mode: 'insensitive' } },
            { fromEmail: { contains: word, mode: 'insensitive' } },
            { fromName: { contains: word, mode: 'insensitive' } },
            { ticketNumber: { contains: word, mode: 'insensitive' } },
          ]
        }
      }
    })()),
    // Only add assignment filter if not 'ALL'
    ...(assigned === 'UNASSIGNED' ? { assignedToId: null } : {}),
    ...(assigned && assigned !== 'ALL' && assigned !== 'UNASSIGNED' ? { assignedToId: assigned } : {}),
  }

  // Get total count for pagination
  const totalCount = await prisma.ticket.count({ where })

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      queue: {
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
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
    skip,
    take: limit,
  })

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  // Calculate stats - no queue access control for analytics/stats
  // Stats should show data from all tickets regardless of queue permissions
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

      {/* Collapsible Analytics */}
      <CollapsibleAnalytics />

      <div className="space-y-4">
        <TicketFilters />
        <TicketsList 
          tickets={tickets} 
          isAdmin={session?.user?.role === 'ADMIN'}
          pagination={{
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage,
            hasPrevPage,
            limit
          }}
        />
      </div>
    </div>
  )
}