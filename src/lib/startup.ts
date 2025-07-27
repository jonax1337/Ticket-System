// This file is imported to ensure email cron manager starts automatically
import './email-cron'
import './automation-service'
import './due-date-cron'
import './reminder-cron'

import { createDefaultEmailTemplates } from './email-template-service'

// Initialize default email templates
createDefaultEmailTemplates().catch(console.error)

// Export something to make this a proper module
export const startup = true