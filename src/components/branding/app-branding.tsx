'use client'

import { useAppSettings } from '@/hooks/use-app-settings'
import { TicketIcon } from 'lucide-react'
import Image from 'next/image'

interface AppBrandingProps {
  showFallbackIcon?: boolean
  className?: string
}

export function AppBranding({ showFallbackIcon = true, className = "" }: AppBrandingProps) {
  const { settings, isLoading } = useAppSettings()

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 font-medium ${className}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted animate-pulse">
          <div className="size-6 bg-muted-foreground/50 rounded"></div>
        </div>
        <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className={`flex items-center gap-2 font-medium ${className}`}>
        {showFallbackIcon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TicketIcon className="size-6" />
          </div>
        )}
        <span>Support Dashboard</span>
      </div>
    )
  }

  const hasLogo = settings.logoUrl && settings.logoUrl.trim() !== ''
  const showAppName = !settings.hideAppName || !hasLogo

  return (
    <div className={`flex items-center gap-2 font-medium ${className}`}>
      {hasLogo ? (
        <Image
          src={settings.logoUrl!}
          alt={`${settings.appName} logo`}
          width={0}
          height={0}
          sizes="100vw"
          className="h-10 sm:h-12 w-auto object-contain"
        />
      ) : showFallbackIcon ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <TicketIcon className="size-6" />
        </div>
      ) : null}
      
      {showAppName && <span>{settings.appName}</span>}
      
    </div>
  )
}