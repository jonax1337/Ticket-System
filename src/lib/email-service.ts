import { ImapFlow, FetchMessageObject } from 'imapflow'
import { simpleParser, ParsedMail } from 'mailparser'
import { prisma } from '@/lib/prisma'
import { generateTicketNumber } from '@/lib/ticket-number-generator'
import { renderEmailTemplate, EmailTemplateType } from '@/lib/email-template-service'
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
  isOutbound: boolean
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
    console.log('Starting email sync for config:', emailConfig.id)
    
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

    console.log('Connecting to IMAP server:', emailConfig.host, emailConfig.port)
    await client.connect()
    
    console.log('Opening mailbox:', emailConfig.folder)
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
    console.error('Email sync error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      emailConfigId: emailConfig.id,
      host: emailConfig.host,
      port: emailConfig.port,
      username: emailConfig.username,
      folder: emailConfig.folder
    })
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
    } catch (filterError) {
      console.error('Invalid subject filter regex:', config.subjectFilter, filterError)
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
    } catch (filterError) {
      console.error('Invalid from filter regex:', config.fromFilter, filterError)
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
      fromEmail: fromAddress.toLowerCase().trim(), // Normalize email for consistency
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

  // Create ticket participants (CC/BCC recipients only - requester is already stored in ticket.fromEmail)
  const participantsData = []

  // Add CC recipients if any
  if (email.cc) {
    const ccArray = Array.isArray(email.cc) ? email.cc : [email.cc]
    for (const ccRecipient of ccArray) {
      if (ccRecipient.value && ccRecipient.value.length > 0) {
        for (const ccAddress of ccRecipient.value) {
          // Don't add duplicates or the main sender - normalize emails for comparison
          const normalizedCcEmail = ccAddress.address?.toLowerCase().trim()
          const normalizedFromEmail = fromAddress.toLowerCase().trim()
          if (normalizedCcEmail && normalizedCcEmail !== normalizedFromEmail) {
            participantsData.push({
              ticketId: ticket.id,
              email: normalizedCcEmail,
              name: ccAddress.name || ccAddress.address,
              type: 'cc'
            })
          }
        }
      }
    }
  }

  // Add BCC recipients if any (some email servers include them)
  if (email.bcc) {
    const bccArray = Array.isArray(email.bcc) ? email.bcc : [email.bcc]
    for (const bccRecipient of bccArray) {
      if (bccRecipient.value && bccRecipient.value.length > 0) {
        for (const bccAddress of bccRecipient.value) {
          // Don't add duplicates or the main sender - normalize emails for comparison
          const normalizedBccEmail = bccAddress.address?.toLowerCase().trim()
          const normalizedFromEmail = fromAddress.toLowerCase().trim()
          if (normalizedBccEmail && normalizedBccEmail !== normalizedFromEmail) {
            participantsData.push({
              ticketId: ticket.id,
              email: normalizedBccEmail,
              name: bccAddress.name || bccAddress.address,
              type: 'cc' // Treat BCC same as CC for participants
            })
          }
        }
      }
    }
  }

  // Create all participants (with additional safety check to prevent requester duplication)
  if (participantsData.length > 0) {
    // Extra safety: filter out any participants that match the requester email
    const filteredParticipants = participantsData.filter(participant => {
      const normalizedParticipantEmail = participant.email.toLowerCase().trim()
      const normalizedRequesterEmail = fromAddress.toLowerCase().trim()
      return normalizedParticipantEmail !== normalizedRequesterEmail
    })
    
    if (filteredParticipants.length > 0) {
      await prisma.ticketParticipant.createMany({
        data: filteredParticipants,
        skipDuplicates: true // In case same email appears multiple times
      })
      console.log(`Added ${filteredParticipants.length} participants to ticket: ${filteredParticipants.map(p => `${p.email} (${p.type})`).join(', ')}`)
    } else {
      console.log('No participants to add after filtering out requester duplicates')
    }
  } else {
    console.log('No participants to add from email')
  }

  // Send ticket creation notification to customer using template
  try {
    await sendTemplatedEmail({
      templateType: 'ticket_created',
      to: fromAddress,
      toName: fromName,
      ticketId: ticket.id,
      variables: {
        ticketNumber,
        ticketSubject: subject,
        ticketDescription: textBody,
        ticketStatus: config.defaultStatus || 'Open',
        ticketPriority: config.defaultPriority || 'Medium',
        ticketCreatedAt: receivedDate.toLocaleString(),
        customerName: fromName,
        customerEmail: fromAddress,
        ticketUrl: `${process.env.NEXTAUTH_URL || 'https://localhost:3000'}/tickets/${ticket.id}`
      }
    })
  } catch (emailError) {
    console.error('Failed to send ticket creation notification:', emailError)
    // Don't fail ticket creation if email notification fails
  }

  // Send participant notifications to CC/BCC recipients (exclude the original requester - they get ticket_created notification)
  for (const participant of participantsData) {
    try {
      await sendTemplatedEmail({
        templateType: 'participant_added',
        to: participant.email,
        toName: participant.name,
        ticketId: ticket.id,
        variables: {
          ticketNumber,
          ticketSubject: subject,
          ticketDescription: textBody,
          ticketStatus: config.defaultStatus || 'Open',
          ticketPriority: config.defaultPriority || 'Medium',
          ticketCreatedAt: receivedDate.toLocaleString(),
          participantName: participant.name,
          participantEmail: participant.email,
          participantType: participant.type === 'cc' ? 'CC recipient' : 'Email participant',
          actorName: 'Email System',
          actorEmail: 'system',
          ticketUrl: `${process.env.NEXTAUTH_URL || 'https://localhost:3000'}/tickets/${ticket.id}`
        }
      })
      console.log(`Participant notification sent to ${participant.email} (${participant.type})`)
    } catch (participantEmailError) {
      console.error(`Failed to send participant notification to ${participant.email}:`, participantEmailError)
      // Continue with other participants even if one fails
    }
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
  ticketId?: string // Add ticketId to send to all participants
  selectedParticipants?: string[] // Specific participants to send to
  attachments?: Array<{
    filename: string
    path: string
    contentType?: string
  }>
}

interface SendTemplatedEmailOptions {
  templateType: EmailTemplateType
  to: string
  toName?: string
  ticketId: string
  variables?: Record<string, unknown>
  attachments?: Array<{
    filename: string
    path: string
    contentType?: string
  }>
}

export async function sendTemplatedEmail(options: SendTemplatedEmailOptions): Promise<boolean> {
  try {
    // Get ticket details for variables
    const ticket = await prisma.ticket.findUnique({
      where: { id: options.ticketId },
      include: {
        assignedTo: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!ticket) {
      console.error('Ticket not found for templated email')
      return false
    }

    // Prepare template variables with improved customer name resolution
    const customerName = options.toName || ticket.fromName || options.to.split('@')[0] || 'Customer'
    const templateVariables = {
      ticketNumber: ticket.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`,
      ticketSubject: ticket.subject,
      ticketDescription: ticket.description,
      ticketStatus: ticket.status,
      ticketPriority: ticket.priority,
      ticketCreatedAt: ticket.createdAt.toLocaleString(),
      ticketUpdatedAt: ticket.updatedAt.toLocaleString(),
      ticketUrl: `${process.env.NEXTAUTH_URL || 'https://localhost:3000'}/tickets/${ticket.id}`,
      customerName: customerName.trim() || 'Customer', // Ensure no empty names
      customerEmail: options.to,
      assignedToName: ticket.assignedTo?.name,
      assignedToEmail: ticket.assignedTo?.email,
      ...options.variables
    }

    // Render template with debugging for comment_added emails
    const debugMode = options.templateType === 'comment_added'
    const renderedTemplate = await renderEmailTemplate(options.templateType, templateVariables, debugMode)
    
    if (!renderedTemplate) {
      console.error(`No template found for type: ${options.templateType}`)
      return false
    }

    if (debugMode) {
      console.log(`[EMAIL_SEND_DEBUG] Rendering template for ${options.templateType}:`)
      console.log(`- To: ${options.to} (${options.toName || 'no name provided'})`)
      console.log(`- Customer Name: "${customerName}" (length: ${customerName.length})`)
      console.log(`- Ticket: ${ticket.subject}`)
      console.log(`- Template Variables Count: ${Object.keys(templateVariables).length}`)
      console.log(`- Subject: ${renderedTemplate.subject}`)
      console.log(`- HTML length: ${renderedTemplate.htmlContent.length}`)
      
      // Log important variables for debugging (safely access optional properties)
      console.log(`[EMAIL_SEND_DEBUG] Key Variables:`)
      console.log(`  - customerName: "${templateVariables.customerName}"`)
      console.log(`  - ticketNumber: "${templateVariables.ticketNumber}"`)
      console.log(`  - commentAuthor: "${(templateVariables as any).commentAuthor || 'N/A'}"`)
      console.log(`  - commentContent: "${((templateVariables as any).commentContent?.substring(0, 50)) || 'N/A'}..."`)
      
      if (renderedTemplate.debugInfo) {
        console.log(`- Config source: ${renderedTemplate.debugInfo.configSource}`)
        console.log(`- Sections count: ${renderedTemplate.debugInfo.finalSectionsCount}`)
        console.log(`- Debug info:`, JSON.stringify(renderedTemplate.debugInfo, null, 2))
      }
    }

    // Get email configuration - prioritize outbound-designated account
    const emailConfig = await prisma.emailConfiguration.findFirst({
      where: {
        isActive: true
      },
      orderBy: [
        { isOutbound: 'desc' }, // Prioritize outbound accounts
        { createdAt: 'asc' }    // Fallback to oldest if no outbound set
      ]
    })

    if (!emailConfig) {
      throw new Error('No active email configuration found for sending emails')
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port === 993 ? 587 : emailConfig.port,
      secure: emailConfig.port === 465,
      auth: {
        user: emailConfig.username,
        pass: emailConfig.password
      }
    })

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
      subject: renderedTemplate.subject,
      html: renderedTemplate.htmlContent,
      text: renderedTemplate.textContent || undefined,
      attachments: options.attachments
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Templated email sent successfully:', result.messageId)

    return true
  } catch (error) {
    console.error('Failed to send templated email:', error)
    return false
  }
}

export async function sendExternalEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    // Get outbound email configuration - prioritize outbound-designated account
    const emailConfig = await prisma.emailConfiguration.findFirst({
      where: {
        isActive: true
      },
      orderBy: [
        { isOutbound: 'desc' }, // Prioritize outbound accounts
        { createdAt: 'asc' }    // Fallback to oldest if no outbound set
      ]
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
          // Get participant info from database for name - normalize email for lookup
          const normalizedParticipantEmail = participantEmail.toLowerCase().trim()
          const participant = await prisma.ticketParticipant.findFirst({
            where: {
              ticketId: options.ticketId,
              email: normalizedParticipantEmail
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
    
    console.log('[EMAIL REPLY DEBUG] Processing email subject:', subject)
    
    // Extract ticket number from subject using flexible patterns:
    // - [Ticket TICKETNUMBER] (original format)
    // - TICKETNUMBER (any ticket number in subject)
    // - Re: TICKETNUMBER, Fwd: TICKETNUMBER, AW: TICKETNUMBER, etc.
    
    let ticketNumber = null
    
    // First try the original [Ticket NUMBER] format for backward compatibility
    let ticketMatch = subject.match(/\[Ticket\s+([^\]]+)\]/i)
    if (ticketMatch) {
      ticketNumber = ticketMatch[1]
      console.log('[EMAIL REPLY DEBUG] Found ticket number in [Ticket] format:', ticketNumber)
    } else {
      // Enhanced regex to handle reply prefixes and various ticket number patterns
      // Remove common reply prefixes first, then search for ticket numbers
      const cleanSubject = subject.replace(/^(Re:|AW:|Fwd:|Fw:|Antwort:|Reply:)\s*/i, '').trim()
      console.log('[EMAIL REPLY DEBUG] Cleaned subject (removed reply prefixes):', cleanSubject)
      
      // Try to find any ticket number pattern in the cleaned subject
      // This handles patterns like: T-000001, IT-B8LOD55I, SUP-ABC123, SUPPORT-CASE-123 etc.
      // Made more flexible to handle both single letter and multi-letter prefixes
      ticketMatch = cleanSubject.match(/([A-Z][-_][A-Z0-9]+(?:[-_][A-Z0-9]+)*)/i)
      if (ticketMatch) {
        ticketNumber = ticketMatch[1]
        console.log('[EMAIL REPLY DEBUG] Found ticket number pattern in cleaned subject:', ticketNumber)
      } else {
        // Also try the original subject in case the prefix is part of the ticket number
        ticketMatch = subject.match(/([A-Z][-_][A-Z0-9]+(?:[-_][A-Z0-9]+)*)/i)
        if (ticketMatch) {
          ticketNumber = ticketMatch[1]
          console.log('[EMAIL REPLY DEBUG] Found ticket number pattern in original subject:', ticketNumber)
        }
      }
    }
    
    if (!ticketNumber) {
      console.log('[EMAIL REPLY DEBUG] No ticket number found in subject')
      return false // Not a reply to existing ticket
    }
  
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
      console.log('[EMAIL REPLY DEBUG] Ticket not found in database:', ticketNumber)
      return false // Ticket not found, will create new ticket
    }

    console.log('[EMAIL REPLY DEBUG] Found ticket:', {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      subject: ticket.subject
    })

    // Check if ticket is closed - if so, create a new ticket instead of adding comment
    if (ticket.status?.toUpperCase() === 'CLOSED') {
      console.log('[EMAIL REPLY DEBUG] Ticket is closed, will create new ticket instead of adding comment')
      return false // Return false to trigger new ticket creation
    }

    console.log('[EMAIL REPLY DEBUG] Ticket is open, proceeding to add as comment')

    // Check for duplicate reply (based on email content and sender within last hour)
    let recentSimilarComment
    try {
      console.log('[EMAIL REPLY DEBUG] Checking for recent duplicate comments...')
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
      console.log('[EMAIL REPLY DEBUG] Duplicate check completed')
    } catch (dbError) {
      console.error('[EMAIL REPLY DEBUG] Database error checking duplicates:', dbError)
      throw dbError
    }

    // Basic duplicate detection - if very similar content exists recently, skip
    const newContent = extractNewReplyContent(email.text || '')
    
    if (recentSimilarComment && newContent) {
      const existingContent = recentSimilarComment.content.replace('[EMAIL REPLY] ', '')
      if (existingContent.trim() === newContent.trim()) {
        console.log('[EMAIL REPLY DEBUG] Skipping duplicate content')
        return true // Skip duplicate, but return true to prevent new ticket creation
      }
    }

    console.log('[EMAIL REPLY DEBUG] Proceeding to create comment...')

    // Create comment from email reply - extract only new content
    const fullTextBody = email.text || 'No text content'
    const newReplyContent = extractNewReplyContent(fullTextBody)
    const textBody = newReplyContent || fullTextBody // Fallback to full text if extraction fails
    
    console.log('[EMAIL REPLY DEBUG] Text content extracted, length:', textBody.length)
    
    // Find or create a user for the email sender (simplified)
    let userId = null
    try {
      console.log('[EMAIL REPLY DEBUG] Looking up user for email:', fromAddress)
      const existingUser = await prisma.user.findFirst({
        where: {
          email: fromAddress
        }
      })

      if (existingUser) {
        userId = existingUser.id
        console.log('[EMAIL REPLY DEBUG] Found existing user:', userId)
      } else {
        // External users can reply without being registered - this is normal for support systems
        userId = null
        console.log('[EMAIL REPLY DEBUG] No existing user found, proceeding as external user')
      }
    } catch (dbError) {
      console.error('[EMAIL REPLY DEBUG] Database error finding user:', dbError)
      // Continue with null userId since external users are allowed
      userId = null
    }

    // Extract sender information
    const fromName = email.from?.value?.[0]?.name || fromAddress
    console.log('[EMAIL REPLY DEBUG] Sender info - Name:', fromName, 'Email:', fromAddress)

    // Create comment
    console.log('[EMAIL REPLY DEBUG] Creating comment in database...')
    console.log('[EMAIL REPLY DEBUG] Comment data:', {
      content: `[EMAIL REPLY] ${textBody.trim()}`,
      ticketId: ticket.id,
      userId: userId,
      fromName: fromName,
      fromEmail: fromAddress,
      type: 'external'
    })
    let comment
    try {
      comment = await prisma.comment.create({
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
      console.log('[EMAIL REPLY DEBUG] Comment created successfully with ID:', comment.id)
      console.log('[EMAIL REPLY DEBUG] Comment details:', {
        id: comment.id,
        content: comment.content,
        ticketId: comment.ticketId,
        userId: comment.userId,
        fromName: comment.fromName,
        fromEmail: comment.fromEmail,
        type: comment.type
      })
    } catch (commentError) {
      console.error('[EMAIL REPLY DEBUG] Error creating comment:', commentError)
      throw commentError
    }

    // Process ALL recipients from email reply and add them as participants
    try {
      console.log('[EMAIL REPLY DEBUG] Starting participant processing...')
      const participantsToAdd = []
      
      // Get all configured email addresses to exclude them from participants
      console.log('[EMAIL REPLY DEBUG] Fetching email configurations...')
      const emailConfigurations = await prisma.emailConfiguration.findMany({
        select: { username: true }
      })
      const supportEmails = emailConfigurations.map(config => config.username.toLowerCase())
      console.log('[EMAIL REPLY DEBUG] Support emails to exclude:', supportEmails)
      
      // Add the sender (FROM) as participant if not already the original requester and not a support email
      // Normalize email addresses for comparison to handle case differences and whitespace
      console.log('[EMAIL REPLY DEBUG] Processing sender as potential participant...')
      const normalizedFromEmail = fromAddress?.toLowerCase().trim()
      const normalizedTicketFromEmail = ticket.fromEmail?.toLowerCase().trim()
      console.log('[EMAIL REPLY DEBUG] Sender email (normalized):', normalizedFromEmail)
      console.log('[EMAIL REPLY DEBUG] Original requester email (normalized):', normalizedTicketFromEmail)
      
      if (normalizedFromEmail && normalizedFromEmail !== normalizedTicketFromEmail) {
        console.log('[EMAIL REPLY DEBUG] Sender is different from original requester, checking if support email...')
        const isSupportEmail = supportEmails.includes(normalizedFromEmail)
        console.log('[EMAIL REPLY DEBUG] Is sender a support email?', isSupportEmail)
        
        // Also check if this email is already in the participants list to avoid duplicates
        console.log('[EMAIL REPLY DEBUG] Checking for existing participant...')
        const existingParticipant = await prisma.ticketParticipant.findFirst({
          where: {
            ticketId: ticket.id,
            email: normalizedFromEmail
          }
        })
        console.log('[EMAIL REPLY DEBUG] Existing participant found?', !!existingParticipant)
        
        if (!isSupportEmail && !existingParticipant) {
          console.log('[EMAIL REPLY DEBUG] Adding sender as participant')
          participantsToAdd.push({
            ticketId: ticket.id,
            email: normalizedFromEmail, // Store normalized email
            name: fromName,
            type: 'added_via_reply'
          })
        } else {
          console.log('[EMAIL REPLY DEBUG] Skipping sender - either support email or already participant')
        }
      } else {
        console.log('[EMAIL REPLY DEBUG] Sender is same as original requester, skipping')
      }
      
      // Add CC recipients if any
      if (email.cc) {
        const ccArray = Array.isArray(email.cc) ? email.cc : [email.cc]
        for (const ccRecipient of ccArray) {
          if (ccRecipient.value && ccRecipient.value.length > 0) {
            for (const ccAddress of ccRecipient.value) {
              if (ccAddress.address) {
                const normalizedCcEmail = ccAddress.address.toLowerCase().trim()
                
                // Skip if this is support email or already the original requester
                const isSupport = supportEmails.includes(normalizedCcEmail)
                const isOriginalRequester = normalizedCcEmail === normalizedTicketFromEmail
                
                if (!isSupport && !isOriginalRequester) {
                  participantsToAdd.push({
                    ticketId: ticket.id,
                    email: normalizedCcEmail, // Store normalized email
                    name: ccAddress.name || ccAddress.address,
                    type: 'cc'
                  })
                }
              }
            }
          }
        }
      }

      // Add BCC recipients if any (some email servers include them)
      if (email.bcc) {
        const bccArray = Array.isArray(email.bcc) ? email.bcc : [email.bcc]
        for (const bccRecipient of bccArray) {
          if (bccRecipient.value && bccRecipient.value.length > 0) {
            for (const bccAddress of bccRecipient.value) {
              if (bccAddress.address) {
                const normalizedBccEmail = bccAddress.address.toLowerCase().trim()
                
                // Skip if this is support email or already the original requester
                const isSupport = supportEmails.includes(normalizedBccEmail)
                const isOriginalRequester = normalizedBccEmail === normalizedTicketFromEmail
                
                if (!isSupport && !isOriginalRequester) {
                  participantsToAdd.push({
                    ticketId: ticket.id,
                    email: normalizedBccEmail, // Store normalized email
                    name: bccAddress.name || bccAddress.address,
                    type: 'cc' // Treat BCC same as CC for participants
                  })
                }
              }
            }
          }
        }
      }

      // Add TO recipients if any (in case someone replies with additional TO addresses)
      if (email.to) {
        const toArray = Array.isArray(email.to) ? email.to : [email.to]
        for (const toRecipient of toArray) {
          if (toRecipient.value && toRecipient.value.length > 0) {
            for (const toAddress of toRecipient.value) {
              // Skip our own support email addresses, but add any external TO addresses
              if (toAddress.address) {
                const normalizedToEmail = toAddress.address.toLowerCase().trim()
                const isSupport = supportEmails.includes(normalizedToEmail)
                const isOriginalRequester = normalizedToEmail === normalizedTicketFromEmail
                
                if (!isSupport && !isOriginalRequester) {
                  participantsToAdd.push({
                    ticketId: ticket.id,
                    email: normalizedToEmail, // Store normalized email
                    name: toAddress.name || toAddress.address,
                    type: 'added_via_reply'
                  })
                }
              }
            }
          }
        }
      }

      // Create new participants with extra safety check to prevent requester duplication
      if (participantsToAdd.length > 0) {
        console.log('[EMAIL REPLY DEBUG] Processing', participantsToAdd.length, 'participants to add...')
        // Extra safety: double-check that none of these participants are the original requester
        const safeParticipants = participantsToAdd.filter(participant => {
          const normalizedParticipantEmail = participant.email.toLowerCase().trim()
          const normalizedOriginalRequester = normalizedTicketFromEmail || ''
          return normalizedParticipantEmail !== normalizedOriginalRequester
        })
        
        if (safeParticipants.length > 0) {
          console.log('[EMAIL REPLY DEBUG] Adding', safeParticipants.length, 'safe participants to database...')
          await prisma.ticketParticipant.createMany({
            data: safeParticipants,
            skipDuplicates: true // Skip if participant already exists
          })
          console.log(`[EMAIL REPLY DEBUG] Added ${safeParticipants.length} new participants from email reply: ${safeParticipants.map(p => `${p.email} (${p.type})`).join(', ')}`)
        } else {
          console.log('[EMAIL REPLY DEBUG] No participants to add from email reply after filtering out requester duplicates')
        }
      } else {
        console.log('[EMAIL REPLY DEBUG] No new participants to add from email reply')
      }
    } catch (participantError) {
      console.error('[EMAIL REPLY DEBUG] Error processing participants from email reply:', participantError)
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

    // Create notifications and send emails for email reply
    try {
      console.log('[EMAIL REPLY DEBUG] Starting notification and email processing...')
      console.log('[EMAIL REPLY DEBUG] Checking for ticket assignment...')
      
      // Get the ticket with assignment information and participants
      const ticketWithDetails = await prisma.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
          participants: {
            select: {
              id: true,
              email: true,
              name: true,
              type: true,
            },
          },
        },
      })

      console.log('[EMAIL REPLY DEBUG] Ticket details:', {
        ticketId: ticket.id,
        assignedTo: ticketWithDetails?.assignedTo,
        participantCount: ticketWithDetails?.participants?.length || 0
      })

      const displayTicketNumber = ticketWithDetails?.ticketNumber || `#${ticket.id.slice(-6).toUpperCase()}`

      // Create in-app notification for assigned user
      if (ticketWithDetails?.assignedTo) {
        console.log('[EMAIL REPLY DEBUG] Creating in-app notification for assignee:', ticketWithDetails.assignedTo.id)
        
        const notification = await prisma.notification.create({
          data: {
            type: 'comment_added',
            title: 'New Email Reply',
            message: `${fromName} replied via email to ticket ${displayTicketNumber}: ${ticketWithDetails.subject}`,
            userId: ticketWithDetails.assignedTo.id,
            actorId: userId, // This can be null for external users
            ticketId: ticket.id,
            commentId: comment.id,
          }
        })
        
        console.log('[EMAIL REPLY DEBUG] In-app notification created successfully:', notification.id)
      } else {
        console.log('[EMAIL REPLY DEBUG] No assigned user found, skipping in-app notification')
      }

      // Send email notifications to all participants and requester (excluding the sender)
      console.log('[EMAIL REPLY DEBUG] Starting email notification process...')
      
      const emailRecipientsToNotify = []
      
      // Add the original requester (if they're not the sender)
      const normalizedSenderEmail = fromAddress.toLowerCase().trim()
      const normalizedRequesterEmail = ticket.fromEmail.toLowerCase().trim()
      
      if (normalizedSenderEmail !== normalizedRequesterEmail) {
        emailRecipientsToNotify.push({
          email: ticket.fromEmail,
          name: ticket.fromName || ticket.fromEmail,
          type: 'requester'
        })
        console.log('[EMAIL REPLY DEBUG] Added requester to email notifications:', ticket.fromEmail)
      } else {
        console.log('[EMAIL REPLY DEBUG] Skipping requester (is the sender):', ticket.fromEmail)
      }
      
      // Add all participants (excluding the sender)
      if (ticketWithDetails?.participants) {
        for (const participant of ticketWithDetails.participants) {
          const normalizedParticipantEmail = participant.email.toLowerCase().trim()
          
          if (normalizedParticipantEmail !== normalizedSenderEmail) {
            emailRecipientsToNotify.push({
              email: participant.email,
              name: participant.name || participant.email,
              type: 'participant'
            })
            console.log('[EMAIL REPLY DEBUG] Added participant to email notifications:', participant.email)
          } else {
            console.log('[EMAIL REPLY DEBUG] Skipping participant (is the sender):', participant.email)
          }
        }
      }
      
      console.log('[EMAIL REPLY DEBUG] Total email recipients to notify:', emailRecipientsToNotify.length)
      
      // Send templated email notification to each recipient
      for (const recipient of emailRecipientsToNotify) {
        try {
          console.log('[EMAIL REPLY DEBUG] Sending email notification to:', recipient.email)
          
          const emailSent = await sendTemplatedEmail({
            templateType: 'comment_added',
            to: recipient.email,
            toName: recipient.name,
            ticketId: ticket.id,
            variables: {
              commentContent: textBody,
              commentAuthor: fromName,
              commentCreatedAt: new Date().toLocaleString(),
              actorName: fromName,
              actorEmail: fromAddress,
              ticketNumber: displayTicketNumber,
              ticketSubject: ticket.subject,
              ticketStatus: ticket.status,
              ticketUrl: `${process.env.NEXTAUTH_URL || 'https://localhost:3000'}/tickets/${ticket.id}`
            }
          })
          
          if (emailSent) {
            console.log('[EMAIL REPLY DEBUG] Email notification sent successfully to:', recipient.email)
          } else {
            console.log('[EMAIL REPLY DEBUG] Failed to send email notification to:', recipient.email)
          }
        } catch (emailError) {
          console.error('[EMAIL REPLY DEBUG] Error sending email notification to', recipient.email, ':', emailError)
          // Continue with other recipients even if one fails
        }
      }
      
    } catch (notificationError) {
      console.error('[EMAIL REPLY DEBUG] Error creating notifications for email reply:', notificationError)
      // Don't fail the main process if notifications fail
    }

    console.log(`[EMAIL REPLY DEBUG] Email reply processed successfully: ${subject} -> Comment ${comment.id}`)
    return true

  } catch (error) {
    console.error('[EMAIL REPLY DEBUG] Error processing email reply:', error)
    console.error('[EMAIL REPLY DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    // Return false to allow the email to be processed as a new ticket instead
    return false
  }
}