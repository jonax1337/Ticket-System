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

    const { appName, slogan, logoUrl, hideAppName, themeColor } = await request.json()

    if (!appName || !themeColor) {
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
      },
      create: {
        id: 'system',
        appName,
        slogan,
        logoUrl,
        hideAppName,
        themeColor,
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
        data: { id: 'system' }
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