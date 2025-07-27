import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EMAIL_TYPE_CONFIGS } from '@/lib/email-base-template'

// GET - Get all email type configurations
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all email type configurations
    const configs = await prisma.emailTypeConfig.findMany({
      orderBy: { type: 'asc' }
    })

    // If no configs exist, create defaults
    if (configs.length === 0) {
      const defaultConfigs = Object.entries(EMAIL_TYPE_CONFIGS).map(([type, config]) => ({
        type,
        headerTitle: config.headerTitle || '{{systemName}}',
        headerSubtitle: config.headerSubtitle || 'Notification', 
        headerColor: config.headerColor || '#2563eb',
        greeting: config.greeting || 'Hello {{customerName}},',
        introText: config.introText || '',
        footerText: config.footerText || 'Best regards,<br>{{systemName}} Support Team',
        sections: JSON.stringify([]),
        actionButton: JSON.stringify(null)
      }))

      await prisma.emailTypeConfig.createMany({
        data: defaultConfigs
      })

      // Fetch the newly created configs
      return NextResponse.json(await prisma.emailTypeConfig.findMany({
        orderBy: { type: 'asc' }
      }))
    }

    return NextResponse.json(configs)
  } catch (error) {
    console.error('Error fetching email type configurations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or update email type configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      type, 
      headerTitle, 
      headerSubtitle, 
      headerColor, 
      greeting, 
      introText, 
      footerText, 
      sections, 
      actionButton 
    } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      )
    }

    // Upsert the configuration
    const config = await prisma.emailTypeConfig.upsert({
      where: { type },
      update: {
        headerTitle: headerTitle || '{{systemName}}',
        headerSubtitle: headerSubtitle || 'Notification',
        headerColor: headerColor || '#2563eb',
        greeting: greeting || 'Hello {{customerName}},',
        introText: introText || '',
        footerText: footerText || 'Best regards,<br>{{systemName}} Support Team',
        sections: JSON.stringify(sections || []),
        actionButton: JSON.stringify(actionButton || null),
        updatedAt: new Date()
      },
      create: {
        type,
        headerTitle: headerTitle || '{{systemName}}',
        headerSubtitle: headerSubtitle || 'Notification',
        headerColor: headerColor || '#2563eb',
        greeting: greeting || 'Hello {{customerName}},',
        introText: introText || '',
        footerText: footerText || 'Best regards,<br>{{systemName}} Support Team',
        sections: JSON.stringify(sections || []),
        actionButton: JSON.stringify(actionButton || null)
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating email type configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}