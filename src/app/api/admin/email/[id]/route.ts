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
  isOutbound: z.boolean(),
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

// Schema for partial updates (used for outbound toggle)
const emailConfigPartialSchema = z.object({
  name: z.string().min(1).optional(),
  host: z.string().min(1).optional(),
  port: z.number().min(1).max(65535).optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  useSSL: z.boolean().optional(),
  folder: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  isOutbound: z.boolean().optional(),
  syncInterval: z.number().min(60).optional(),
  emailAction: z.enum(['mark_read', 'delete', 'move_to_folder']).optional(),
  moveToFolder: z.string().nullable().optional(),
  processOnlyUnread: z.boolean().optional(),
  subjectFilter: z.string().nullable().optional(),
  fromFilter: z.string().nullable().optional(),
  defaultPriority: z.string().nullable().optional(),
  defaultStatus: z.string().nullable().optional(),
  defaultAssigneeId: z.string().nullable().optional(),
  enableAutoSync: z.boolean().optional(),
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
    
    // Check if this is a partial update (only contains some fields)
    const isPartialUpdate = Object.keys(body).length < 10 // Arbitrary threshold for partial vs full update
    
    // Validate input - use partial schema for small updates
    const validatedData = isPartialUpdate 
      ? emailConfigPartialSchema.parse(body)
      : emailConfigSchema.parse(body)

    // If this configuration is marked as outbound, unset all other outbound configurations
    if (validatedData.isOutbound === true) {
      await prisma.emailConfiguration.updateMany({
        where: { 
          isOutbound: true,
          id: { not: resolvedParams.id } // Don't update the current one being edited
        },
        data: { isOutbound: false }
      })
    }

    // For partial updates, only update provided fields
    const updateData: any = { ...validatedData }
    
    // Only encrypt password if it's provided (full update)
    if (validatedData.password) {
      updateData.password = validatedData.password // TODO: Implement proper encryption
    }

    const config = await prisma.emailConfiguration.update({
      where: { id: resolvedParams.id },
      data: updateData
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