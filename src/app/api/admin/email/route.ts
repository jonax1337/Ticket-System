import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emailCronManager } from '@/lib/email-cron'
import { z } from 'zod'

const emailConfigSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().min(1).max(65535),
  username: z.string().min(1),
  password: z.string().min(1),
  useSSL: z.boolean(),
  folder: z.string().min(1),
  isActive: z.boolean(),
  syncInterval: z.number().min(60),
  emailAction: z.enum(['mark_read', 'delete', 'move_to_folder']),
  moveToFolder: z.string().nullable(),
  processOnlyUnread: z.boolean(),
  subjectFilter: z.string().nullable(),
  fromFilter: z.string().nullable(),
  defaultPriority: z.string().nullable(),
  defaultStatus: z.string().nullable(),
  defaultAssigneeId: z.string().nullable(),
  enableAutoSync: z.boolean(),
})

// GET - List all email configurations
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const configs = await prisma.emailConfiguration.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(configs)
  } catch (error) {
    console.error('Error fetching email configurations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email configurations' },
      { status: 500 }
    )
  }
}

// POST - Create new email configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = emailConfigSchema.parse(body)

    // In a real application, encrypt the password
    const encryptedPassword = validatedData.password // TODO: Implement proper encryption

    const config = await prisma.emailConfiguration.create({
      data: {
        ...validatedData,
        password: encryptedPassword,
      }
    })

    // Restart email cron manager to pick up changes
    await emailCronManager.onConfigChanged()

    return NextResponse.json(config)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error creating email configuration:', error)
    return NextResponse.json(
      { error: 'Failed to create email configuration' },
      { status: 500 }
    )
  }
}