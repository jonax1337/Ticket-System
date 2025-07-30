// Quick test script to check email template debug functionality
const { PrismaClient } = require('@prisma/client')
const { renderEmailTemplate } = require('./src/lib/email-template-service')

async function testEmailDebug() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing email template debug functionality...\n')
    
    // Test variables
    const testVariables = {
      systemName: 'IT Support',
      customerName: 'Jonas Laux',
      ticketNumber: 'IT-UHMRGA',
      ticketSubject: 'Test',
      ticketStatus: 'Checking',
      ticketPriority: 'Medium',
      ticketCreatedAt: new Date().toLocaleString(),
      ticketUpdatedAt: new Date().toLocaleString(),
      ticketUrl: 'http://localhost:3000/tickets/cmdo90it7000pknmgucsvnryj',
      supportEmail: 'support@example.com',
      assignedToName: 'Support Agent',
      actorName: 'Jonas Laux',
      commentAuthor: 'Jonas Laux',
      commentContent: '[EMAIL] Test',
      commentCreatedAt: '30.7.2025, 09:42:36'
    }
    
    // Test comment_added template with full debug
    console.log('Testing comment_added template with debug enabled...')
    const result = await renderEmailTemplate('comment_added', testVariables, true)
    
    if (result) {
      console.log('\n✅ Template rendering successful!')
      console.log(`Subject: ${result.subject}`)
      console.log(`HTML length: ${result.htmlContent.length}`)
      console.log(`HTML preview: ${result.htmlContent.substring(0, 300)}...`)
      
      if (result.debugInfo) {
        console.log('\n📊 Debug Information:')
        console.log(`Config source: ${result.debugInfo.configSource}`)
        console.log(`Sections count: ${result.debugInfo.finalSectionsCount}`)
        console.log(`Is unified template: ${result.debugInfo.isUnifiedTemplate}`)
        if (result.debugInfo.fallbackReason) {
          console.log(`Fallback reason: ${result.debugInfo.fallbackReason}`)
        }
      }
    } else {
      console.log('❌ Template rendering failed!')
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEmailDebug()