import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDefaultEmailTemplates } from '@/lib/email-template-service'

// POST - Initialize default email templates and type configurations
export async function POST() {
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
      message: 'Default email templates and type configurations initialized successfully' 
    })
  } catch (error) {
    console.error('Error initializing email templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}