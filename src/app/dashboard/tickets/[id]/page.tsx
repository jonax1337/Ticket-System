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
      attachments: true,
      participants: {
        orderBy: [
          { type: 'asc' }, // creator first, then cc, then added_manually
          { createdAt: 'asc' }
        ]
      },
      comments: {
        where: {
          userId: {
            not: null
          }
        },
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

  // Filter comments with null users and create type-safe ticket object
  const ticketWithValidComments = {
    ...ticket,
    comments: ticket.comments.filter((comment): comment is typeof comment & { user: NonNullable<typeof comment.user> } => 
      comment.user !== null
    )
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

  return (
    <div>
      <TicketDetails 
        ticket={ticketWithValidComments} 
        users={users} 
        currentUser={session.user}
      />
    </div>
  )
}