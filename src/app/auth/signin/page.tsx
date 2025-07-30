import { Suspense } from 'react'
import { SignInForm } from '@/components/auth/signin-form'
import { Boxes } from "@/components/ui/shadcn-io/background-boxes"
import { AppBranding } from "@/components/branding/app-branding"
import { AppThemeProvider } from "@/components/providers/app-theme-provider"
import { cn } from "@/lib/utils"

function SignInFallback() {
  return (
    <AppThemeProvider>
      <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-background p-6 md:p-10">
        <div className="absolute inset-0 w-full h-full bg-background z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
        <Boxes />
        <div className="absolute top-6 left-6 z-20">
          <AppBranding />
        </div>
        <div className="w-full max-w-sm z-30 relative">
          <div className="animate-pulse flex flex-col gap-6">
            <div className="bg-card rounded-lg overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-6 md:p-8">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 bg-muted rounded w-32"></div>
                      <div className="h-4 bg-muted rounded w-48"></div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-10 bg-muted rounded"></div>
                      <div className="h-10 bg-muted rounded"></div>
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block bg-muted animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppThemeProvider>
  )
}

export default function SignInPage() {
  return (
    <AppThemeProvider>
      <Suspense fallback={<SignInFallback />}>
        <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-background p-6 md:p-10">
          <div className="absolute inset-0 w-full h-full bg-background z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
          <Boxes />
          <div className="absolute top-6 left-6 z-20">
            <AppBranding />
          </div>
          <div className="w-full max-w-sm z-30 relative">
            <SignInForm />
          </div>
        </div>
      </Suspense>
    </AppThemeProvider>
  )
}