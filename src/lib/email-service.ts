import { ImapFlow, FetchMessageObject } from 'imapflow'
import { simpleParser, ParsedMail } from 'mailparser'
import { prisma } from '@/lib/prisma'
import { generateTicketNumber } from '@/lib/ticket-number-generator'

interface EmailConfig {
  host: string
  port: number
  username: string
  password: string
  useSSL: boolean
  folder: string
}

interface EmailConfiguration {
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
  emailAction: string
  moveToFolder: string | null
  processOnlyUnread: boolean
  subjectFilter: string | null
  fromFilter: string | null
  defaultPriority: string | null
  defaultStatus: string | null
  defaultAssigneeId: string | null
  enableAutoSync: boolean
  createdAt: Date
  updatedAt: Date
}

interface SyncResult {
  importedCount: number
  skippedCount: number
  errorCount: number
  processed: number
}

export async function testEmailConnection(config: EmailConfig): Promise<{ success: boolean; messageCount?: number; error?: string }> {
  try {
    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.useSSL,
      auth: {
        user: config.username,
        pass: config.password
      },
      logger: false,
      disableCompression: true
    })

    await client.connect()
    const mailbox = await client.mailboxOpen(config.folder)
    await client.logout()

    return {
      success: true,
      messageCount: mailbox.exists
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown connection error'
    }
  }
}

