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

    // Check if default priorities already exist
    const existingCount = await prisma.customPriority.count()
    if (existingCount > 0) {
      return NextResponse.json({ message: 'Default priorities already initialized' })
    }

    // Create default priorities
    const defaultPriorities = [
      {
        name: 'Low',
        icon: 'Clock',
        color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
        order: 1,
        isDefault: true
      },
      {
        name: 'Medium',
        icon: 'Timer',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
        order: 2,
        isDefault: true
      },
      {
        name: 'High',
        icon: 'AlertCircle',
        color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
        order: 3,
        isDefault: true
      },
      {
        name: 'Urgent',
        icon: 'AlertTriangle',
        color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
        order: 4,
        isDefault: true
      }
    ]

    await prisma.customPriority.createMany({
      data: defaultPriorities
    })

    return NextResponse.json({ message: 'Default priorities initialized successfully' })
  } catch (error) {
    console.error('Error initializing default priorities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}