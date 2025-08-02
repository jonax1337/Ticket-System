import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TicketDetails from '@/components/dashboard/ticket-details'

interface TicketPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) {
    notFound()
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
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
      attachments: true,
      participants: {
        orderBy: [
          { type: 'asc' }, // creator first, then cc, then added_manually
          { createdAt: 'asc' }
        ]
      },
      watchers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          attachments: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!ticket) {
    notFound()
  }

  // Include all comments - both internal (with user) and external email replies (without user but with fromEmail/fromName)
  const ticketWithAllComments = {
    ...ticket,
    comments: ticket.comments.map(comment => ({
      ...comment,
      type: comment.type as 'internal' | 'external' // Type assertion to match interface
    }))
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Get complete current user data with avatar information  
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  })

  if (!currentUser) {
    notFound()
  }

  return (
    <div>
      <TicketDetails 
        ticket={ticketWithAllComments} 
        users={users} 
        currentUser={currentUser}
        session={session}
      />
    </div>
  )
}