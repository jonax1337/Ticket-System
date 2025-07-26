import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const params = await context.params

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Get participant to check type
    const participant = await prisma.ticketParticipant.findUnique({
      where: { id: params.participantId }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    // Only allow removal of manually added participants and those added via reply
    if (participant.type !== 'added_manually' && participant.type !== 'added_via_reply') {
      return NextResponse.json(
        { error: 'Cannot remove creator or CC participants' },
        { status: 403 }
      )
    }

    // Delete participant
    await prisma.ticketParticipant.delete({
      where: { id: params.participantId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Participant deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}