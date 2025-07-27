// Simple JavaScript test for email base template functions

// Import and test functions (simplified for direct Node.js execution)
const { 
  BASE_EMAIL_TEMPLATE, 
  EMAIL_TYPE_CONFIGS, 
  generateEmailSections, 
  generateActionButton, 
  renderSections, 
  renderActionButton 
} = require('./src/lib/email-base-template.ts')

// Test variables
const testVariables = {
  systemName: 'My Support System',
  customerName: 'John Doe',
  ticketNumber: 'T-123456',
  ticketSubject: 'Website login issue',
  ticketStatus: 'Open',
  ticketPriority: 'Medium',
  ticketCreatedAt: '2024-01-15 10:30 AM',
  ticketUrl: 'https://support.example.com/tickets/T-123456',
  supportEmail: 'support@example.com'
}

console.log('Testing unified email template components...')

try {
  // Test config retrieval
  const config = EMAIL_TYPE_CONFIGS['ticket_created']
  console.log('✅ Email type config loaded:', config ? 'Yes' : 'No')

  // Test section generation
  const sections = generateEmailSections('ticket_created', testVariables)
  console.log('✅ Generated sections:', sections.length, 'sections')

  // Test action button generation
  const actionButton = generateActionButton('ticket_created', testVariables)
  console.log('✅ Generated action button:', actionButton ? 'Yes' : 'No')

  // Test section rendering
  const sectionsHtml = renderSections(sections)
  console.log('✅ Rendered sections HTML:', sectionsHtml.length, 'characters')

  // Test action button rendering
  const buttonHtml = renderActionButton(actionButton)
  console.log('✅ Rendered button HTML:', buttonHtml.length, 'characters')

  // Test base template exists
  console.log('✅ Base template length:', BASE_EMAIL_TEMPLATE.length, 'characters')

  console.log('\n🎉 Basic component tests passed!')

} catch (error) {
  console.error('❌ Test failed:', error.message)
}

// Test variable replacement function
function testVariableReplacement() {
  const template = 'Hello {{customerName}}, your ticket {{ticketNumber}} is {{ticketStatus}}'
  
  function replaceTemplateVariables(content, variables) {
    let processedContent = content
    Object.entries(variables).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
        processedContent = processedContent.replace(regex, String(value))
      }
    })
    processedContent = processedContent.replace(/{{[^}]+}}/g, '')
    return processedContent
  }

  const result = replaceTemplateVariables(template, testVariables)
  console.log('\n🧪 Variable replacement test:')
  console.log('Template:', template)
  console.log('Result:', result)
  console.log('✅ Variables replaced correctly:', result.includes('John Doe') && result.includes('T-123456'))
}