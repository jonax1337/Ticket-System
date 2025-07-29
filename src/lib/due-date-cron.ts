import { checkTicketDueDates } from './notification-service'

// Use global variable to prevent multiple cron instances across hot reloads
declare global {
  var __due_date_cron_id: NodeJS.Timeout | null | undefined
  var __due_date_cron_running: boolean | undefined
}

let isRunning = globalThis.__due_date_cron_running ?? false
let intervalId = globalThis.__due_date_cron_id ?? null

// Check due dates every hour (3600000 ms)
const CHECK_INTERVAL = 60 * 60 * 1000

async function runDueDateCheck() {
  if (isRunning) {
    console.log('Due date check already running, skipping...')
    return
  }
  
  isRunning = true
  globalThis.__due_date_cron_running = true
  
  try {
    console.log('Starting due date check...')
    const result = await checkTicketDueDates()
    
    if (result.dueSoonCount > 0 || result.overdueCount > 0) {
      console.log(`Due date check completed: ${result.dueSoonCount} due soon notifications, ${result.overdueCount} overdue notifications sent`)
    } else {
      console.log('Due date check completed: No notifications needed')
    }
  } catch (error) {
    console.error('Error during due date check:', error)
  } finally {
    isRunning = false
    globalThis.__due_date_cron_running = false
  }
}

function startDueDateCron() {
  if (intervalId) {
    console.log('Due date cron already running')
    return
  }
  
  console.log('Starting due date cron manager...')
  
  // Run initial check after 10 seconds
  setTimeout(() => {
    runDueDateCheck()
  }, 10000)
  
  // Set up recurring check
  intervalId = setInterval(() => {
    runDueDateCheck()
  }, CHECK_INTERVAL)
  
  // Store in global for hot reload persistence
  globalThis.__due_date_cron_id = intervalId
  
  console.log(`Due date cron started with ${CHECK_INTERVAL / 1000 / 60} minute interval`)
}

function stopDueDateCron() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    globalThis.__due_date_cron_id = null
    console.log('Due date cron stopped')
  }
}

// Export functions but don't auto-start
// The cron should be explicitly started from a single entry point
// if (typeof window === 'undefined') { // Only run on server side
//   startDueDateCron()
// }

export {
  startDueDateCron,
  stopDueDateCron,
  runDueDateCheck
}