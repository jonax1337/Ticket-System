import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { prisma } from '@/lib/prisma'

interface ImapConfig {
  host: string
  port: number
  username: string
  password: string
  useSSL: boolean
  folder: string
}

interface InboxConfiguration {
  id: string
  name: string
  host: string
  port: number
  username: string
  password: string
  useSSL: boolean
  folder: string
  isActive: boolean
  lastSync: Date | null
  syncInterval: number
  markAsRead: boolean
  deleteAfterImport: boolean
  defaultPriority: string | null
  defaultStatus: string | null
  defaultAssigneeId: string | null
  createdAt: Date
  updatedAt: Date
}

interface SyncResult {
  importedCount: number
  skippedCount: number
  errorCount: number
}

// Test IMAP connection
export async function testImapConnection(config: ImapConfig): Promise<{ success: boolean; messageCount?: number; error?: string }> {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: config.username,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.useSSL,
      tlsOptions: { rejectUnauthorized: false }
    })

    let resolved = false

    const cleanup = () => {
      if (!resolved) {
        resolved = true
        try {
          imap.end()
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }

    imap.once('ready', () => {
      imap.openBox(config.folder, true, (err: any, box: any) => {
        if (err) {
          cleanup()
          resolve({ success: false, error: err.message })
          return
        }

        cleanup()
        resolve({ 
          success: true, 
          messageCount: box?.messages?.total || 0 
        })
      })
    })

    imap.once('error', (err) => {
      cleanup()
      resolve({ success: false, error: err.message })
    })

    // Set timeout for connection
    setTimeout(() => {
      if (!resolved) {
        cleanup()
        resolve({ success: false, error: 'Connection timeout' })
      }
    }, 10000) // 10 second timeout

    try {
      imap.connect()
    } catch (error) {
      cleanup()
      resolve({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      })
    }
  })
}

// Sync emails from IMAP and create tickets
export async function syncImapEmails(inboxConfig: InboxConfiguration): Promise<SyncResult> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: inboxConfig.username,
      password: inboxConfig.password, // TODO: Decrypt password
      host: inboxConfig.host,
      port: inboxConfig.port,
      tls: inboxConfig.useSSL,
      tlsOptions: { rejectUnauthorized: false }
    })

    let importedCount = 0
    let skippedCount = 0
    let errorCount = 0

    const cleanup = () => {
      try {
        imap.end()
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    imap.once('ready', () => {
      imap.openBox(inboxConfig.folder, false, (err: any, box: any) => {
        if (err) {
          cleanup()
          reject(new Error(`Failed to open folder: ${err.message}`))
          return
        }

        if (!box || box.messages.total === 0) {
          cleanup()
          resolve({ importedCount: 0, skippedCount: 0, errorCount: 0 })
          return
        }

        // Search for unread emails (or all emails if this is the first sync)
        const searchCriteria = inboxConfig.lastSync ? ['UNSEEN'] : ['ALL']
        
        imap.search(searchCriteria, (err, results) => {
          if (err) {
            cleanup()
            reject(new Error(`Search failed: ${err.message}`))
            return
          }

          if (!results || results.length === 0) {
            cleanup()
            resolve({ importedCount: 0, skippedCount: 0, errorCount: 0 })
            return
          }

          const fetch = imap.fetch(results, { bodies: '' })
          let processedCount = 0

          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream: any) => {
              simpleParser(stream, async (err: any, parsed: any) => {
                if (err) {
                  console.error('Error parsing email:', err)
                  errorCount++
                } else {
                  try {
                    await createTicketFromEmail(parsed, inboxConfig)
                    importedCount++

                    // Mark as read if configured
                    if (inboxConfig.markAsRead) {
                      imap.addFlags(seqno, ['\\Seen'], (err) => {
                        if (err) console.error('Error marking email as read:', err)
                      })
                    }

                    // Delete if configured
                    if (inboxConfig.deleteAfterImport) {
                      imap.addFlags(seqno, ['\\Deleted'], (err) => {
                        if (err) console.error('Error marking email for deletion:', err)
                      })
                    }
                  } catch (error) {
                    console.error('Error creating ticket from email:', error)
                    errorCount++
                  }
                }

                processedCount++
                if (processedCount === results.length) {
                  // Expunge deleted messages if configured
                  if (inboxConfig.deleteAfterImport) {
                    imap.expunge((err) => {
                      if (err) console.error('Error expunging deleted messages:', err)
                      cleanup()
                      resolve({ importedCount, skippedCount, errorCount })
                    })
                  } else {
                    cleanup()
                    resolve({ importedCount, skippedCount, errorCount })
                  }
                }
              })
            })
          })

          fetch.once('error', (err) => {
            cleanup()
            reject(new Error(`Fetch failed: ${err.message}`))
          })
        })
      })
    })

    imap.once('error', (err) => {
      cleanup()
      reject(new Error(`IMAP error: ${err.message}`))
    })

    // Set timeout for sync operation
    setTimeout(() => {
      cleanup()
      reject(new Error('Sync operation timeout'))
    }, 60000) // 60 second timeout

    try {
      imap.connect()
    } catch (error) {
      cleanup()
      reject(new Error(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  })
}

// Create ticket from parsed email
async function createTicketFromEmail(email: any, inboxConfig: InboxConfiguration) {
  // Extract email information
  const subject = email.subject || 'No Subject'
  const fromAddress = email.from?.value?.[0]?.address || 'unknown@example.com'
  const fromName = email.from?.value?.[0]?.name || fromAddress
  const body = email.text || email.html || 'No content'
  const receivedDate = email.date || new Date()

  // Check if ticket already exists (prevent duplicates)
  const messageId = email.messageId
  if (messageId) {
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        description: {
          contains: messageId
        }
      }
    })

    if (existingTicket) {
      console.log(`Ticket already exists for message ID: ${messageId}`)
      return
    }
  }

  // Get system settings for ticket numbering
  const systemSettings = await prisma.systemSettings.findUnique({
    where: { id: 'system' }
  })

  if (!systemSettings) {
    throw new Error('System settings not found')
  }

  // Generate ticket number
  let ticketNumber: string
  if (systemSettings.ticketNumberType === 'sequential') {
    const nextNumber = systemSettings.lastTicketNumber + 1
    ticketNumber = `${systemSettings.ticketPrefix}-${nextNumber.toString().padStart(systemSettings.ticketNumberLength, '0')}`
    
    // Update last ticket number
    await prisma.systemSettings.update({
      where: { id: 'system' },
      data: { lastTicketNumber: nextNumber }
    })
  } else {
    // Random ticket number
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let randomPart = ''
    for (let i = 0; i < systemSettings.ticketNumberLength; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    ticketNumber = `${systemSettings.ticketPrefix}-${randomPart}`
  }

  // Create ticket description with email metadata
  const ticketDescription = `
**Email Import Information:**
- From: ${fromName} <${fromAddress}>
- Received: ${receivedDate.toISOString()}
- Message ID: ${messageId || 'N/A'}
- Inbox: ${inboxConfig.name}

**Original Message:**
${body}
  `.trim()

  // Create the ticket
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      subject: subject,
      description: ticketDescription,
      fromEmail: fromAddress,
      fromName: fromName,
      priority: inboxConfig.defaultPriority || 'Medium',
      status: inboxConfig.defaultStatus || 'Open',
      assignedToId: inboxConfig.defaultAssigneeId,
      createdAt: receivedDate,
    }
  })

  console.log(`Created ticket ${ticketNumber} from email: ${subject}`)
  return ticket
}
