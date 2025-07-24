import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AdminSettings from '@/components/dashboard/admin-settings'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage system-wide settings and appearance.
        </p>
      </div>
      <AdminSettings settings={settings} />
    </div>
  )
}