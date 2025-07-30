import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDefaultEmailTemplates } from '@/lib/email-template-service'
import { prisma } from '@/lib/prisma'

// POST - Initialize default email templates and type configurations
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if force reinit is requested
    const body = await request.json().catch(() => ({}))
    const forceReinit = body.forceReinit === true

    if (forceReinit) {
      console.log('[EMAIL_INIT] Force reinitializing email configurations with new defaults...')
      
      // Delete existing configurations to force recreation with new defaults
      await prisma.emailTypeConfig.deleteMany({})
      console.log('[EMAIL_INIT] Deleted existing email type configurations')
    }

    // Initialize templates and type configurations
    await createDefaultEmailTemplates()

    // Check how many email type configs were created/exist
    const emailTypeConfigs = await prisma.emailTypeConfig.findMany()
    
    const stats = {
      emailTypeConfigsCount: emailTypeConfigs.length,
      forceReinit,
      emailTypeConfigs: emailTypeConfigs.map(config => ({
        type: config.type,
        sectionsCount: JSON.parse(config.sections).length,
        hasActionButton: !!config.actionButton,
        headerTitle: config.headerTitle,
        footerText: config.footerText
      }))
    }

    return NextResponse.json({ 
      success: true, 
      message: forceReinit 
        ? 'Email templates and type configurations force reinitialized with new defaults'
        : 'Default email templates and type configurations initialized successfully',
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