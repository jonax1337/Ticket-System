import { checkTicketReminders } from './notification-service'

// Use global variable to prevent multiple cron instances across hot reloads
declare global {
  var __reminder_cron_id: NodeJS.Timeout | null | undefined
  var __reminder_cron_running: boolean | undefined
}

let isRunning = globalThis.__reminder_cron_running ?? false
let intervalId = globalThis.__reminder_cron_id ?? null

// Check reminders every hour (3600000 ms)
const CHECK_INTERVAL = 60 * 60 * 1000

async function runReminderCheck() {
  if (isRunning) {
    console.log('Reminder check already running, skipping...')
    return
  }
  
  isRunning = true
  globalThis.__reminder_cron_running = true
  
  try {
    console.log('Starting reminder check...')
    const result = await checkTicketReminders()
    
    if (result.reminderCount > 0) {
      console.log(`Reminder check completed: ${result.reminderCount} reminder notifications sent`)
    } else {
      console.log('Reminder check completed: No notifications needed')
    }
  } catch (error) {
    console.error('Error during reminder check:', error)
  } finally {
    isRunning = false
    globalThis.__reminder_cron_running = false
  }
}

function startReminderCron() {
  if (intervalId) {
    console.log('Reminder cron already running')
    return
  }
  
  console.log('Starting reminder cron manager...')
  
  // Run initial check after 15 seconds (to avoid conflicts with due date cron)
  setTimeout(() => {
    runReminderCheck()
  }, 15000)
  
  // Set up recurring check
  intervalId = setInterval(() => {
    runReminderCheck()
  }, CHECK_INTERVAL)
  
  // Store in global for hot reload persistence
  globalThis.__reminder_cron_id = intervalId
  
  console.log(`Reminder cron started with ${CHECK_INTERVAL / 1000 / 60} minute interval`)
}

function stopReminderCron() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    globalThis.__reminder_cron_id = null
    console.log('Reminder cron stopped')
  }
}

// Export functions but don't auto-start
// The cron should be explicitly started from a single entry point
// if (typeof window === 'undefined') { // Only run on server side
//   startReminderCron()
// }

export {
  startReminderCron,
  stopReminderCron,
  runReminderCheck
}