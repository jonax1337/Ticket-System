import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDefaultEmailTemplates } from '@/lib/email-template-service'

// POST - Initialize default email templates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await createDefaultEmailTemplates()

    return NextResponse.json({ 
      success: true, 
      message: 'Default email templates initialized successfully' 
    })
  } catch (error) {
    console.error('Error initializing email templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}