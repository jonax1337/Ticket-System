import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EMAIL_TYPE_CONFIGS, generateEmailSections } from '@/lib/email-base-template'

interface RouteParams {
  params: Promise<{
    type: string
  }>
}

// POST - Reset specific email type configuration to default
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { type } = await params

    // Validate email type
    const validTypes = ['ticket_created', 'status_changed', 'comment_added', 'participant_added', 'automation_warning', 'automation_closed']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      )
    }

    console.log(`Resetting email type config to default: ${type}`)

    // Generate default sections for this type
    const defaultSections = generateEmailSections(type, {
      // Sample variables for generation
      ticketNumber: 'T-123456',
      ticketSubject: 'Sample Subject',
      ticketStatus: 'Open',
      ticketPriority: 'High',
      ticketCreatedAt: new Date().toLocaleString(),
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      systemName: 'Support System',
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString(),
      previousStatus: 'Open',
      newStatus: 'In Progress',
      actorName: 'Support Agent',
      commentContent: '<p>Sample comment content</p>',
      commentAuthor: 'Support Agent',
      commentCreatedAt: new Date().toLocaleString(),
      participantName: 'Team Member',
      participantEmail: 'team@example.com',
      participantType: 'cc'
    })

    // Get default config from EMAIL_TYPE_CONFIGS
    const defaultConfig = EMAIL_TYPE_CONFIGS[type] || {}

    // Reset the configuration to defaults
    const config = await prisma.emailTypeConfig.upsert({
      where: { type },
      update: {
        headerTitle: defaultConfig.headerTitle || '{{systemName}}',
        headerSubtitle: defaultConfig.headerSubtitle || 'Notification',
        headerColor: defaultConfig.headerColor || '#2563eb',
        greeting: defaultConfig.greeting || 'Hello {{customerName}},',
        introText: defaultConfig.introText || '',
        footerText: defaultConfig.footerText || 'Best regards,<br>{{systemName}} Team',
        sections: JSON.stringify(defaultSections),
        actionButton: null, // No action buttons (no self-service portal)
        updatedAt: new Date()
      },
      create: {
        type,
        headerTitle: defaultConfig.headerTitle || '{{systemName}}',
        headerSubtitle: defaultConfig.headerSubtitle || 'Notification',
        headerColor: defaultConfig.headerColor || '#2563eb',
        greeting: defaultConfig.greeting || 'Hello {{customerName}},',
        introText: defaultConfig.introText || '',
        footerText: defaultConfig.footerText || 'Best regards,<br>{{systemName}} Team',
        sections: JSON.stringify(defaultSections),
        actionButton: null
      }
    })
    
    console.log(`✅ Reset email type config: ${type} to defaults`)

    // Parse JSON fields for response
    const response = {
      ...config,
      sections: JSON.parse(config.sections),
      actionButton: config.actionButton ? JSON.parse(config.actionButton) : null
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error(`❌ Error resetting email type config for ${await params.then(p => p.type)}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}