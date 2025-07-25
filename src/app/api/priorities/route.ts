import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const priorities = await prisma.customPriority.findMany({
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(priorities)
  } catch (error) {
    console.error('Error fetching priorities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}