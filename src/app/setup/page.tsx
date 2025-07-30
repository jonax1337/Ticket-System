import { SetupForm } from "@/components/auth/setup-form"
import { Boxes } from "@/components/ui/shadcn-io/background-boxes"

export default function SetupPage() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-background p-6 md:p-10">
      <div className="absolute inset-0 w-full h-full bg-background z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
      <Boxes />
      <div className="w-full max-w-sm z-30 relative">
        <SetupForm />
      </div>
    </div>
  )
}