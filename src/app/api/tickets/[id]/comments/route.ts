import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

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

    // Verify ticket exists and get assignment info
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const content = formData.get('content') as string
    const type = formData.get('type') as string || 'internal'
    const fileCount = parseInt(formData.get('fileCount') as string || '0')

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Create comment first
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        ticketId: params.id,
        userId: session.user.id,
        type: type,
      },
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
    })

    // Handle file uploads
    const attachments = []
    for (let i = 0; i < fileCount; i++) {
      const file = formData.get(`file_${i}`) as File
      if (file && file.size > 0) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: `File ${file.name} is too large. Maximum size is 10MB.` },
            { status: 400 }
          )
        }

        // Generate unique filename
        const fileExtension = file.name.split('.').pop()
        const uniqueFilename = `${uuidv4()}.${fileExtension}`
        
        // Create upload path
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'attachments')
        await mkdir(uploadDir, { recursive: true })
        
        const filePath = join(uploadDir, uniqueFilename)
        const relativePath = `/uploads/attachments/${uniqueFilename}`

        // Save file
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        // Save attachment to database
        const attachment = await prisma.commentAttachment.create({
          data: {
            filename: file.name,
            filepath: relativePath,
            mimetype: file.type,
            size: file.size,
            commentId: comment.id,
          },
        })

        attachments.push(attachment)
      }
    }

    // Create notification for assigned user (if different from comment author)
    if (ticket.assignedTo && ticket.assignedTo.id !== session.user.id) {
      try {
        const displayTicketNumber = ticket.ticketNumber || `#${params.id.slice(-6).toUpperCase()}`
        
        await prisma.notification.create({
          data: {
            type: 'comment_added',
            title: 'New Comment',
            message: `A new comment was added to your ticket ${displayTicketNumber}: ${ticket.subject}`,
            userId: ticket.assignedTo.id,
            actorId: session.user.id,
            ticketId: params.id,
            commentId: comment.id,
          }
        })
      } catch (notificationError) {
        console.error('Error creating comment notification:', notificationError)
        // Don't fail the main request if notifications fail
      }
    }

    // Return comment with attachments
    const commentWithAttachments = await prisma.comment.findUnique({
      where: { id: comment.id },
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
    })

    return NextResponse.json(commentWithAttachments)
  } catch (error) {
    console.error('Comment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}