import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { isSetupComplete } from '@/lib/setup'
import { prisma } from '@/lib/prisma'
import DashboardHeader from '@/components/dashboard/header'
import { AppThemeProvider } from '@/components/providers/app-theme-provider'
import AvatarUpdateProvider from '@/components/providers/avatar-update-provider'
import { CacheProvider } from '@/lib/cache-context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const setupComplete = await isSetupComplete()
  
  if (!setupComplete) {
    redirect('/setup')
  }

  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Get system settings (with fallback for migration)
  let settings
  try {
    settings = await prisma.systemSettings.findUnique({
      where: { id: 'system' }
    })

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'system' }
      })
    }
  } catch (dbError) {
    // Fallback if systemSettings table doesn't exist yet
    console.warn('SystemSettings not available, using defaults:', dbError)
    settings = {
      id: 'system',
      appName: 'Support Dashboard',
      slogan: null,
      logoUrl: null,
      hideAppName: false,
      themeColor: 'default',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  return (
    <AppThemeProvider>
      <AvatarUpdateProvider>
        <CacheProvider>
          <div className="min-h-screen bg-background">
            <DashboardHeader 
              user={session.user} 
              appName={settings.appName}
              slogan={settings.slogan}
              logoUrl={settings.logoUrl}
              hideAppName={settings.hideAppName}
            />
            <main className="container mx-auto py-6">
              {children}
            </main>
          </div>
        </CacheProvider>
      </AvatarUpdateProvider>
    </AppThemeProvider>
  )
}