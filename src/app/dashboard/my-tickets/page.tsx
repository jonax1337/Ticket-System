import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Suspense } from 'react'
import TicketsList from '@/components/dashboard/tickets-list'
import MyTicketFilters from '@/components/dashboard/my-ticket-filters'
import { User, Clock } from 'lucide-react'

interface SearchParams {
  search?: string
  status?: string
  priority?: string
  queue?: string
  page?: string
}

interface MyTicketsPageProps {
  searchParams: Promise<SearchParams>
}

async function getMyTickets(userId: string, searchParams: SearchParams) {
  const search = searchParams.search || ''
  const status = searchParams.status || 'ALL'
  const priority = searchParams.priority || 'ALL'
  const queue = searchParams.queue || 'ALL'
  const page = parseInt(searchParams.page || '1')
  const limit = 10
  const offset = (page - 1) * limit

  // Get user's session to check role
  const session = await getServerSession(authOptions)
  
  // Get user's assigned queues for access control
  let userQueueIds: string[] = []
  if (session?.user?.role !== 'ADMIN') {
    const userQueues = await prisma.userQueue.findMany({
      where: { userId },
      select: { queueId: true }
    })
    userQueueIds = userQueues.map(uq => uq.queueId)
    
    // If user is not assigned to any queues, they see no tickets
    if (userQueueIds.length === 0) {
      userQueueIds = ['no-access'] // This will match no tickets
    }
  }

  // Build where clause
  const where: Record<string, unknown> = {
    assignedToId: userId, // Only tickets assigned to current user
    // Add queue access control for non-admin users
    ...(session?.user?.role !== 'ADMIN' && userQueueIds[0] !== 'no-access' && {
      OR: [
        { queueId: { in: userQueueIds } },
        { queueId: null } // Allow tickets with no queue for now
      ]
    }),
    // If user has no queue access, show nothing
    ...(session?.user?.role !== 'ADMIN' && userQueueIds[0] === 'no-access' && {
      id: 'no-access'
    }),
  }

  // Add search filter
  if (search) {
    const words = search.trim().split(/\s+/).filter(word => word.length > 0)
    if (words.length > 1) {
      where.AND = words.map(word => ({
        OR: [
          { subject: { contains: word } },
          { description: { contains: word } },
          { fromEmail: { contains: word } },
          { fromName: { contains: word } },
          { ticketNumber: { contains: word } },
        ]
      }))
    } else if (words.length === 1) {
      where.OR = [
        { subject: { contains: words[0] } },
        { description: { contains: words[0] } },
        { fromEmail: { contains: words[0] } },
        { fromName: { contains: words[0] } },
        { ticketNumber: { contains: words[0] } },
      ]
    }
  }

  // Add status filter
  if (status !== 'ALL') {
    where.status = status
  }

  // Add priority filter
  if (priority !== 'ALL') {
    where.priority = priority
  }

  // Add queue filter
  if (queue !== 'ALL') {
    where.queueId = queue
  }

  const [tickets, totalCount] = await Promise.all([
    prisma.ticket.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.ticket.count({ where }),
  ])

  return {
    tickets,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  }
}

export default async function MyTicketsPage({ searchParams }: MyTicketsPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Await searchParams as it's now a Promise in Next.js 15
  const resolvedSearchParams = await searchParams

  const { tickets, totalCount, totalPages, currentPage } = await getMyTickets(
    session.user.id,
    resolvedSearchParams
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
          <p className="text-muted-foreground">
            Tickets assigned to you
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{totalCount} tickets assigned</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Suspense fallback={<div>Loading filters...</div>}>
          <MyTicketFilters />
        </Suspense>
        
        <Suspense fallback={<div>Loading tickets...</div>}>
          <TicketsList tickets={tickets} />
        </Suspense>
      </div>
    </div>
  )
}