import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EMAIL_TYPE_CONFIGS, generateEmailSections, generateActionButton } from '@/lib/email-base-template'

interface RouteParams {
  params: Promise<{
    type: string
  }>
}

// GET - Get specific email type configuration
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { type } = await params

    // Get configuration for specific type
    let config = await prisma.emailTypeConfig.findUnique({
      where: { type }
    })

    // If config doesn't exist, create it with defaults
    if (!config) {
      const defaultConfig = EMAIL_TYPE_CONFIGS[type] || {}
      const defaultSections = generateEmailSections(type, {})
      const defaultActionButton = generateActionButton(type, { ticketUrl: '#' })

      config = await prisma.emailTypeConfig.create({
        data: {
          type,
          headerTitle: defaultConfig.headerTitle || '{{systemName}}',
          headerSubtitle: defaultConfig.headerSubtitle || 'Notification',
          headerColor: defaultConfig.headerColor || '#2563eb',
          greeting: defaultConfig.greeting || 'Hello {{customerName}},',
          introText: defaultConfig.introText || '',
          footerText: defaultConfig.footerText || 'Best regards,<br>{{systemName}} Support Team',
          sections: JSON.stringify(defaultSections),
          actionButton: JSON.stringify(defaultActionButton)
        }
      })
    }

    // Parse JSON fields
    const response = {
      ...config,
      sections: JSON.parse(config.sections),
      actionButton: config.actionButton ? JSON.parse(config.actionButton) : null
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching email type configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update specific email type configuration
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { type } = await params
    const body = await request.json()
    const { 
      headerTitle, 
      headerSubtitle, 
      headerColor, 
      greeting, 
      introText, 
      footerText, 
      sections, 
      actionButton 
    } = body

    // Update the configuration
    const config = await prisma.emailTypeConfig.upsert({
      where: { type },
      update: {
        headerTitle,
        headerSubtitle,
        headerColor,
        greeting,
        introText,
        footerText,
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

    // Parse JSON fields for response
    const response = {
      ...config,
      sections: JSON.parse(config.sections),
      actionButton: config.actionButton ? JSON.parse(config.actionButton) : null
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating email type configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}