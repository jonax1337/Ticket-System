import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AdminSettings from '@/components/dashboard/admin-settings'
import InboxSettings from '@/components/dashboard/inbox-settings'

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
      data: { id: 'system' }
    })
  }

  // Get inbox configurations (with fallback for new installations)
  let inboxes: any[] = []
  let priorities: any[] = []
  let statuses: any[] = []
  let users: any[] = []

  try {
    inboxes = await (prisma as any).inboxConfiguration.findMany({
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.log('InboxConfiguration table not yet available')
  }

  try {
    // Get priorities and statuses for inbox default settings
    priorities = await prisma.customPriority.findMany({
      orderBy: { order: 'asc' }
    })

    statuses = await prisma.customStatus.findMany({
      orderBy: { order: 'asc' }
    })

    // Get users for default assignee
    users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.log('Error loading additional data:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage system-wide settings and appearance.
        </p>
      </div>
      <AdminSettings settings={settings} />
      <InboxSettings 
        inboxes={inboxes} 
        priorities={priorities} 
        statuses={statuses} 
        users={users} 
      />
    </div>
  )
}