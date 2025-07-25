import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const statuses = await prisma.customStatus.findMany({
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(statuses)
  } catch (error) {
    console.error('Error fetching statuses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}