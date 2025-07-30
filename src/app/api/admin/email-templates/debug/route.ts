import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { renderEmailTemplate, EmailTemplateType, getEmailTemplate } from '@/lib/email-template-service'
import { prisma } from '@/lib/prisma'

// POST - Comprehensive debugging for email template system
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
    const { type, variables, ticketId } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Email template type is required' },
        { status: 400 }
      )
    }

    console.log(`\n==================== EMAIL TEMPLATE DEBUG SESSION ====================`)
    console.log(`Type: ${type}`)
    console.log(`Timestamp: ${new Date().toISOString()}`)
    console.log(`===================================================================\n`)

    // Get comprehensive debugging information
    const debugInfo: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      type,
      requestedVariables: variables,
      ticketId
    }

    // 1. Check database state
    console.log(`[DEBUG STEP 1] Checking database state...`)
    
    // Check if EmailTypeConfig exists
    const emailTypeConfig = await prisma.emailTypeConfig.findUnique({
      where: { type }
    })
    
    debugInfo.emailTypeConfig = {
      exists: !!emailTypeConfig,
      data: emailTypeConfig,
      sectionsRaw: emailTypeConfig?.sections,
      actionButtonRaw: emailTypeConfig?.actionButton
    }

    if (emailTypeConfig) {
      try {
        debugInfo.emailTypeConfig.sectionsParsed = JSON.parse(emailTypeConfig.sections)
        debugInfo.emailTypeConfig.sectionsCount = JSON.parse(emailTypeConfig.sections).length
      } catch (e) {
        debugInfo.emailTypeConfig.sectionsParseError = e instanceof Error ? e.message : 'Unknown error'
      }

      if (emailTypeConfig.actionButton) {
        try {
          debugInfo.emailTypeConfig.actionButtonParsed = JSON.parse(emailTypeConfig.actionButton)
        } catch (e) {
          debugInfo.emailTypeConfig.actionButtonParseError = e instanceof Error ? e.message : 'Unknown error'
        }
      }
    }

    // Check email template
    const template = await getEmailTemplate(type as EmailTemplateType)
    debugInfo.emailTemplate = {
      exists: !!template,
      data: template
    }

    // Check system settings
    const systemSettings = await prisma.systemSettings.findFirst()
    debugInfo.systemSettings = systemSettings

    console.log(`[DEBUG STEP 1] Database state:`)
    console.log(`- EmailTypeConfig exists: ${!!emailTypeConfig}`)
    console.log(`- Email template exists: ${!!template}`)
    console.log(`- System settings exists: ${!!systemSettings}`)

    // 2. Test variables preparation
    console.log(`\n[DEBUG STEP 2] Preparing test variables...`)
    
    const defaultVariables = {
      systemName: 'IT Support',
      customerName: 'Jonas Laux',
      ticketNumber: 'IT-UHMRGA',
      ticketSubject: 'Test',
      ticketStatus: 'Checking',
      ticketPriority: 'Medium',
      ticketCreatedAt: new Date().toLocaleString(),
      ticketUpdatedAt: new Date().toLocaleString(),
      ticketUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tickets/${ticketId || 'cmdo90it7000pknmgucsvnryj'}`,
      supportEmail: 'support@example.com',
      assignedToName: 'Support Agent',
      actorName: 'Jonas Laux',
      commentAuthor: 'Jonas Laux',
      commentContent: '[EMAIL] Test',
      commentCreatedAt: '30.7.2025, 09:42:36',
      participantName: 'Jane Smith',
      participantEmail: 'jane@example.com',
      participantType: 'added_manually',
      previousStatus: 'Open',
      newStatus: 'In Progress',
      statusChangeReason: 'Agent started working on the issue',
      ...variables
    }

    debugInfo.finalVariables = defaultVariables

    console.log(`[DEBUG STEP 2] Variables prepared with ${Object.keys(defaultVariables).length} properties`)

    // 3. Render template with full debugging
    console.log(`\n[DEBUG STEP 3] Rendering email template with debug mode enabled...`)
    
    const renderedTemplate = await renderEmailTemplate(type as EmailTemplateType, defaultVariables, true)
    
    debugInfo.renderResult = {
      success: !!renderedTemplate,
      template: renderedTemplate
    }

    if (!renderedTemplate) {
      console.log(`[DEBUG STEP 3] FAILED - No template rendered`)
      debugInfo.renderResult.error = 'Template rendering failed'
    } else {
      console.log(`[DEBUG STEP 3] SUCCESS - Template rendered`)
      console.log(`- Subject: ${renderedTemplate.subject}`)
      console.log(`- HTML Content length: ${renderedTemplate.htmlContent.length}`)
      console.log(`- Text Content length: ${renderedTemplate.textContent?.length || 0}`)
    }

    // 4. Check what happens in a real email scenario
    console.log(`\n[DEBUG STEP 4] Testing real email scenario...`)
    
    let realEmailTest = null
    
    if (ticketId) {
      try {
        // Get actual ticket data
        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketId },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        if (ticket) {
          const realVariables = {
            ticketNumber: ticket.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`,
            ticketSubject: ticket.subject,
            ticketDescription: ticket.description,
            ticketStatus: ticket.status,
            ticketPriority: ticket.priority,
            ticketCreatedAt: ticket.createdAt.toLocaleString(),
            ticketUpdatedAt: ticket.updatedAt.toLocaleString(),
            ticketUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tickets/${ticket.id}`,
            customerName: ticket.fromName || ticket.fromEmail,
            customerEmail: ticket.fromEmail,
            assignedToName: ticket.assignedTo?.name,
            assignedToEmail: ticket.assignedTo?.email,
            commentContent: '[EMAIL] Test',
            commentAuthor: 'Jonas Laux',
            commentCreatedAt: '30.7.2025, 09:42:36',
            actorName: 'Jonas Laux',
            actorEmail: session.user.email
          }

          const realRenderedTemplate = await renderEmailTemplate(type as EmailTemplateType, realVariables, true)
          
          realEmailTest = {
            ticket,
            variables: realVariables,
            renderedTemplate: realRenderedTemplate
          }

          console.log(`[DEBUG STEP 4] Real ticket test with ticket ID: ${ticketId}`)
          console.log(`- Ticket: ${ticket.subject}`)
          console.log(`- Status: ${ticket.status}`)
          console.log(`- From: ${ticket.fromName} <${ticket.fromEmail}>`)
        }
      } catch (error) {
        realEmailTest = { error: error instanceof Error ? error.message : 'Unknown error' }
        console.log(`[DEBUG STEP 4] Error getting real ticket data:`, error)
      }
    }

    debugInfo.realEmailTest = realEmailTest

    console.log(`\n==================== DEBUG SESSION COMPLETE ====================\n`)

    return NextResponse.json({
      success: true,
      debugInfo,
      summary: {
        emailTypeConfigExists: !!emailTypeConfig,
        emailTemplateExists: !!template,
        templateRenderSuccess: !!renderedTemplate,
        sectionsConfigured: emailTypeConfig ? JSON.parse(emailTypeConfig.sections).length : 0,
        hasActionButton: emailTypeConfig ? !!emailTypeConfig.actionButton : false
      },
      recommendations: generateRecommendations(debugInfo)
    })
  } catch (error) {
    console.error('Email template debug error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error during debugging',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function generateRecommendations(debugInfo: Record<string, unknown>): string[] {
  const recommendations: string[] = []

  const emailTypeConfig = debugInfo.emailTypeConfig as { exists: boolean; sectionsCount?: number } | undefined
  const emailTemplate = debugInfo.emailTemplate as { exists: boolean } | undefined
  const renderResult = debugInfo.renderResult as { success: boolean; template?: { debugInfo?: { configSource?: string } } } | undefined

  if (!emailTypeConfig?.exists) {
    recommendations.push('❌ EmailTypeConfig is missing - run POST /api/admin/email-templates/init to create it')
  }

  if (!emailTemplate?.exists) {
    recommendations.push('❌ Email template is missing - run POST /api/admin/email-templates/init to create default templates')
  }

  if (emailTypeConfig?.exists) {
    const sectionsCount = emailTypeConfig.sectionsCount || 0
    if (sectionsCount === 0) {
      recommendations.push('⚠️ EmailTypeConfig has empty sections - this is respected (no hardcoded fallback)')
    } else {
      recommendations.push(`✅ EmailTypeConfig has ${sectionsCount} sections configured`)
    }
  }

  if (renderResult?.success) {
    recommendations.push('✅ Template rendering successful')
  } else {
    recommendations.push('❌ Template rendering failed - check logs for details')
  }

  const configSource = renderResult?.template?.debugInfo?.configSource
  if (configSource) {
    if (configSource === 'database') {
      recommendations.push('✅ Using database configuration (as expected)')
    } else if (configSource.includes('fallback')) {
      recommendations.push(`⚠️ Using fallback configuration (${configSource}) - check database`)
    }
  }

  return recommendations
}