/**
 * Normalize a date to midnight (00:00:00) in the local timezone
 * This ensures that due dates are always at the start of the day
 */
export function normalizeDateToMidnight(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null
  
  const date = new Date(dateInput)
  
  // Check if the date is valid
  if (isNaN(date.getTime())) return null
  
  // Set time to midnight (00:00:00.000)
  date.setHours(0, 0, 0, 0)
  
  return date
}

/**
 * Format a date for due date display (no time component)
 */
export function formatDueDate(dateInput: string | Date | null | undefined): string | null {
  const date = normalizeDateToMidnight(dateInput)
  if (!date) return null
  
  return date.toLocaleDateString()
}