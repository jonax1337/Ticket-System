import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if default statuses already exist
    const existingCount = await prisma.customStatus.count()
    if (existingCount > 0) {
      return NextResponse.json({ message: 'Default statuses already initialized' })
    }

    // Create default statuses
    const defaultStatuses = [
      {
        name: 'Open',
        icon: 'AlertCircle',
        color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
        order: 1,
        isDefault: true
      },
      {
        name: 'In Progress',
        icon: 'ArrowRight',
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
        order: 2,
        isDefault: true
      },
      {
        name: 'Closed',
        icon: 'CheckCircle2',
        color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
        order: 3,
        isDefault: true
      }
    ]

    await prisma.customStatus.createMany({
      data: defaultStatuses
    })

    return NextResponse.json({ message: 'Default statuses initialized successfully' })
  } catch (error) {
    console.error('Error initializing default statuses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}