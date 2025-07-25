import { ImapFlow, FetchMessageObject } from 'imapflow'
import { simpleParser, ParsedMail } from 'mailparser'
import { prisma } from '@/lib/prisma'
import { generateTicketNumber } from '@/lib/ticket-number-generator'
import nodemailer from 'nodemailer'

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
        console.error('Error processing email:', error)
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
  // First check if this is a reply to existing ticket
  const isReply = await processIncomingEmailReply(email)
  if (isReply) {
    return true // Email was processed as a reply
  }

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

interface SendEmailOptions {
  to: string
  toName?: string
  subject: string
  content: string
  ticketNumber: string
  attachments?: Array<{
    filename: string
    path: string
    contentType?: string
  }>
}

export async function sendExternalEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    // Get first active email configuration for sending
    const emailConfig = await prisma.emailConfiguration.findFirst({
      where: {
        isActive: true
      }
    })

    if (!emailConfig) {
      throw new Error('No active email configuration found for sending emails')
    }

    // Create SMTP transporter using the same credentials as IMAP
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port === 993 ? 587 : emailConfig.port, // Use SMTP port instead of IMAP
      secure: emailConfig.port === 465, // true for 465, false for other ports
      auth: {
        user: emailConfig.username,
        pass: emailConfig.password
      }
    })

    // Build email subject with ticket number
    const emailSubject = `[Ticket ${options.ticketNumber}] ${options.subject}`

    // Clean up content - remove [EMAIL] prefix if present
    const cleanContent = options.content.replace(/^\[EMAIL\]\s*/, '')

    console.log(`Sending email with ${options.attachments?.length || 0} attachments`)
    if (options.attachments && options.attachments.length > 0) {
      console.log('Attachments:', options.attachments.map(att => `${att.filename} (${att.contentType})`))
    }

    // Send email
    const mailOptions = {
      from: {
        name: emailConfig.name || 'Support',
        address: emailConfig.username
      },
      to: {
        name: options.toName || options.to,
        address: options.to
      },
      subject: emailSubject,
      text: cleanContent,
      html: cleanContent.replace(/\n/g, '<br>'),
      attachments: options.attachments
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', result.messageId)
    return true

  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

// Function to extract only the new reply content from email, removing quoted history
function extractNewReplyContent(emailText: string): string {
  // Common patterns for email separators (German and English)
  const separators = [
    /^_{10,}$/gm,                           // Underscores ________________
    /^-{10,}$/gm,                           // Dashes --------------------
    /^Von:.*$/gmi,                          // German Outlook "Von:"
    /^From:.*$/gmi,                         // English "From:"
    /^Gesendet:.*$/gmi,                     // German Outlook "Gesendet:"
    /^Sent:.*$/gmi,                         // English "Sent:"
    /^On.*wrote:$/gmi,                      // Gmail style "On ... wrote:"
    /^Am.*schrieb:$/gmi,                    // German Gmail "Am ... schrieb:"
    /^>\s/gm,                               // Quoted lines starting with >
    /^\s*>.*$/gm,                           // Lines with > quotes
  ]

  let cleanedText = emailText

  // Find the first occurrence of any separator
  let earliestIndex = cleanedText.length
  
  for (const separator of separators) {
    const match = separator.exec(cleanedText)
    if (match && match.index < earliestIndex) {
      earliestIndex = match.index
    }
  }

  // If we found a separator, cut off everything after it
  if (earliestIndex < cleanedText.length) {
    cleanedText = cleanedText.substring(0, earliestIndex)
  }

  // Clean up the result
  return cleanedText
    .trim()                               // Remove leading/trailing whitespace
    .replace(/\n{3,}/g, '\n\n')          // Remove excessive line breaks
    .replace(/^\s*[\r\n]+/g, '')         // Remove leading empty lines
    .replace(/[\r\n]+\s*$/g, '')         // Remove trailing empty lines
}

// Function to check if incoming email is a reply to existing ticket
export async function processIncomingEmailReply(email: ParsedMail): Promise<boolean> {
  try {
    const subject = email.subject || ''
    const fromAddress = email.from?.value?.[0]?.address || ''
    
    console.log('[EMAIL REPLY DEBUG] Processing email:', subject)
    console.log('[EMAIL REPLY DEBUG] From address:', fromAddress)
    
    // Extract ticket number from subject - handle various formats like:
    // [Ticket IT-B8LOD55I] 
    // Re: [Ticket IT-B8LOD55I]
    // Fwd: [Ticket IT-B8LOD55I]
    const ticketMatch = subject.match(/\[Ticket\s+([^\]]+)\]/i)
    if (!ticketMatch) {
      console.log('[EMAIL REPLY DEBUG] No ticket number found in subject')
      return false // Not a reply to existing ticket
    }

    const ticketNumber = ticketMatch[1]
    console.log('[EMAIL REPLY DEBUG] Found ticket number:', ticketNumber)
  
    // Find existing ticket
    let ticket
    try {
      ticket = await prisma.ticket.findFirst({
        where: {
          ticketNumber: ticketNumber
        }
      })
      console.log('[EMAIL REPLY DEBUG] Database query completed for ticket lookup')
    } catch (dbError) {
      console.error('[EMAIL REPLY DEBUG] Database error finding ticket:', dbError)
      throw dbError
    }

    if (!ticket) {
      console.log('[EMAIL REPLY DEBUG] Ticket not found for number:', ticketNumber)
      return false // Ticket not found
    }

    console.log('[EMAIL REPLY DEBUG] Found ticket:', ticket.id)

    // Check for duplicate reply (based on email content and sender within last hour)
    let recentSimilarComment
    try {
      recentSimilarComment = await prisma.comment.findFirst({
        where: {
          ticketId: ticket.id,
          content: {
            startsWith: '[EMAIL REPLY]'
          },
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      console.log('[EMAIL REPLY DEBUG] Duplicate check query completed')
    } catch (dbError) {
      console.error('[EMAIL REPLY DEBUG] Database error checking duplicates:', dbError)
      throw dbError
    }

    // Basic duplicate detection - if very similar content exists recently, skip
    const newContent = extractNewReplyContent(email.text || '')
    console.log('[EMAIL REPLY DEBUG] Extracted new content length:', newContent?.length || 0)
    
    if (recentSimilarComment && newContent) {
      const existingContent = recentSimilarComment.content.replace('[EMAIL REPLY] ', '')
      if (existingContent.trim() === newContent.trim()) {
        console.log('[EMAIL REPLY DEBUG] Duplicate email detected, skipping')
        return true // Skip duplicate, but return true to prevent new ticket creation
      }
    }

    console.log('[EMAIL REPLY DEBUG] Creating comment with content:', newContent?.substring(0, 100) + '...')

    // Create comment from email reply - extract only new content
    const fullTextBody = email.text || 'No text content'
    const newReplyContent = extractNewReplyContent(fullTextBody)
    const textBody = newReplyContent || fullTextBody // Fallback to full text if extraction fails
    
    console.log('[EMAIL REPLY DEBUG] Final text body length:', textBody.length)
    
    // Find or create a user for the email sender (simplified)
    let userId = null
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: fromAddress
        }
      })
      console.log('[EMAIL REPLY DEBUG] User lookup completed, found:', !!existingUser)

      if (existingUser) {
        userId = existingUser.id
      } else {
        // External users can reply without being registered - this is normal for support systems
        userId = null
      }
    } catch (dbError) {
      console.error('[EMAIL REPLY DEBUG] Database error finding user:', dbError)
      // Continue with null userId since external users are allowed
      userId = null
    }

    // Extract sender information
    const fromName = email.from?.value?.[0]?.name || fromAddress

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: `[EMAIL REPLY] ${textBody.trim()}`,
        ticketId: ticket.id,
        userId: userId, // This can be null for external users
        fromName: fromName, // Store sender name for external users
        fromEmail: fromAddress, // Store sender email for external users
        type: 'external'
      }
    })

    // Process attachments from email reply
    if (email.attachments && email.attachments.length > 0) {
      try {
        const { writeFile, mkdir } = await import('fs/promises')
        const { join } = await import('path')
        const { v4: uuidv4 } = await import('uuid')

        const uploadDir = join(process.cwd(), 'public', 'uploads', 'attachments')
        await mkdir(uploadDir, { recursive: true })

        for (const attachment of email.attachments) {
          if (attachment.content) {
            try {
              // Generate unique filename
              const fileExtension = attachment.filename?.split('.').pop() || 'bin'
              const uniqueFilename = `${uuidv4()}.${fileExtension}`
              const filePath = join(uploadDir, uniqueFilename)
              const relativePath = `/uploads/attachments/${uniqueFilename}`

              // Save file
              await writeFile(filePath, attachment.content)

              // Save attachment to database
              await prisma.commentAttachment.create({
                data: {
                  filename: attachment.filename || 'unknown',
                  filepath: relativePath,
                  mimetype: attachment.contentType || 'application/octet-stream',
                  size: attachment.size || attachment.content.length,
                  commentId: comment.id,
                },
              })

            } catch (attachmentError) {
              console.error(`Error saving email attachment ${attachment.filename}:`, attachmentError)
            }
          }
        }
      } catch (attachmentProcessError) {
        console.error('Error processing attachments:', attachmentProcessError)
        // Don't throw here, comment was created successfully
      }
    }

    console.log(`Email reply processed successfully: ${subject} -> Comment ${comment.id}`)
    return true

  } catch (error) {
    console.error('Error processing email reply:', error)
    // Return false to allow the email to be processed as a new ticket instead
    return false
}