// This file is imported to ensure email cron manager starts automatically
import './email-cron'
import './automation-service'
import { startDueDateCron } from './due-date-cron'
import { startReminderCron } from './reminder-cron'

import { createDefaultEmailTemplates } from './email-template-service'

// Use global variable to prevent multiple initializations across hot reloads
declare global {
  var __server_initialized: boolean | undefined
}

// Prevent multiple initializations during development
const isInitialized = globalThis.__server_initialized ?? false

async function initializeServer() {
  if (isInitialized) {
    return
  }
  
  globalThis.__server_initialized = true
  
  try {
    // Initialize default email templates
    await createDefaultEmailTemplates()
    
    // Start cron jobs only once
    if (typeof window === 'undefined') { // Only run on server side
      startDueDateCron()
      startReminderCron()
    }
  } catch (error) {
    console.error('Error during server initialization:', error)
    globalThis.__server_initialized = false // Allow retry on next import
  }
}

// Initialize server components
if (typeof window === 'undefined') { // Only run on server side
  initializeServer()
}

// Export something to make this a proper module
export const startup = true