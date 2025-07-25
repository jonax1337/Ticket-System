const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateTicketValues() {
  try {
    console.log('🔄 Migrating existing ticket values...')
    
    // Update status values
    const statusMappings = {
      'OPEN': 'Open',
      'IN_PROGRESS': 'In Progress', 
      'CLOSED': 'Closed'
    }
    
    for (const [oldValue, newValue] of Object.entries(statusMappings)) {
      const result = await prisma.ticket.updateMany({
        where: { status: oldValue },
        data: { status: newValue }
      })
      console.log(`✅ Updated ${result.count} tickets from status "${oldValue}" to "${newValue}"`)
    }
    
    // Update priority values
    const priorityMappings = {
      'LOW': 'Low',
      'MEDIUM': 'Medium',
      'HIGH': 'High', 
      'URGENT': 'Urgent'
    }
    
    for (const [oldValue, newValue] of Object.entries(priorityMappings)) {
      const result = await prisma.ticket.updateMany({
        where: { priority: oldValue },
        data: { priority: newValue }
      })
      console.log(`✅ Updated ${result.count} tickets from priority "${oldValue}" to "${newValue}"`)
    }
    
    // Show final count
    const totalTickets = await prisma.ticket.count()
    console.log(`\n📊 Total tickets: ${totalTickets}`)
    
    // Show current status/priority distribution
    const statusCount = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { status: true }
    })
    
    const priorityCount = await prisma.ticket.groupBy({
      by: ['priority'], 
      _count: { priority: true }
    })
    
    console.log('\n📋 Current status distribution:')
    statusCount.forEach(item => {
      console.log(`  - ${item.status}: ${item._count.status} tickets`)
    })
    
    console.log('\n⚡ Current priority distribution:')
    priorityCount.forEach(item => {
      console.log(`  - ${item.priority}: ${item._count.priority} tickets`)
    })
    
    console.log('\n🎉 Migration completed successfully!')
  } catch (error) {
    console.error('❌ Error migrating ticket values:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateTicketValues()