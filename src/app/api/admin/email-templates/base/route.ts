import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BASE_EMAIL_TEMPLATE } from '@/lib/email-base-template'

// GET - Get base template configuration
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get system settings which now includes base template configuration
    let systemSettings = await prisma.systemSettings.findFirst()

    if (!systemSettings) {
      // Create default system settings with base template
      systemSettings = await prisma.systemSettings.create({
        data: {
          id: 'system',
          appName: 'Support Dashboard',
          emailSubjectPrefix: '[Ticket {{ticketNumber}}]',
          emailBaseTemplate: BASE_EMAIL_TEMPLATE,
          emailBaseTemplateActive: true,
          emailShowLogo: true,
          emailHideAppName: false,
          emailHideSlogan: false
        }
      })
    } else if (!systemSettings.emailBaseTemplate) {
      // Update existing settings to include base template
      systemSettings = await prisma.systemSettings.update({
        where: { id: 'system' },
        data: {
          emailBaseTemplate: BASE_EMAIL_TEMPLATE,
          emailBaseTemplateActive: true,
          emailShowLogo: true,
          emailHideAppName: false,
          emailHideSlogan: false
        }
      })
    }

    return NextResponse.json({
      id: systemSettings.id,
      subjectPrefix: systemSettings.emailSubjectPrefix,
      htmlTemplate: systemSettings.emailBaseTemplate,
      isActive: systemSettings.emailBaseTemplateActive,
      showLogo: systemSettings.emailShowLogo ?? true,
      hideAppName: systemSettings.emailHideAppName ?? false,
      hideSlogan: systemSettings.emailHideSlogan ?? false,
      monochromeLogo: systemSettings.emailMonochromeLogo ?? false,
      fixedHeaderColor: systemSettings.emailFixedHeaderColor ?? false,
      headerColor: systemSettings.emailHeaderColor ?? '#2563eb',
      disclaimerText: systemSettings.emailDisclaimerText ?? 'This email was sent from {{systemName}} support system.',
      systemName: systemSettings.appName,
      logoUrl: systemSettings.logoUrl,
      slogan: systemSettings.slogan,
      createdAt: systemSettings.createdAt,
      updatedAt: systemSettings.updatedAt
    })
  } catch (error) {
    console.error('Error fetching base template configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update base template configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subjectPrefix, htmlTemplate, isActive, showLogo, hideAppName, hideSlogan, monochromeLogo, fixedHeaderColor, headerColor, disclaimerText } = body

    if (!subjectPrefix || !htmlTemplate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update system settings with base template configuration
    const systemSettings = await prisma.systemSettings.upsert({
      where: { id: 'system' },
      update: {
        emailSubjectPrefix: subjectPrefix,
        emailBaseTemplate: htmlTemplate,
        emailBaseTemplateActive: isActive !== undefined ? isActive : true,
        emailShowLogo: showLogo !== undefined ? showLogo : true,
        emailHideAppName: hideAppName !== undefined ? hideAppName : false,
        emailHideSlogan: hideSlogan !== undefined ? hideSlogan : false,
        emailMonochromeLogo: monochromeLogo !== undefined ? monochromeLogo : false,
        emailFixedHeaderColor: fixedHeaderColor !== undefined ? fixedHeaderColor : false,
        emailHeaderColor: headerColor || '#2563eb',
        emailDisclaimerText: disclaimerText || 'This email was sent from {{systemName}} support system.',
        updatedAt: new Date()
      },
      create: {
        id: 'system',
        appName: 'Support Dashboard',
        emailSubjectPrefix: subjectPrefix,
        emailBaseTemplate: htmlTemplate,
        emailBaseTemplateActive: isActive !== undefined ? isActive : true,
        emailShowLogo: showLogo !== undefined ? showLogo : true,
        emailHideAppName: hideAppName !== undefined ? hideAppName : false,
        emailHideSlogan: hideSlogan !== undefined ? hideSlogan : false,
        emailMonochromeLogo: monochromeLogo !== undefined ? monochromeLogo : false,
        emailFixedHeaderColor: fixedHeaderColor !== undefined ? fixedHeaderColor : false,
        emailHeaderColor: headerColor || '#2563eb',
        emailDisclaimerText: disclaimerText || 'This email was sent from {{systemName}} support system.'
      }
    })

    return NextResponse.json({
      id: systemSettings.id,
      subjectPrefix: systemSettings.emailSubjectPrefix,
      htmlTemplate: systemSettings.emailBaseTemplate,
      isActive: systemSettings.emailBaseTemplateActive,
      showLogo: systemSettings.emailShowLogo,
      hideAppName: systemSettings.emailHideAppName,
      hideSlogan: systemSettings.emailHideSlogan,
      monochromeLogo: systemSettings.emailMonochromeLogo,
      fixedHeaderColor: systemSettings.emailFixedHeaderColor,
      headerColor: systemSettings.emailHeaderColor,
      disclaimerText: systemSettings.emailDisclaimerText,
      systemName: systemSettings.appName,
      logoUrl: systemSettings.logoUrl,
      slogan: systemSettings.slogan,
      createdAt: systemSettings.createdAt,
      updatedAt: systemSettings.updatedAt
    })
  } catch (error) {
    console.error('Error updating base template configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}