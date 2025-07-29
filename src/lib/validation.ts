// Input validation utilities for security and consistency

export function sanitizeString(value: unknown, maxLength = 1000): string {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim().substring(0, maxLength)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .substring(0, 50000) // Limit HTML content length
}

export function validateAndSanitizeTicketData(data: Record<string, unknown>) {
  return {
    subject: sanitizeString(data.subject, 255),
    description: sanitizeString(data.description, 10000),
    fromEmail: data.fromEmail ? sanitizeString(data.fromEmail, 255) : 'internal@support.com',
    fromName: data.fromName ? sanitizeString(data.fromName, 255) : 'Internal Support',
    status: sanitizeString(data.status, 50) || 'Open',
    priority: sanitizeString(data.priority, 50) || 'Medium',
    htmlContent: data.htmlContent ? sanitizeHtml(data.htmlContent as string) : null
  }
}

export function validateTicketCreation(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.subject || sanitizeString(data.subject).length === 0) {
    errors.push('Subject is required')
  }
  
  if (!data.description || sanitizeString(data.description).length === 0) {
    errors.push('Description is required')
  }
  
  if (data.fromEmail && !validateEmail(sanitizeString(data.fromEmail))) {
    errors.push('Invalid email format')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateCommentData(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.content || sanitizeString(data.content).length === 0) {
    errors.push('Comment content is required')
  }
  
  if (data.type && !['internal', 'external'].includes(data.type as string)) {
    errors.push('Invalid comment type')
  }
  
  if (data.type === 'external' && (!data.selectedParticipants || (data.selectedParticipants as unknown[]).length === 0)) {
    errors.push('External comments require at least one participant')
  }
  
  if (data.selectedParticipants) {
    const invalidEmails = (data.selectedParticipants as unknown[]).filter((email: unknown) => 
      typeof email !== 'string' || !validateEmail(email)
    )
    if (invalidEmails.length > 0) {
      errors.push('Invalid email addresses in participants')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}