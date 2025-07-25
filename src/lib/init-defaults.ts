import { prisma } from './prisma'

export async function initializeDefaultStatuses() {
  const existingCount = await prisma.customStatus.count()
  if (existingCount > 0) {
    return
  }

  const defaultStatuses = [
    {
      name: 'OPEN',
      icon: 'AlertCircle',
      color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
      order: 1,
      isDefault: true
    },
    {
      name: 'IN_PROGRESS',
      icon: 'ArrowRight',
      color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      order: 2,
      isDefault: true
    },
    {
      name: 'CLOSED',
      icon: 'CheckCircle2',
      color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      order: 3,
      isDefault: true
    }
  ]

  await prisma.customStatus.createMany({
    data: defaultStatuses
  })
}

export async function initializeDefaultPriorities() {
  const existingCount = await prisma.customPriority.count()
  if (existingCount > 0) {
    return
  }

  const defaultPriorities = [
    {
      name: 'LOW',
      icon: 'Clock',
      color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
      order: 1,
      isDefault: true
    },
    {
      name: 'MEDIUM',
      icon: 'Timer',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
      order: 2,
      isDefault: true
    },
    {
      name: 'HIGH',
      icon: 'AlertCircle',
      color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
      order: 3,
      isDefault: true
    },
    {
      name: 'URGENT',
      icon: 'AlertTriangle',
      color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      order: 4,
      isDefault: true
    }
  ]

  await prisma.customPriority.createMany({
    data: defaultPriorities
  })
}