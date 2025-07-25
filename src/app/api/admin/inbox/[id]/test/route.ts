import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { testImapConnection } from '@/lib/imap'

// POST - Test IMAP connection
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get inbox configuration
    const inbox = await prisma.inboxConfiguration.findUnique({
      where: { id: params.id }
    })

    if (!inbox) {
      return NextResponse.json({ error: 'Inbox not found' }, { status: 404 })
    }

    // Test IMAP connection
    const result = await testImapConnection({
      host: inbox.host,
      port: inbox.port,
      username: inbox.username,
      password: inbox.password, // TODO: Decrypt password
      useSSL: inbox.useSSL,
      folder: inbox.folder
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error testing IMAP connection:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
