import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDefaultEmailTemplates } from '@/lib/email-template-service'
import { prisma } from '@/lib/prisma'

// POST - Initialize default email templates and type configurations
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Initialize templates and type configurations
    await createDefaultEmailTemplates()

    // Check how many email type configs were created/exist
    const emailTypeConfigs = await prisma.emailTypeConfig.findMany()
    
    const stats = {
      emailTypeConfigsCount: emailTypeConfigs.length,
      emailTypeConfigs: emailTypeConfigs.map(config => ({
        type: config.type,
        sectionsCount: JSON.parse(config.sections).length,
        hasActionButton: !!config.actionButton
      }))
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Default email templates and type configurations initialized successfully',
      stats
    })
  } catch (error) {
    console.error('Error initializing email templates:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}