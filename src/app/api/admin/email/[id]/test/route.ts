import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { testEmailConnection } from '@/lib/email-service'

// POST - Test email connection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params

    // Get email configuration
    const config = await prisma.emailConfiguration.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!config) {
      return NextResponse.json({ error: 'Email configuration not found' }, { status: 404 })
    }

    // Test email connection
    const result = await testEmailConnection({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password, // TODO: Decrypt password
      useSSL: config.useSSL,
      folder: config.folder
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error testing email connection:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}