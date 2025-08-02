import { prisma } from './prisma'
import { generateEmailSections, EMAIL_TYPE_CONFIGS } from './email-base-template'
import { EmailTemplateType } from './email-template-service'

/**
 * Seeds the email_type_configs table with default sections
 */
export async function seedEmailTypeConfigs() {
  const emailTypes: EmailTemplateType[] = [
    'ticket_created',
    'status_changed',
    'comment_added',
    'participant_added',
    'automation_warning',
    'automation_closed'
  ]

  console.log('Starting email type config seeding...')

  for (const type of emailTypes) {
    try {
      // Get existing config
      const existingConfig = await prisma.emailTypeConfig.findUnique({
        where: { type }
      })

      // Generate default sections for this type
      const defaultSections = generateEmailSections(type, {
        // Sample variables for generation
        ticketNumber: 'T-123456',
        ticketSubject: 'Sample Subject',
        ticketStatus: 'Open',
        ticketPriority: 'High',
        ticketCreatedAt: new Date().toLocaleString(),
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        systemName: 'Support System',
        currentDate: new Date().toLocaleDateString(),
        currentTime: new Date().toLocaleTimeString(),
        previousStatus: 'Open',
        newStatus: 'In Progress',
        actorName: 'Support Agent',
        commentContent: '<p>Sample comment content</p>',
        commentAuthor: 'Support Agent',
        commentCreatedAt: new Date().toLocaleString(),
        participantName: 'Team Member',
        participantEmail: 'team@example.com',
        participantType: 'cc'
      })

      // Get default config from EMAIL_TYPE_CONFIGS
      const defaultConfig = EMAIL_TYPE_CONFIGS[type] || {}

      if (existingConfig) {
        // Update existing config only if sections are empty
        if (existingConfig.sections === '[]' || existingConfig.sections === '') {
          await prisma.emailTypeConfig.update({
            where: { type },
            data: {
              sections: JSON.stringify(defaultSections),
              headerTitle: defaultConfig.headerTitle || existingConfig.headerTitle,
              headerSubtitle: defaultConfig.headerSubtitle || existingConfig.headerSubtitle,
              headerColor: defaultConfig.headerColor || existingConfig.headerColor,
              greeting: defaultConfig.greeting || existingConfig.greeting,
              introText: defaultConfig.introText || existingConfig.introText,
              footerText: defaultConfig.footerText || existingConfig.footerText
            }
          })
          console.log(`✅ Updated email type config: ${type} with default sections`)
        } else {
          console.log(`⏭️  Skipped ${type} - sections already configured`)
        }
      } else {
        // Create new config with default sections
        await prisma.emailTypeConfig.create({
          data: {
            type,
            headerTitle: defaultConfig.headerTitle || '{{systemName}}',
            headerSubtitle: defaultConfig.headerSubtitle || 'Notification',
            headerColor: defaultConfig.headerColor || '#2563eb',
            greeting: defaultConfig.greeting || 'Hello {{customerName}},',
            introText: defaultConfig.introText || '',
            footerText: defaultConfig.footerText || 'Best regards,<br>{{systemName}} Team',
            sections: JSON.stringify(defaultSections),
            actionButton: null // No action buttons (no self-service portal)
          }
        })
        console.log(`✅ Created email type config: ${type} with default sections`)
      }
    } catch (error) {
      console.error(`❌ Error processing ${type}:`, error)
    }
  }

  console.log('Email type config seeding completed!')
}

/**
 * Updates all email type configs with default sections (overwrites existing)
 */
export async function forceUpdateEmailTypeConfigs() {
  const emailTypes: EmailTemplateType[] = [
    'ticket_created',
    'status_changed',
    'comment_added',
    'participant_added',
    'automation_warning',
    'automation_closed'
  ]

  console.log('Force updating all email type configs with default sections...')

  for (const type of emailTypes) {
    try {
      // Generate default sections for this type
      const defaultSections = generateEmailSections(type, {
        // Sample variables for generation
        ticketNumber: 'T-123456',
        ticketSubject: 'Sample Subject',
        ticketStatus: 'Open',
        ticketPriority: 'High',
        ticketCreatedAt: new Date().toLocaleString(),
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        systemName: 'Support System',
        currentDate: new Date().toLocaleDateString(),
        currentTime: new Date().toLocaleTimeString(),
        previousStatus: 'Open',
        newStatus: 'In Progress',
        actorName: 'Support Agent',
        commentContent: '<p>Sample comment content</p>',
        commentAuthor: 'Support Agent',
        commentCreatedAt: new Date().toLocaleString(),
        participantName: 'Team Member',
        participantEmail: 'team@example.com',
        participantType: 'cc'
      })

      // Update or create config
      await prisma.emailTypeConfig.upsert({
        where: { type },
        update: {
          sections: JSON.stringify(defaultSections)
        },
        create: {
          type,
          headerTitle: EMAIL_TYPE_CONFIGS[type]?.headerTitle || '{{systemName}}',
          headerSubtitle: EMAIL_TYPE_CONFIGS[type]?.headerSubtitle || 'Notification',
          headerColor: EMAIL_TYPE_CONFIGS[type]?.headerColor || '#2563eb',
          greeting: EMAIL_TYPE_CONFIGS[type]?.greeting || 'Hello {{customerName}},',
          introText: EMAIL_TYPE_CONFIGS[type]?.introText || '',
          footerText: EMAIL_TYPE_CONFIGS[type]?.footerText || 'Best regards,<br>{{systemName}} Team',
          sections: JSON.stringify(defaultSections),
          actionButton: null
        }
      })
      
      console.log(`✅ Force updated email type config: ${type}`)
    } catch (error) {
      console.error(`❌ Error updating ${type}:`, error)
    }
  }

  console.log('Force update completed!')
}

/**
 * Initialize email type configs on application startup
 * This ensures all email types have proper configurations
 */
export async function initializeEmailTypeConfigs() {
  try {
    // Check if any email type configs exist
    const existingCount = await prisma.emailTypeConfig.count()
    
    if (existingCount === 0) {
      console.log('No email type configs found. Initializing with defaults...')
      await forceUpdateEmailTypeConfigs()
    } else {
      // Check for empty sections and update them
      const emptyConfigs = await prisma.emailTypeConfig.findMany({
        where: {
          OR: [
            { sections: '[]' },
            { sections: '' }
          ]
        }
      })
      
      if (emptyConfigs.length > 0) {
        console.log(`Found ${emptyConfigs.length} email type configs with empty sections. Updating...`)
        await seedEmailTypeConfigs()
      }
    }
  } catch (error) {
    console.error('Error initializing email type configs:', error)
  }
}