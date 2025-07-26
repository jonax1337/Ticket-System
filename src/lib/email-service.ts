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

  // Create ticket participants (creator + CC recipients)
  const participantsData = []
  
  // Add creator (from email)
  participantsData.push({
    ticketId: ticket.id,
    email: fromAddress,
    name: fromName,
    type: 'creator'
  })

  // Add CC recipients if any
  if (email.cc && email.cc.length > 0) {
    for (const ccRecipient of email.cc) {
      if (ccRecipient.value && ccRecipient.value.length > 0) {
        for (const ccAddress of ccRecipient.value) {
          // Don't add duplicates or the main sender
          if (ccAddress.address && ccAddress.address !== fromAddress) {
            participantsData.push({
              ticketId: ticket.id,
              email: ccAddress.address,
              name: ccAddress.name || ccAddress.address,
              type: 'cc'
            })
          }
        }
      }
    }
  }

  // Add BCC recipients if any (some email servers include them)
  if (email.bcc && email.bcc.length > 0) {
    for (const bccRecipient of email.bcc) {
      if (bccRecipient.value && bccRecipient.value.length > 0) {
        for (const bccAddress of bccRecipient.value) {
          // Don't add duplicates or the main sender
          if (bccAddress.address && bccAddress.address !== fromAddress) {
            participantsData.push({
              ticketId: ticket.id,
              email: bccAddress.address,
              name: bccAddress.name || bccAddress.address,
              type: 'cc' // Treat BCC same as CC for participants
            })
          }
        }
      }
    }
  }

  // Create all participants
  if (participantsData.length > 0) {
    await prisma.ticketParticipant.createMany({
      data: participantsData,
      skipDuplicates: true // In case same email appears multiple times
    })
  }

  console.log(`Ticket created with ${participantsData.length} participants: ${participantsData.map(p => p.email).join(', ')}`)

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
  ticketId?: string // Add ticketId to send to all participants
  selectedParticipants?: string[] // Specific participants to send to
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

    // Send to selected participants if provided, otherwise send to all participants
    if (options.selectedParticipants && options.selectedParticipants.length > 0) {
      // Send to specifically selected participants
      for (const participantEmail of options.selectedParticipants) {
        // Skip the original "to" recipient if it's already in the list
        if (participantEmail === options.to) continue
        
        try {
          // Get participant info from database for name
          const participant = await prisma.ticketParticipant.findFirst({
            where: {
              ticketId: options.ticketId,
              email: participantEmail
            }
          })
          
          const participantMailOptions = {
            from: {
              name: emailConfig.name || 'Support',
              address: emailConfig.username
            },
            to: {
              name: participant?.name || participantEmail,
              address: participantEmail
            },
            subject: emailSubject,
            text: cleanContent,
            html: cleanContent.replace(/\n/g, '<br>'),
            attachments: options.attachments
          }

          await transporter.sendMail(participantMailOptions)
          console.log(`Email sent to selected participant: ${participantEmail}`)
        } catch (participantError) {
          console.error(`Failed to send email to selected participant ${participantEmail}:`, participantError)
          // Continue with other participants even if one fails
        }
      }
    } else if (options.ticketId) {
      // Fallback: send to all participants if no specific selection
      try {
        const participants = await prisma.ticketParticipant.findMany({
          where: {
            ticketId: options.ticketId,
            email: {
              not: options.to // Don't send duplicate to the original recipient
            }
          }
        })

        for (const participant of participants) {
          try {
            const participantMailOptions = {
              from: {
                name: emailConfig.name || 'Support',
                address: emailConfig.username
              },
              to: {
                name: participant.name || participant.email,
                address: participant.email
              },
              subject: emailSubject,
              text: cleanContent,
              html: cleanContent.replace(/\n/g, '<br>'),
              attachments: options.attachments
            }

            await transporter.sendMail(participantMailOptions)
            console.log(`Email sent to participant: ${participant.email}`)
          } catch (participantError) {
            console.error(`Failed to send email to participant ${participant.email}:`, participantError)
            // Continue with other participants even if one fails
          }
        }
      } catch (participantsError) {
        console.error('Error fetching participants for email notification:', participantsError)
        // Don't fail the main email if participant lookup fails
      }
    }

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
  
    // Find existing ticket
    let ticket
    try {
      ticket = await prisma.ticket.findFirst({
        where: {
          ticketNumber: ticketNumber
        }
      })
    } catch (dbError) {
      console.error('Database error finding ticket:', dbError)
      throw dbError
    }

    if (!ticket) {
      return false // Ticket not found
    }


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
    } catch (dbError) {
      console.error('Database error checking duplicates:', dbError)
      throw dbError
    }

    // Basic duplicate detection - if very similar content exists recently, skip
    const newContent = extractNewReplyContent(email.text || '')
    
    if (recentSimilarComment && newContent) {
      const existingContent = recentSimilarComment.content.replace('[EMAIL REPLY] ', '')
      if (existingContent.trim() === newContent.trim()) {
        return true // Skip duplicate, but return true to prevent new ticket creation
      }
    }


    // Create comment from email reply - extract only new content
    const fullTextBody = email.text || 'No text content'
    const newReplyContent = extractNewReplyContent(fullTextBody)
    const textBody = newReplyContent || fullTextBody // Fallback to full text if extraction fails
    
    
    // Find or create a user for the email sender (simplified)
    let userId = null
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: fromAddress
        }
      })

      if (existingUser) {
        userId = existingUser.id
      } else {
        // External users can reply without being registered - this is normal for support systems
        userId = null
      }
    } catch (dbError) {
      console.error('Database error finding user:', dbError)
      // Continue with null userId since external users are allowed
      userId = null
    }

    // Extract sender information
    const fromName = email.from?.value?.[0]?.name || fromAddress

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: `[EMAIL REPLY] ${textBody.trim()}`,
        fullEmailContent: fullTextBody, // Store the complete email content including history
        ticketId: ticket.id,
        userId: userId, // This can be null for external users
        fromName: fromName, // Store sender name for external users
        fromEmail: fromAddress, // Store sender email for external users
        type: 'external'
      }
    })

    // Process ALL recipients from email reply and add them as participants
    try {
      const participantsToAdd = []
      
      // Get all configured email addresses to exclude them from participants
      const emailConfigurations = await prisma.emailConfiguration.findMany({
        select: { username: true }
      })
      const supportEmails = emailConfigurations.map(config => config.username.toLowerCase())
      
      // Add the sender (FROM) as participant if not already the original requester and not a support email
      if (fromAddress && fromAddress !== ticket.fromEmail) {
        const isSupportEmail = supportEmails.includes(fromAddress.toLowerCase())
        
        if (!isSupportEmail) {
          participantsToAdd.push({
            ticketId: ticket.id,
            email: fromAddress,
            name: fromName,
            type: 'added_via_reply'
          })
        }
      }
      
      // Add CC recipients if any
      if (email.cc && email.cc.length > 0) {
        for (const ccRecipient of email.cc) {
          if (ccRecipient.value && ccRecipient.value.length > 0) {
            for (const ccAddress of ccRecipient.value) {
              if (ccAddress.address) {
                participantsToAdd.push({
                  ticketId: ticket.id,
                  email: ccAddress.address,
                  name: ccAddress.name || ccAddress.address,
                  type: 'cc'
                })
              }
            }
          }
        }
      }

      // Add BCC recipients if any (some email servers include them)
      if (email.bcc && email.bcc.length > 0) {
        for (const bccRecipient of email.bcc) {
          if (bccRecipient.value && bccRecipient.value.length > 0) {
            for (const bccAddress of bccRecipient.value) {
              if (bccAddress.address) {
                participantsToAdd.push({
                  ticketId: ticket.id,
                  email: bccAddress.address,
                  name: bccAddress.name || bccAddress.address,
                  type: 'cc'
                })
              }
            }
          }
        }
      }

      // Add TO recipients if any (in case someone replies with additional TO addresses)
      if (email.to && email.to.length > 0) {
        for (const toRecipient of email.to) {
          if (toRecipient.value && toRecipient.value.length > 0) {
            for (const toAddress of toRecipient.value) {
              // Skip our own support email addresses, but add any external TO addresses
              if (toAddress.address) {
                const isSupport = supportEmails.includes(toAddress.address.toLowerCase())
                
                if (!isSupport) {
                  participantsToAdd.push({
                    ticketId: ticket.id,
                    email: toAddress.address,
                    name: toAddress.name || toAddress.address,
                    type: 'added_via_reply'
                  })
                }
              }
            }
          }
        }
      }

      // Create new participants (skipDuplicates will handle existing ones)
      if (participantsToAdd.length > 0) {
        await prisma.ticketParticipant.createMany({
          data: participantsToAdd,
          skipDuplicates: true // Skip if participant already exists
        })
        
        console.log(`Added ${participantsToAdd.length} new participants from email reply: ${participantsToAdd.map(p => `${p.email} (${p.type})`).join(', ')}`)
      } else {
        console.log('No new participants to add from email reply')
      }
    } catch (participantError) {
      console.error('Error processing participants from email reply:', participantError)
      // Don't fail the main process if participant processing fails
    }

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

    // Create notification for email reply - only for assigned user
    try {
      console.log('[NOTIFICATION DEBUG] Checking for ticket assignment...')
      
      // Get the ticket with assignment information
      const ticketWithAssignment = await prisma.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      console.log('[NOTIFICATION DEBUG] Ticket assignment info:', {
        ticketId: ticket.id,
        assignedTo: ticketWithAssignment?.assignedTo,
        assignedToId: ticketWithAssignment?.assignedToId
      })

      // Only create notification if ticket is assigned to someone
      if (ticketWithAssignment?.assignedTo) {
        const displayTicketNumber = ticketWithAssignment.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`
        
        console.log('[NOTIFICATION DEBUG] Creating notification for user:', ticketWithAssignment.assignedTo.id)
        
        const notification = await prisma.notification.create({
          data: {
            type: 'comment_added',
            title: 'New Email Reply',
            message: `${fromName} replied via email to ticket ${displayTicketNumber}: ${ticketWithAssignment.subject}`,
            userId: ticketWithAssignment.assignedTo.id,
            actorId: userId, // This can be null for external users
            ticketId: ticket.id,
            commentId: comment.id,
          }
        })
        
        console.log('[NOTIFICATION DEBUG] Notification created successfully:', notification.id)
      } else {
        console.log('[NOTIFICATION DEBUG] No assigned user found, skipping notification')
      }
    } catch (notificationError) {
      console.error('[NOTIFICATION DEBUG] Error creating notifications for email reply:', notificationError)
      // Don't fail the main process if notifications fail
    }

    console.log(`Email reply processed successfully: ${subject} -> Comment ${comment.id}`)
    return true

  } catch (error) {
    console.error('Error processing email reply:', error)
    // Return false to allow the email to be processed as a new ticket instead
    return false
}