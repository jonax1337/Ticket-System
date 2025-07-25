import { prisma } from './prisma'

interface TicketNumberSettings {
  ticketPrefix: string
  ticketNumberType: 'sequential' | 'random'
  ticketNumberLength: number
  lastTicketNumber: number
}

export async function generateTicketNumber(): Promise<string> {
  // Get system settings
  let settings = await prisma.systemSettings.findUnique({
    where: { id: 'system' }
  })

  // Create default settings if they don't exist
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        id: 'system',
        appName: 'Support Dashboard',
        themeColor: 'default',
        ticketPrefix: 'T',
        ticketNumberType: 'sequential',
        ticketNumberLength: 6,
        lastTicketNumber: 0
      }
    })
  }

  const {
    ticketPrefix,
    ticketNumberType,
    ticketNumberLength,
    lastTicketNumber
  } = settings

  if (ticketNumberType === 'sequential') {
    return await generateSequentialNumber(ticketPrefix, ticketNumberLength, lastTicketNumber)
  } else {
    return generateRandomNumber(ticketPrefix, ticketNumberLength)
  }
}

async function generateSequentialNumber(
  prefix: string,
  length: number,
  lastNumber: number
): Promise<string> {
  const nextNumber = lastNumber + 1
  const paddedNumber = nextNumber.toString().padStart(length, '0')
  const ticketNumber = `${prefix}-${paddedNumber}`

  // Update the last ticket number in settings
  await prisma.systemSettings.update({
    where: { id: 'system' },
    data: { lastTicketNumber: nextNumber }
  })

  return ticketNumber
}

function generateRandomNumber(prefix: string, length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  
  return `${prefix}-${result}`
}

export async function ensureUniqueTicketNumber(proposedNumber: string): Promise<string> {
  let ticketNumber = proposedNumber
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const existing = await prisma.ticket.findUnique({
      where: { ticketNumber }
    })

    if (!existing) {
      return ticketNumber
    }

    // If collision, generate a new random suffix
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'system' }
    })
    
    if (settings?.ticketNumberType === 'random') {
      ticketNumber = generateRandomNumber(settings.ticketPrefix, settings.ticketNumberLength)
    } else {
      // For sequential, this shouldn't happen, but handle it anyway
      const timestamp = Date.now().toString().slice(-4)
      ticketNumber = `${proposedNumber}-${timestamp}`
    }

    attempts++
  }

  // Fallback with timestamp if all attempts failed
  return `${proposedNumber}-${Date.now().toString().slice(-6)}`
}