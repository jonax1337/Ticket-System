import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncImapEmails } from '@/lib/imap'

// POST - Sync emails from IMAP and create tickets
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

    if (!inbox.isActive) {
      return NextResponse.json({ error: 'Inbox is not active' }, { status: 400 })
    }

    // Sync emails and create tickets
    const result = await syncImapEmails(inbox)

    // Update last sync timestamp
    await prisma.inboxConfiguration.update({
      where: { id: params.id },
      data: { lastSync: new Date() }
    })

    return NextResponse.json({
      success: true,
      importedCount: result.importedCount,
      skippedCount: result.skippedCount,
      errorCount: result.errorCount
    })
  } catch (error) {
    console.error('Error syncing IMAP emails:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