export async function syncEmails(emailConfig: EmailConfiguration): Promise<SyncResult> {
  let importedCount = 0
  let skippedCount = 0
  let errorCount = 0

  try {
    const client = new ImapFlow({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.useSSL,
      auth: {
        user: emailConfig.username,
        pass: emailConfig.password
      },
      logger: false,
      disableCompression: true
    })

    await client.connect()
    const mailbox = await client.mailboxOpen(emailConfig.folder)

    if (mailbox.exists === 0) {
      await client.logout()
      return { importedCount: 0, skippedCount: 0, errorCount: 0, processed: 0 }
    }

    // Build search criteria
    const searchCriteria: Record<string, unknown> = {}
    
    if (emailConfig.processOnlyUnread) {
      searchCriteria.unseen = true
    } else if (emailConfig.lastSync) {
      const since = new Date(emailConfig.lastSync)
      searchCriteria.since = since
    }

    const messages = client.fetch(searchCriteria, { envelope: true, source: true })
    let processedCount = 0
    const emailsToProcess: FetchMessageObject[] = []

    // Collect all messages first
    for await (const message of messages) {
      emailsToProcess.push(message)
    }

    if (emailsToProcess.length === 0) {
      await client.logout()
      return { importedCount: 0, skippedCount: 0, errorCount: 0, processed: 0 }
    }

    // Process each email
    for (const message of emailsToProcess) {
      processedCount++

      try {
        // Parse email content
        if (!message.source) {
          throw new Error('Message source is undefined')
        }
        const parsed = await simpleParser(message.source)
        
        // Apply filters
        const shouldProcess = await shouldProcessEmail(parsed, emailConfig)

        if (shouldProcess) {
          const wasCreated = await createTicketFromEmail(parsed, emailConfig)
          
          if (wasCreated) {
            importedCount++
          } else {
            skippedCount++
          }
        } else {
          skippedCount++
        }

        // Apply email action
        await applyEmailActionImapFlow(client, message.uid, emailConfig)

      } catch (error) {
        errorCount++
      }
    }

    await client.logout()
    return { importedCount, skippedCount, errorCount, processed: processedCount }

  } catch (error) {
    throw new Error(`Email sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function applyEmailActionImapFlow(client: ImapFlow, uid: number, config: EmailConfiguration): Promise<void> {
  try {
    switch (config.emailAction) {
      case 'mark_read':
        await client.messageFlagsAdd({ uid }, ['\\Seen'])
        break
        
      case 'delete':
        await client.messageFlagsAdd({ uid }, ['\\Deleted'])
        await client.messageDelete({ uid })
        break
        
      case 'move_to_folder':
        if (config.moveToFolder) {
          // First validate target folder exists
          const folders = await client.list()
          const availableFolders = folders.map(f => f.path)
          
          if (!availableFolders.includes(config.moveToFolder)) {
            const errorMsg = `Target folder '${config.moveToFolder}' does not exist. Available folders: ${availableFolders.join(', ')}`
            throw new Error(errorMsg)
          }
          
          // Use ImapFlow's modern move method
          await client.messageMove({ uid }, config.moveToFolder)
        }
        break
    }
  } catch (error) {
    throw error
  }
}

async function shouldProcessEmail(email: ParsedMail, config: EmailConfiguration): Promise<boolean> {
  // Subject filter
  if (config.subjectFilter) {
    try {
      const regex = new RegExp(config.subjectFilter, 'i')
      if (!regex.test(email.subject || '')) {
        return false
      }
    } catch (error) {
      console.error('Invalid subject filter regex:', config.subjectFilter)
    }
  }

  // From filter
  if (config.fromFilter) {
    try {
      const regex = new RegExp(config.fromFilter, 'i')
      const fromAddress = email.from?.value?.[0]?.address || ''
      if (!regex.test(fromAddress)) {
        return false
      }
    } catch (error) {
      console.error('Invalid from filter regex:', config.fromFilter)
    }
  }

  return true
}

async function createTicketFromEmail(email: ParsedMail, config: EmailConfiguration): Promise<boolean> {
  const subject = email.subject || 'No Subject'
  const fromAddress = email.from?.value?.[0]?.address || 'unknown@example.com'
  const fromName = email.from?.value?.[0]?.name || fromAddress
  const textBody = email.text || 'No text content'
  const htmlBody = email.html || null
  const receivedDate = email.date || new Date()
  const messageId = email.messageId

  // Check for duplicates
  const existingTicket = await prisma.ticket.findFirst({
    where: {
      OR: [
        messageId ? {
          description: {
            contains: messageId
          }
        } : {},
        {
          AND: [
            { fromEmail: fromAddress },
            { subject: subject },
            { 
              createdAt: {
                gte: new Date(receivedDate.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
              }
            }
          ]
        }
      ].filter(condition => Object.keys(condition).length > 0)
    }
  })

  if (existingTicket) {
    return false
  }

  // Generate ticket number
  const ticketNumber = await generateTicketNumber()

  // Create ticket description with metadata
  const ticketDescription = `
${textBody}
  `.trim()

  // Process attachments
  const attachmentData = []
  if (email.attachments && email.attachments.length > 0) {
    const { writeFile, mkdir } = await import('fs/promises')
    const { join } = await import('path')
    const { existsSync } = await import('fs')

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    
    // Create upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    for (const attachment of email.attachments) {
      if (attachment.content) {
        try {
          // Generate unique filename
          const timestamp = Date.now()
          const randomString = Math.random().toString(36).substring(2, 15)
          const extension = attachment.filename?.split('.').pop() || 'bin'
          const uniqueFilename = `${timestamp}-${randomString}.${extension}`
          
          const filePath = join(uploadDir, uniqueFilename)
          await writeFile(filePath, attachment.content)
          
          attachmentData.push({
            filename: attachment.filename || 'unknown',
            filepath: `/uploads/${uniqueFilename}`,
            mimetype: attachment.contentType || 'application/octet-stream',
            size: attachment.size || attachment.content.length,
          })
        } catch (error) {
          console.error(`Error saving attachment ${attachment.filename}:`, error)
        }
      }
    }
  }

  // Create the ticket
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      subject: subject,
      description: ticketDescription,
      fromEmail: fromAddress,
      fromName: fromName,
      htmlContent: htmlBody,
      priority: config.defaultPriority || 'Medium',
      status: config.defaultStatus || 'Open',
      assignedToId: config.defaultAssigneeId,
      createdAt: receivedDate,
    }
  })

  // Create attachments if any
  if (attachmentData.length > 0) {
    await prisma.ticketAttachment.createMany({
      data: attachmentData.map(attachment => ({
        ...attachment,
        ticketId: ticket.id,
      })),
    })
  }

  return true
}

export async function syncAllActiveEmailAccounts(): Promise<void> {
  try {
    const activeConfigs = await prisma.emailConfiguration.findMany({
      where: {
        isActive: true,
        enableAutoSync: true
      }
    })

    for (const config of activeConfigs) {
      try {
        const result = await syncEmails(config)
        
        // Update last sync timestamp
        await prisma.emailConfiguration.update({
          where: { id: config.id },
          data: { lastSync: new Date() }
        })
      } catch (error) {
        console.error(`Sync failed for ${config.name}:`, error)
      }
    }
  } catch (error) {
    console.error('Error syncing email accounts:', error)
  }
}