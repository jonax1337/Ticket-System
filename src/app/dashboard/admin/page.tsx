import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AdminTabs from '@/components/dashboard/admin-tabs'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Get or create system settings
  let settings = await prisma.systemSettings.findUnique({
    where: { id: 'system' }
  })

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: { 
        id: 'system',
        automationEnabled: true,
        automationWarningDays: 7,
        automationCloseDays: 14,
        automationCheckInterval: 60
      }
    })
  }

  // Get email configurations and related data
  let emailConfigs: Awaited<ReturnType<typeof prisma.emailConfiguration.findMany>> = []
  let priorities: Awaited<ReturnType<typeof prisma.customPriority.findMany>> = []
  let statuses: Awaited<ReturnType<typeof prisma.customStatus.findMany>> = []

  try {
    emailConfigs = await prisma.emailConfiguration.findMany({
      orderBy: { createdAt: 'desc' }
    })

    priorities = await prisma.customPriority.findMany({
      orderBy: { order: 'asc' }
    })

    statuses = await prisma.customStatus.findMany({
      orderBy: { order: 'asc' }
    })
  } catch (error) {
    console.log('Error loading email configuration data:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage system-wide settings and configuration.
        </p>
      </div>
      <AdminTabs 
        settings={settings}
        emailConfigs={emailConfigs} 
        priorities={priorities} 
        statuses={statuses} 
      />
    </div>
  )
}