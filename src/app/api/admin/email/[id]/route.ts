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

// GET - Get specific email configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const config = await prisma.emailConfiguration.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!config) {
      return NextResponse.json({ error: 'Email configuration not found' }, { status: 404 })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching email configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email configuration' },
      { status: 500 }
    )
  }
}

// PUT - Update email configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const body = await request.json()
    
    // Validate input
    const validatedData = emailConfigSchema.parse(body)

    // In a real application, encrypt the password
    const encryptedPassword = validatedData.password // TODO: Implement proper encryption

    const config = await prisma.emailConfiguration.update({
      where: { id: resolvedParams.id },
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
    
    console.error('Error updating email configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update email configuration' },
      { status: 500 }
    )
  }
}

// DELETE - Delete email configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    await prisma.emailConfiguration.delete({
      where: { id: resolvedParams.id }
    })

    // Restart email cron manager to pick up changes
    await emailCronManager.onConfigChanged()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting email configuration:', error)
    return NextResponse.json(
      { error: 'Failed to delete email configuration' },
      { status: 500 }
    )
  }
}