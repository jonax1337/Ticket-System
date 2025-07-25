import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for inbox configuration validation
const inboxConfigSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  host: z.string().min(1, 'IMAP Server ist erforderlich'),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1, 'Benutzername ist erforderlich'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
  useSSL: z.boolean(),
  folder: z.string().min(1, 'Ordner ist erforderlich'),
  isActive: z.boolean(),
  syncInterval: z.number().int().min(60), // Minimum 1 minute
  markAsRead: z.boolean(),
  deleteAfterImport: z.boolean(),
  defaultPriority: z.string().nullable(),
  defaultStatus: z.string().nullable(),
  defaultAssigneeId: z.string().nullable(),
})

// PUT - Update inbox configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = inboxConfigSchema.parse(body)

    // Encrypt password (in a real application, use proper encryption)
    const encryptedPassword = validatedData.password // TODO: Implement proper encryption

    const inbox = await prisma.inboxConfiguration.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        password: encryptedPassword,
      }
    })

    return NextResponse.json(inbox)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating inbox configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update inbox configuration' },
      { status: 500 }
    )
  }
}

// DELETE - Delete inbox configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.inboxConfiguration.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inbox configuration:', error)
    return NextResponse.json(
      { error: 'Failed to delete inbox configuration' },
      { status: 500 }
    )
  }
}
