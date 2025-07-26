import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ImapFlow } from 'imapflow'

// GET - List available folders for an email configuration
export async function GET(
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

    // Get folder list
    const folders = await getAvailableFolders({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      useSSL: config.useSSL
    })

    return NextResponse.json({ folders })
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function getAvailableFolders(config: {
  host: string
  port: number
  username: string
  password: string
  useSSL: boolean
}): Promise<string[]> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.useSSL,
    auth: {
      user: config.username,
      pass: config.password
    },
    logger: false
  })

  try {
    await client.connect()
    const list = await client.list()
    await client.logout()
    
    return list.map(item => item.path).sort()
  } catch (error) {
    try {
      await client.logout()
    } catch (logoutError) {
      // Ignore logout errors
    }
    throw new Error(`Failed to get folders: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}