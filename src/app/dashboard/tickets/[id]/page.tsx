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
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div>
      <TicketDetails 
        ticket={ticket} 
        users={users} 
        currentUser={session.user}
      />
    </div>
  )
}