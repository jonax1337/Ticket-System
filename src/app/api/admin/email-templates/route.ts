import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List all email templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: [
        { type: 'asc' },
        { isDefault: 'asc' },
        { updatedAt: 'desc' }
      ]
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new email template
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
    const { type, name, subject, htmlContent, textContent, isActive } = body

    if (!type || !name || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate template type
    const validTypes = ['ticket_created', 'status_changed', 'comment_added', 'participant_added']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid template type' },
        { status: 400 }
      )
    }

    const template = await prisma.emailTemplate.create({
      data: {
        type,
        name,
        subject,
        htmlContent,
        textContent: textContent || null,
        isDefault: false,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating email template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}