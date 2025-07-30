import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncAllActiveEmailAccounts } from '@/lib/email-service'

// POST - Sync all active email accounts
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sync all active email accounts
    await syncAllActiveEmailAccounts()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error syncing all email accounts:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}