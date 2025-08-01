import { SetupForm } from "@/components/auth/setup-form"
import { AppThemeProvider } from "@/components/providers/app-theme-provider"

export default function SetupPage() {
  return (
    <AppThemeProvider>
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
        <div className="w-full max-w-xs">
          <SetupForm />
        </div>
      </div>
    </AppThemeProvider>
  )
}