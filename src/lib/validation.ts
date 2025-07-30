// Input validation utilities for security and consistency
import { APP_CONFIG } from './config'

export function sanitizeString(value: unknown, maxLength?: number): string {
  if (typeof value !== 'string') {
    return ''
  }
  const limit = maxLength ?? APP_CONFIG.validation.maxStringLength.description
  return value.trim().substring(0, limit)
}

export function validateEmail(email: string): boolean {
  return APP_CONFIG.security.emailRegex.test(email)
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .substring(0, APP_CONFIG.validation.maxStringLength.htmlContent)
}

export function validateAndSanitizeTicketData(data: Record<string, unknown>) {
  return {
    subject: sanitizeString(data.subject, APP_CONFIG.validation.maxStringLength.subject),
    description: sanitizeString(data.description, APP_CONFIG.validation.maxStringLength.description),
    fromEmail: data.fromEmail ? sanitizeString(data.fromEmail, APP_CONFIG.validation.maxStringLength.email) : 'internal@support.com',
    fromName: data.fromName ? sanitizeString(data.fromName, APP_CONFIG.validation.maxStringLength.name) : 'Internal Support',
    status: sanitizeString(data.status, APP_CONFIG.validation.maxStringLength.status) || 'Open',
    priority: sanitizeString(data.priority, APP_CONFIG.validation.maxStringLength.priority) || 'Medium',
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