import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSetupComplete } from '@/lib/setup'

export default async function Home() {
  const setupComplete = await isSetupComplete()
  
  if (!setupComplete) {
    redirect('/setup')
  }

  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  redirect('/dashboard')
}
