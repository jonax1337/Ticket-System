import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import CustomPriorityManager from '@/components/dashboard/custom-priority-manager'

export default async function PrioritiesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Priority Management</h1>
        <p className="text-muted-foreground">
          Configure custom priorities for your tickets. These will be available in all priority dropdowns.
        </p>
      </div>
      
      <CustomPriorityManager />
    </div>
  )
}