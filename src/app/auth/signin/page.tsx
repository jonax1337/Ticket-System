import { Suspense } from 'react'
import SignInForm from '@/components/auth/signin-form'

function SignInFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="animate-pulse">
          <div className="bg-card rounded-lg shadow p-6">
            <div className="h-4 bg-muted rounded mb-4"></div>
            <div className="h-4 bg-muted rounded mb-6 w-3/4"></div>
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  )
}