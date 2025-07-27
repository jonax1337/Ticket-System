import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTemplatedEmail } from '@/lib/email-service'

export async function GET(
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

    // Get participants
    const participants = await prisma.ticketParticipant.findMany({
      where: { ticketId: params.id },
      orderBy: [
        { type: 'asc' }, // creator first, then cc, then added_manually
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json(participants)
  } catch (error) {
    console.error('Participants fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const body = await request.json()
    const { email, name, type } = body

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Normalize email for consistent storage
    const normalizedEmail = email.trim().toLowerCase()

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Check if participant already exists
    const existingParticipant = await prisma.ticketParticipant.findUnique({
      where: {
        ticketId_email: {
          ticketId: params.id,
          email: normalizedEmail
        }
      }
    })

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Participant already exists' },
        { status: 409 }
      )
    }

    // Create participant
    const participant = await prisma.ticketParticipant.create({
      data: {
        ticketId: params.id,
        email: normalizedEmail,
        name: name?.trim() || email.trim(),
        type: type || 'added_manually'
      }
    })

    // Send participant notification using template
    try {
      await sendTemplatedEmail({
        templateType: 'participant_added',
        to: normalizedEmail,
        toName: name?.trim() || email.trim(),
        ticketId: params.id,
        variables: {
          participantName: name?.trim() || email.trim(),
          participantEmail: normalizedEmail,
          participantType: type || 'Added manually',
          actorName: session.user.name,
          actorEmail: session.user.email
        }
      })
      console.log(`Participant notification sent to ${normalizedEmail}`)
    } catch (emailError) {
      console.error('Error sending participant notification:', emailError)
      // Don't fail the main request if email sending fails
    }

    return NextResponse.json(participant)
  } catch (error) {
    console.error('Participant creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}