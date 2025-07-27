import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { 
      appName, 
      slogan, 
      logoUrl, 
      hideAppName, 
      themeColor, 
      ticketPrefix, 
      ticketNumberType, 
      ticketNumberLength,
      automationEnabled,
      automationWarningDays,
      automationCloseDays,
      automationCheckInterval
    } = await request.json()

    if (!appName || !themeColor || !ticketPrefix || !ticketNumberType || !ticketNumberLength) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'system' },
      update: {
        appName,
        slogan,
        logoUrl,
        hideAppName,
        themeColor,
        ticketPrefix,
        ticketNumberType,
        ticketNumberLength,
        ...(typeof automationEnabled === 'boolean' && { automationEnabled }),
        ...(typeof automationWarningDays === 'number' && { automationWarningDays }),
        ...(typeof automationCloseDays === 'number' && { automationCloseDays }),
        ...(typeof automationCheckInterval === 'number' && { automationCheckInterval }),
      },
      create: {
        id: 'system',
        appName,
        slogan,
        logoUrl,
        hideAppName,
        themeColor,
        ticketPrefix,
        ticketNumberType,
        ticketNumberLength,
        automationEnabled: automationEnabled ?? true,
        automationWarningDays: automationWarningDays ?? 7,
        automationCloseDays: automationCloseDays ?? 14,
        automationCheckInterval: automationCheckInterval ?? 60,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'system' }
    })

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { 
          id: 'system',
          appName: 'Support Dashboard',
          themeColor: 'default',
          ticketPrefix: 'T',
          ticketNumberType: 'sequential',
          ticketNumberLength: 6,
          lastTicketNumber: 0,
          automationEnabled: true,
          automationWarningDays: 7,
          automationCloseDays: 14,
          automationCheckInterval: 60
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}