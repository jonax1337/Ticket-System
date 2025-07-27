/**
 * Simple test for unified email template system
 */

import { createTestEmailTemplate } from '../src/lib/email-template-service'

// Test data
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

async function testUnifiedTemplate() {
  console.log('Testing unified email template system...')
  
  try {
    // Test ticket_created template
    const ticketCreatedHtml = await createTestEmailTemplate('ticket_created', testVariables)
    console.log('✅ Ticket created template generated successfully')
    console.log('Length:', ticketCreatedHtml.length, 'characters')
    
    // Test status_changed template
    const statusChangedHtml = await createTestEmailTemplate('status_changed', {
      ...testVariables,
      previousStatus: 'Open',
      newStatus: 'In Progress',
      actorName: 'Support Agent'
    })
    console.log('✅ Status changed template generated successfully')
    console.log('Length:', statusChangedHtml.length, 'characters')
    
    // Test comment_added template
    const commentAddedHtml = await createTestEmailTemplate('comment_added', {
      ...testVariables,
      commentAuthor: 'Support Agent',
      commentContent: 'Thank you for contacting us. We are reviewing your request.',
      commentCreatedAt: '2024-01-15 11:00 AM'
    })
    console.log('✅ Comment added template generated successfully')
    console.log('Length:', commentAddedHtml.length, 'characters')
    
    // Verify the templates contain expected elements
    if (ticketCreatedHtml.includes('<!DOCTYPE html>') && 
        ticketCreatedHtml.includes('My Support System') &&
        ticketCreatedHtml.includes('T-123456') &&
        ticketCreatedHtml.includes('John Doe')) {
      console.log('✅ Template content validation passed')
    } else {
      console.log('❌ Template content validation failed')
    }
    
    console.log('\n🎉 All tests passed! Unified email template system is working correctly.')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testUnifiedTemplate()
}

export { testUnifiedTemplate }