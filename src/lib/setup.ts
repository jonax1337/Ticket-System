import { prisma } from './prisma'

export async function isSetupComplete(): Promise<boolean> {
  try {
    const setupStatus = await prisma.setupStatus.findUnique({
      where: { id: 'setup' }
    })
    return setupStatus?.isCompleted ?? false
  } catch {
    return false
  }
}

export async function markSetupComplete(): Promise<void> {
  await prisma.setupStatus.upsert({
    where: { id: 'setup' },
    update: {
      isCompleted: true,
      completedAt: new Date()
    },
    create: {
      id: 'setup',
      isCompleted: true,
      completedAt: new Date()
    }
  })
}