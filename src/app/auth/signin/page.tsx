import { Suspense } from 'react'
import { SignInForm } from '@/components/auth/signin-form'
import { AppThemeProvider } from "@/components/providers/app-theme-provider"

function SignInFallback() {
  return (
    <AppThemeProvider>
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
        <div className="w-full max-w-xs">
          <div className="animate-pulse flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 bg-muted rounded-md"></div>
              <div className="h-6 bg-muted rounded w-48"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </div>
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
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
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
          <div className="w-full max-w-xs">
            <SignInForm />
          </div>
        </div>
      </Suspense>
    </AppThemeProvider>
  )
}