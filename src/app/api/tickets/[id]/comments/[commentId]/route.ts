import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string, commentId: string }> }
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

    // Verify comment exists and belongs to the user
    const comment = await prisma.comment.findUnique({
      where: { id: params.commentId },
      include: {
        ticket: true
      }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if the comment belongs to the ticket
    if (comment.ticketId !== params.id) {
      return NextResponse.json(
        { error: 'Comment does not belong to this ticket' },
        { status: 400 }
      )
    }

    // Check if the user is the author of the comment or an admin
    if (comment.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You are not authorized to delete this comment' },
        { status: 403 }
      )
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: params.commentId }
    })

    return NextResponse.json(
      { message: 'Comment deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting the comment' },
      { status: 500 }
    )
  }
}
