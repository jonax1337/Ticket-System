import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import CustomStatusManager from '@/components/dashboard/custom-status-manager'

export default async function StatusesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Status Management</h1>
        <p className="text-muted-foreground">
          Configure custom statuses for your tickets. These will be available in all status dropdowns.
        </p>
      </div>
      
      <CustomStatusManager />
    </div>
  )
}