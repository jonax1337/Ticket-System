// This file is imported to ensure email cron manager starts automatically
import './email-cron'
// Import automation service to start it automatically
import './automation-service'

// Export something to make this a proper module
export const startup = true