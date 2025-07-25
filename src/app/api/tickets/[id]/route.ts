import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { status, priority, assignedToId, fromName, fromEmail } = await request.json()

    const updateData: Record<string, unknown> = {}
    
    if (status) {
      updateData.status = status
    }
    
    if (priority) {
      updateData.priority = priority
    }
    
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId
    }
    
    if (fromName !== undefined) {
      updateData.fromName = fromName
    }
    
    if (fromEmail !== undefined) {
      updateData.fromEmail = fromEmail
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const params = await context.params

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Ticket update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}