import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const statuses = await prisma.customStatus.findMany({
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(statuses)
  } catch (error) {
    console.error('Error fetching custom statuses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, icon, color, order } = await request.json()

    if (!name || !icon || !color || order === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const status = await prisma.customStatus.create({
      data: {
        name,
        icon,
        color,
        order,
      }
    })

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error creating custom status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}