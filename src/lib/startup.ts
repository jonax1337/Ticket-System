// This file is imported to ensure email cron manager starts automatically
import './email-cron'
import './automation-service'
import './due-date-cron'
import './reminder-cron'

import { createDefaultEmailTemplates } from './email-template-service'
import { initializeEmailTypeConfigs } from './email-type-config-seeder'

// Initialize default email templates
createDefaultEmailTemplates().catch(console.error)

// Initialize email type configurations with default sections
initializeEmailTypeConfigs().catch(console.error)

// Export something to make this a proper module
export const startup = true