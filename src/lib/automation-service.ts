import { prisma } from '@/lib/prisma'
import { createAutoCloseWarningNotification, createAutoClosedNotification } from '@/lib/notification-service'
import { sendExternalEmail } from '@/lib/email-service'

interface AutomationConfig {
  enabled: boolean
  daysUntilWarning: number // Default: 7 days
  daysUntilAutoClose: number // Default: 14 days
  checkIntervalMinutes: number // Default: 60 minutes
}

// Default configuration
const DEFAULT_CONFIG: AutomationConfig = {
  enabled: true,
  daysUntilWarning: 7,
  daysUntilAutoClose: 14,
  checkIntervalMinutes: 60
}

class TicketAutomationManager {
  private interval: NodeJS.Timeout | null = null
  private isRunning: boolean = false
  private config: AutomationConfig = DEFAULT_CONFIG

  async start() {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    await this.loadConfig()
    
    if (!this.config.enabled) {
      console.log('Ticket automation is disabled')
      return
    }

    // Run immediately on start
    await this.processTickets()
    
    // Setup interval
    this.interval = setInterval(async () => {
      await this.processTickets()
    }, this.config.checkIntervalMinutes * 60 * 1000)

    console.log(`Ticket automation started with ${this.config.checkIntervalMinutes}-minute intervals`)
  }

  stop() {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }

