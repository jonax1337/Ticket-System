#!/usr/bin/env node

/**
 * Email Template System Demo
 * 
 * This script demonstrates the email template system functionality
 * Run with: node demo-email-templates.js
 */

const { replaceTemplateVariables, getAvailableTemplateVariables } = require('./src/lib/email-template-service')

// Sample template content
const sampleTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{ticketNumber}} - {{systemName}}</title>
</head>
<body>
  <h1>Hello {{customerName}},</h1>
  
  <p>Thank you for contacting {{systemName}}. Your ticket has been created successfully.</p>
  
  <div style="background-color: #f8fafc; padding: 15px; margin: 20px 0;">
    <h3>Ticket Details</h3>
    <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
    <p><strong>Subject:</strong> {{ticketSubject}}</p>
    <p><strong>Status:</strong> {{ticketStatus}}</p>
    <p><strong>Priority:</strong> {{ticketPriority}}</p>
    <p><strong>Created:</strong> {{ticketCreatedAt}}</p>
  </div>
  
  <p>Our support team will review your request and respond as soon as possible.</p>
  
  <p>Best regards,<br>{{systemName}} Support Team</p>
  
  <hr>
  <p style="font-size: 12px; color: #666;">
    This email was sent from {{systemName}} on {{currentDate}} at {{currentTime}}.
  </p>
</body>
</html>
`

// Sample variables
const sampleVariables = {
  ticketNumber: 'T-123456',
  ticketSubject: 'Login issue with user account',
  ticketStatus: 'Open',
  ticketPriority: 'High',
  ticketCreatedAt: '2024-01-15 14:30:00',
  customerName: 'John Doe',
  systemName: 'Support Portal',
  currentDate: '2024-01-15',
  currentTime: '14:30:00'
}

console.log('🎯 Email Template System Demo')
console.log('================================\n')

console.log('📧 Sample Template:')
console.log(sampleTemplate)
console.log('\n' + '='.repeat(80) + '\n')

console.log('📝 Sample Variables:')
console.log(JSON.stringify(sampleVariables, null, 2))
console.log('\n' + '='.repeat(80) + '\n')

console.log('✨ Rendered Result:')
const renderedContent = replaceTemplateVariables(sampleTemplate, sampleVariables)
console.log(renderedContent)
console.log('\n' + '='.repeat(80) + '\n')

console.log('📚 Available Variables:')
const availableVars = getAvailableTemplateVariables()
Object.entries(availableVars).forEach(([variable, description]) => {
  console.log(`  {{${variable}}} - ${description}`)
})

console.log('\n✅ Demo completed successfully!')
console.log('\nTo use the email template system:')
console.log('1. Navigate to Admin → Templates in the dashboard')
console.log('2. Create or edit email templates')
console.log('3. Use variables like {{ticketNumber}} in your content')
console.log('4. Preview templates with sample data')
console.log('5. Templates are automatically used for ticket notifications')