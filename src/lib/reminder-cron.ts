import { checkTicketReminders } from './notification-service'

let isRunning = false
let intervalId: NodeJS.Timeout | null = null

// Check reminders every hour (3600000 ms)
const CHECK_INTERVAL = 60 * 60 * 1000

async function runReminderCheck() {
  if (isRunning) {
    console.log('Reminder check already running, skipping...')
    return
  }
  
  isRunning = true
  
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
  
  console.log(`Reminder cron started with ${CHECK_INTERVAL / 1000 / 60} minute interval`)
}

function stopReminderCron() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    console.log('Reminder cron stopped')
  }
}

// Start automatically when module is imported
if (typeof window === 'undefined') { // Only run on server side
  startReminderCron()
}

export {
  startReminderCron,
  stopReminderCron,
  runReminderCheck
}