    console.log('Ticket automation stopped')
  }

  private async loadConfig() {
    try {
      // Try to load from database first, fallback to environment variables
      const settings = await prisma.systemSettings.findUnique({
        where: { id: 'system' }
      })

      if (settings) {
        // Use database settings if available
        this.config = {
          enabled: settings.automationEnabled,
          daysUntilWarning: settings.automationWarningDays,
          daysUntilAutoClose: settings.automationCloseDays,
          checkIntervalMinutes: settings.automationCheckInterval
        }
      } else {
        // Fallback to environment variables or defaults
        this.config = {
          enabled: process.env.TICKET_AUTOMATION_ENABLED !== 'false',
          daysUntilWarning: parseInt(process.env.TICKET_AUTOMATION_WARNING_DAYS || '7'),
          daysUntilAutoClose: parseInt(process.env.TICKET_AUTOMATION_CLOSE_DAYS || '14'),
          checkIntervalMinutes: parseInt(process.env.TICKET_AUTOMATION_CHECK_INTERVAL || '60')
        }
      }
    } catch (error) {
      console.error('Error loading automation config from database, using defaults:', error)
      // Fallback to environment variables or defaults
      this.config = {
        enabled: process.env.TICKET_AUTOMATION_ENABLED !== 'false',
        daysUntilWarning: parseInt(process.env.TICKET_AUTOMATION_WARNING_DAYS || '7'),
        daysUntilAutoClose: parseInt(process.env.TICKET_AUTOMATION_CLOSE_DAYS || '14'),
        checkIntervalMinutes: parseInt(process.env.TICKET_AUTOMATION_CHECK_INTERVAL || '60')
      }
    }
  }

  private async processTickets() {
    try {
      console.log('Processing tickets for automation...')
      
      const now = new Date()
      const warningCutoff = new Date(now.getTime() - (this.config.daysUntilWarning * 24 * 60 * 60 * 1000))
      const closeCutoff = new Date(now.getTime() - (this.config.daysUntilAutoClose * 24 * 60 * 60 * 1000))

      // Process tickets eligible for warning
      await this.processWarningEligibleTickets(warningCutoff)
      
      // Process tickets eligible for auto-close
      await this.processAutoCloseEligibleTickets(closeCutoff)
      
      console.log('Ticket automation processing completed')
    } catch (error) {
      console.error('Error processing tickets for automation:', error)
    }
  }

  private async processWarningEligibleTickets(cutoffDate: Date) {
    try {
      // Find open tickets that haven't had customer activity since the warning cutoff
      const tickets = await this.findInactiveTickets(cutoffDate, false)
      
      for (const ticket of tickets) {
        // Check if we already sent a warning for this ticket
        const existingWarning = await prisma.notification.findFirst({
          where: {
            ticketId: ticket.id,
            type: 'ticket_auto_close_warning',
            createdAt: {
              gte: new Date(Date.now() - (24 * 60 * 60 * 1000)) // Within last 24 hours
            }
          }
        })

        if (!existingWarning) {
          // Send internal notification to assigned user
          if (ticket.assignedToId) {
            await createAutoCloseWarningNotification(
              ticket.id,
              ticket.assignedToId,
              this.config.daysUntilAutoClose - this.config.daysUntilWarning,
              ticket.ticketNumber ?? undefined,
              ticket.subject
            )
          }
          
          // Send email notification to customer(s)
          await this.sendCustomerWarningEmail(ticket)
          
          console.log(`Sent auto-close warning for ticket ${ticket.ticketNumber || ticket.id}`)
        }
      }
    } catch (error) {
      console.error('Error processing warning eligible tickets:', error)
    }
  }

  private async processAutoCloseEligibleTickets(cutoffDate: Date) {
    try {
      // Find open tickets that haven't had customer activity since the close cutoff
      const tickets = await this.findInactiveTickets(cutoffDate, true)
      
      for (const ticket of tickets) {
        // Send final notification email to customer(s) before closing
        await this.sendCustomerAutoCloseEmail(ticket)
        
        // Close the ticket
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { 
            status: 'Closed',
            updatedAt: new Date()
          }
        })
        
        // Send auto-closed notification to assigned user
        if (ticket.assignedToId) {
          await createAutoClosedNotification(
            ticket.id,
            ticket.assignedToId,
            ticket.ticketNumber ?? undefined,
            ticket.subject
          )
        }
        
        // Add a system comment to the ticket
        await prisma.comment.create({
          data: {
            content: `This ticket has been automatically closed due to ${this.config.daysUntilAutoClose} days of inactivity from the customer.`,
            type: 'internal',
            ticketId: ticket.id,
            fromName: 'System',
          }
        })
        
        console.log(`Auto-closed ticket ${ticket.ticketNumber || ticket.id} due to inactivity`)
      }
    } catch (error) {
      console.error('Error processing auto-close eligible tickets:', error)
    }
  }

  private async findInactiveTickets(cutoffDate: Date, includeWarningReceived: boolean) {
    try {
      // Find tickets that are open and have been updated before the cutoff date
      const baseQuery = {
        status: {
          notIn: ['Closed', 'Resolved'] // Don't process already closed tickets
        },
        updatedAt: {
          lt: cutoffDate
        }
      }

      const tickets = await prisma.ticket.findMany({
        where: baseQuery,
        include: {
          comments: {
            where: {
              createdAt: {
                gte: cutoffDate
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Filter tickets based on customer activity
      const inactiveTickets = []
      
      for (const ticket of tickets) {
        const hasRecentCustomerActivity = await this.hasRecentCustomerActivity(ticket.id, cutoffDate)
        
        if (!hasRecentCustomerActivity) {
          // For auto-close, we also need to check if warning was already sent
          if (includeWarningReceived) {
            const hasWarning = await prisma.notification.findFirst({
              where: {
                ticketId: ticket.id,
                type: 'ticket_auto_close_warning'
              }
            })
            
            // Only auto-close if warning was sent or if ticket is very old
            if (hasWarning || ticket.createdAt < new Date(Date.now() - (this.config.daysUntilAutoClose + 7) * 24 * 60 * 60 * 1000)) {
              inactiveTickets.push(ticket)
            }
          } else {
            inactiveTickets.push(ticket)
          }
        }
      }

      return inactiveTickets
    } catch (error) {
      console.error('Error finding inactive tickets:', error)
      return []
    }
  }

  private async hasRecentCustomerActivity(ticketId: string, sinceDate: Date): Promise<boolean> {
    try {
      // Check for external comments (from customers) since the cutoff date
      const externalComments = await prisma.comment.count({
        where: {
          ticketId,
          type: 'external',
          createdAt: {
            gte: sinceDate
          }
        }
      })

      return externalComments > 0
    } catch (error) {
      console.error('Error checking customer activity:', error)
      return true // Err on the side of caution
    }
  }

  private async sendCustomerWarningEmail(ticket: { 
    id: string
    ticketNumber: string | null
    subject: string
    fromEmail: string
    fromName: string | null
  }) {
    try {
      // Get all participants for this ticket
      const participants = await prisma.ticketParticipant.findMany({
        where: { ticketId: ticket.id }
      })

      if (participants.length === 0) {
        // Fallback to fromEmail if no participants
        if (ticket.fromEmail) {
          participants.push({
            email: ticket.fromEmail,
            name: ticket.fromName || ticket.fromEmail,
            type: 'creator'
          })
        }
      }

      for (const participant of participants) {
        try {
          const warningEmailContent = `
Dear ${participant.name || 'Customer'},

This is an automated notification regarding your support ticket.

Ticket: ${ticket.ticketNumber || ticket.id}
Subject: ${ticket.subject}

Your ticket will be automatically closed in ${this.config.daysUntilAutoClose - this.config.daysUntilWarning} days due to inactivity. 

If you still need assistance with this issue, please reply to this email or log into the support portal to add a comment to your ticket.

If your issue has been resolved, no action is needed and the ticket will be closed automatically.

Thank you for using our support system.

Best regards,
Support Team
          `.trim()

          await sendExternalEmail({
            to: participant.email,
            toName: participant.name || undefined,
            subject: 'Ticket will be closed soon',
            content: warningEmailContent,
            ticketNumber: ticket.ticketNumber || ticket.id
          })

          console.log(`Sent warning email to ${participant.email} for ticket ${ticket.ticketNumber || ticket.id}`)
        } catch (error) {
          console.error(`Failed to send warning email to ${participant.email}:`, error)
        }
      }
    } catch (error) {
      console.error('Error sending customer warning emails:', error)
    }
  }

  private async sendCustomerAutoCloseEmail(ticket: {
    id: string
    ticketNumber: string | null
    subject: string
    fromEmail: string
    fromName: string | null
  }) {
    try {
      // Get all participants for this ticket
      const participants = await prisma.ticketParticipant.findMany({
        where: { ticketId: ticket.id }
      })

      if (participants.length === 0) {
        // Fallback to fromEmail if no participants
        if (ticket.fromEmail) {
          participants.push({
            email: ticket.fromEmail,
            name: ticket.fromName || ticket.fromEmail,
            type: 'creator'
          })
        }
      }

      for (const participant of participants) {
        try {
          const autoCloseEmailContent = `
Dear ${participant.name || 'Customer'},

This is an automated notification regarding your support ticket.

Ticket: ${ticket.ticketNumber || ticket.id}
Subject: ${ticket.subject}

Your ticket has been automatically closed due to ${this.config.daysUntilAutoClose} days of inactivity from your side.

If you still need assistance with this issue, please create a new support ticket or reply to this email.

Thank you for using our support system.

Best regards,
Support Team
          `.trim()

          await sendExternalEmail({
            to: participant.email,
            toName: participant.name || undefined,
            subject: 'Ticket has been closed',
            content: autoCloseEmailContent,
            ticketNumber: ticket.ticketNumber || ticket.id
          })

          console.log(`Sent auto-close email to ${participant.email} for ticket ${ticket.ticketNumber || ticket.id}`)
        } catch (error) {
          console.error(`Failed to send auto-close email to ${participant.email}:`, error)
        }
      }
    } catch (error) {
      console.error('Error sending customer auto-close emails:', error)
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      hasInterval: this.interval !== null
    }
  }

  // Manual trigger for testing or admin use
  async triggerProcessing() {
    if (!this.config.enabled) {
      throw new Error('Ticket automation is disabled')
    }
    
    await this.processTickets()
  }

  // Reload configuration from database
  async reloadConfig() {
    const oldInterval = this.config.checkIntervalMinutes
    await this.loadConfig()
    
    // If automation is enabled and interval changed, restart the service
    if (this.config.enabled && this.isRunning && oldInterval !== this.config.checkIntervalMinutes) {
      console.log('Automation config changed, restarting service...')
      this.stop()
      await this.start()
    } else if (!this.config.enabled && this.isRunning) {
      console.log('Automation disabled, stopping service...')
      this.stop()
    } else if (this.config.enabled && !this.isRunning) {
      console.log('Automation enabled, starting service...')
      await this.start()
    }
  }
}

// Singleton instance
export const ticketAutomationManager = new TicketAutomationManager()

// Auto-start when the module is imported (server-side only)
if (typeof window === 'undefined') {
  ticketAutomationManager.start().catch(console.error)
}

// Export for manual use
export { TicketAutomationManager }