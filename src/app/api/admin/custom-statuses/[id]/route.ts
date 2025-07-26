import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, icon, color, order } = await request.json()

    const status = await prisma.customStatus.update({
      where: { id },
      data: {
        name,
        icon,
        color,
        order,
      }
    })

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error updating custom status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if this is a default status
    const status = await prisma.customStatus.findUnique({
      where: { id }
    })

    if (status?.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default status' }, { status: 400 })
    }

    await prisma.customStatus.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Status deleted successfully' })
  } catch (error) {
    console.error('Error deleting custom status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}